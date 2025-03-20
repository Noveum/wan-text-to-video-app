"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useEffect, useState, useRef } from "react"
import { Download, Loader2, RefreshCw, Share2, Code, RotateCw, DollarSign, AlertTriangle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { checkVideoStatus } from "@/lib/api"
import type { VideoStatusResponse } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getHistory } from "@/lib/history"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CurlSyntaxHighlighter } from "./curl-syntax-highlighter"

interface VideoPlayerProps {
  videoId?: string
  videoUrl?: string | null
  title?: string
  initialStatus?: "pending" | "processing" | "completed" | "failed"
  onVideoReady?: (videoUrl: string, executionTime?: number) => void
  onVideoFailed?: () => void
  onVideoProcessing?: () => void
}

export function VideoPlayer({
  videoId,
  videoUrl: initialVideoUrl,
  title = "Video Player",
  initialStatus,
  onVideoReady,
  onVideoFailed,
  onVideoProcessing,
}: VideoPlayerProps) {
  const [status, setStatus] = useState<"pending" | "processing" | "completed" | "failed">(
    initialStatus || (initialVideoUrl ? "completed" : "pending"),
  )
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [requestJson, setRequestJson] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<number>(Date.now())
  const [checkCount, setCheckCount] = useState<number>(0)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [cost, setCost] = useState<number | null>(null)
  const [curlCommand, setCurlCommand] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Reset state when videoId changes
  useEffect(() => {
    if (!videoId) return

    // If we have a new videoId, reset the state
    setProgress(0)
    setError(null)
    setLastChecked(Date.now())
    setCheckCount(0)
    setExecutionTime(null)
    setCost(null)

    // Set initial status based on props or default to pending
    if (initialStatus) {
      setStatus(initialStatus)
    } else if (initialVideoUrl) {
      setStatus("completed")
    } else {
      setStatus("pending")
    }

    // Set initial video URL
    setVideoUrl(initialVideoUrl || null)

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Try to get request JSON from history
    const historyItems = getHistory()
    const item = historyItems.find((item) => item.id === videoId)
    if (item?.requestJson) {
      setRequestJson(item.requestJson)

      // Generate curl command from the request JSON
      try {
        const apiKey = localStorage.getItem("api-key") || "REPLACE_WITHCUSTOMER_API_KEY_IF_PRESENT"
        const requestData = JSON.parse(item.requestJson)
        const formattedJson = JSON.stringify(requestData, null, 2)

        const curl = `curl -X 'POST' \\
  'https://prod.api.market/api/v1/magicapi/wan-text-to-image/text-to-video/run' \\
  -H 'accept: application/json' \\
  -H 'x-magicapi-key: ${apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${formattedJson}'`

        setCurlCommand(curl)
      } catch (e) {
        console.error("Error generating curl command:", e)
      }
    }

    // If we have a videoId but no initialVideoUrl and status is not completed, start checking status
    if (!initialVideoUrl && initialStatus !== "completed") {
      checkVideoStatusNow(videoId)
    }
  }, [videoId, initialVideoUrl, initialStatus])

  // Function to manually refresh the status
  const handleRefresh = () => {
    if (!videoId) return

    toast({
      title: "Refreshing Status",
      description: "Checking for updates on your video generation...",
    })

    checkVideoStatusNow(videoId)
  }

  // Function to check video status immediately
  const checkVideoStatusNow = async (id: string) => {
    try {
      setLastChecked(Date.now())
      setCheckCount((prev) => prev + 1)

      const response: VideoStatusResponse = await checkVideoStatus(id)
      console.log("Video status response:", response)

      // Calculate cost if executionTime is available
      if (response.executionTime) {
        const execTime = response.executionTime / 1000 // Convert to seconds
        setExecutionTime(execTime)

        // Calculate cost: $0.001 per second
        const calculatedCost = execTime * 0.001
        setCost(calculatedCost)
      }

      // Handle the response
      if (response.status === "COMPLETED") {
        // Check for the nested output structure as shown in the example
        let videoUrl = null

        if (response.output?.output && Array.isArray(response.output.output) && response.output.output.length > 0) {
          // Handle the array of output URLs
          videoUrl = response.output.output[0]
        } else if (response.output?.video_url) {
          // Handle the direct video_url property
          videoUrl = response.output.video_url
        }

        if (videoUrl) {
          setStatus("completed")
          setVideoUrl(videoUrl)
          setProgress(100)

          if (onVideoReady) {
            onVideoReady(videoUrl, response.executionTime)
          }

          // Clear the interval if it exists
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }

          toast({
            title: "Video Ready",
            description: "Your video has been successfully generated!",
          })
        } else {
          // Status is COMPLETED but no video URL found
          console.error("Video status is COMPLETED but no video URL found in response:", response)
          setError("Video URL not found in completed response")

          // Keep checking in case this is a temporary issue
          scheduleNextCheck(id, 10000) // Check again in 10 seconds
        }
      } else if (response.status === "FAILED") {
        setStatus("failed")
        setError("Video generation failed")

        if (onVideoFailed) {
          onVideoFailed()
        }

        // Clear the interval if it exists
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else if (response.status === "IN_PROGRESS") {
        setStatus("processing")

        // Calculate progress based on time elapsed and delayTime
        const estimatedTime = response.delayTime || 900000 // Default to 15 minutes if no delayTime
        const startTime = Date.now() - checkCount * 5000 // Rough estimate of when we started
        const elapsed = Date.now() - startTime
        const calculatedProgress = Math.min(Math.floor((elapsed / estimatedTime) * 100), 95)
        setProgress(calculatedProgress)

        if (onVideoProcessing) {
          onVideoProcessing()
        }

        // Schedule the next check with adaptive timing
        const nextCheckDelay = calculateNextCheckDelay(calculatedProgress)
        scheduleNextCheck(id, nextCheckDelay)
      } else {
        // Unknown status, keep checking
        console.log("Unknown status:", response.status)
        scheduleNextCheck(id, 10000) // Check again in 10 seconds
      }
    } catch (error) {
      console.error("Error checking video status:", error)
      setError("Failed to check video status")

      // Schedule a retry after a longer delay
      scheduleNextCheck(id, 15000) // Retry after 15 seconds
    }
  }

  // Calculate the delay for the next check based on progress
  const calculateNextCheckDelay = (progress: number): number => {
    if (progress < 20) {
      return 5000 // Check every 5 seconds at the beginning
    } else if (progress < 50) {
      return 10000 // Check every 10 seconds in the middle
    } else if (progress < 80) {
      return 20000 // Check every 20 seconds when getting closer
    } else {
      return 30000 // Check every 30 seconds when almost done
    }
  }

  // Schedule the next status check
  const scheduleNextCheck = (id: string, delay: number) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set a new interval
    intervalRef.current = setTimeout(() => {
      checkVideoStatusNow(id)
    }, delay)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleShare = () => {
    if (videoUrl) {
      navigator.clipboard
        .writeText(videoUrl)
        .then(() => {
          toast({
            title: "URL Copied",
            description: "Video URL has been copied to clipboard",
          })
        })
        .catch((err) => {
          console.error("Could not copy URL: ", err)
          toast({
            title: "Copy Failed",
            description: "Could not copy URL to clipboard",
            variant: "destructive",
          })
        })
    }
  }

  const timeAgo = () => {
    const seconds = Math.floor((Date.now() - lastChecked) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  return (
    <Card className="w-full bg-card border border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              {title}
              {cost !== null && (
                <Badge
                  variant="outline"
                  className="ml-2 bg-primary/10 text-primary dark:text-white dark:bg-primary/30 dark:border-primary/40"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCost(cost)}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {status === "pending" && "Your video is in queue..."}
              {status === "processing" && "Your video is being generated..."}
              {status === "completed" && "Your video is ready!"}
              {status === "failed" && "Video generation failed"}
              {executionTime !== null && status === "completed" && (
                <span className="ml-1">(Generated in {executionTime.toFixed(1)}s)</span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {(status === "pending" || status === "processing") && videoId && (
              <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 border border-input">
                <RotateCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
            {requestJson && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border border-input">
                    <Code className="mr-2 h-4 w-4" />
                    View Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Generation Request</DialogTitle>
                    <DialogDescription>The cURL command and JSON payload used to generate this video</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">cURL Command</h3>
                      <CurlSyntaxHighlighter code={curlCommand || ""} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-2">JSON Payload</h3>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">{requestJson}</pre>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(status === "pending" || status === "processing") && (
          <div className="space-y-4">
            <Progress value={progress} className="w-full h-2 progress-bar" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <p>{status === "pending" ? "Waiting in queue..." : `Processing: ${progress}%`}</p>
              <p>Last checked: {timeAgo()}</p>
            </div>
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground/70" />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Video generation can take 2-15 minutes. You can leave this page and check back later.
            </p>

            <Alert
              variant="warning"
              className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-300">Important</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                <p className="text-xs">
                  Requests are deleted after 30 minutes and videos after 24 hours.{" "}
                  <Link href="/info" className="text-primary hover:text-primary/80 dark:hover:text-white underline">
                    Learn more
                  </Link>
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {status === "completed" && videoUrl && (
          <div className="space-y-4">
            <div className="aspect-video overflow-hidden rounded-md bg-black">
              <video src={videoUrl} controls className="h-full w-full" autoPlay loop />
            </div>

            <Alert
              variant="warning"
              className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
            >
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-800 dark:text-amber-300">Video Expiration</AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                <p className="text-xs">
                  This video URL will expire after 24 hours. Please download it now to keep it.{" "}
                  <Link href="/info" className="text-primary hover:text-primary/80 dark:hover:text-white underline">
                    Learn more
                  </Link>
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {status === "failed" && (
          <div className="aspect-video bg-black/5 dark:bg-black/20 rounded-md flex flex-col items-center justify-center p-4 text-center text-destructive">
            <RefreshCw className="h-12 w-12 mb-4" />
            <p className="font-medium">{error || "An error occurred during video generation"}</p>
            <p className="text-sm text-muted-foreground mt-2">Try generating a new video with different parameters</p>
          </div>
        )}
      </CardContent>

      {status === "completed" && videoUrl && (
        <CardFooter className="flex flex-wrap gap-2 pt-2">
          <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-white button-primary">
            <a href={videoUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </a>
          </Button>
          <Button variant="outline" onClick={handleShare} className="bg-background border border-input">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

