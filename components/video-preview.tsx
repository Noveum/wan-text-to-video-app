"use client"

import { useEffect, useState } from "react"
import { Download, Loader2, DollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { checkVideoStatus } from "@/lib/api"
import type { VideoStatusResponse } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface VideoPreviewProps {
  videoId: string
  onStatusUpdate?: (
    status: "pending" | "processing" | "completed" | "failed",
    videoUrl?: string,
    executionTime?: number,
  ) => void
}

export function VideoPreview({ videoId, onStatusUpdate }: VideoPreviewProps) {
  const [status, setStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending")
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [cost, setCost] = useState<number | null>(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout
    const startTime = Date.now()
    let estimatedTime = 300000 // 5 minutes as default

    const checkStatus = async () => {
      try {
        const response: VideoStatusResponse = await checkVideoStatus(videoId)

        // Calculate cost if executionTime is available
        if (response.executionTime) {
          const execTime = response.executionTime / 1000 // Convert to seconds
          setExecutionTime(execTime)

          // Calculate cost: $0.001 per second
          const calculatedCost = execTime * 0.001
          setCost(calculatedCost)
        }

        if (response.status === "COMPLETED" && response.output?.video_url) {
          setStatus("completed")
          setVideoUrl(response.output.video_url)
          setProgress(100)
          clearInterval(intervalId)

          if (onStatusUpdate) {
            onStatusUpdate("completed", response.output.video_url, response.executionTime)
          }
        } else if (response.status === "FAILED") {
          setStatus("failed")
          setError("Video generation failed")
          clearInterval(intervalId)

          if (onStatusUpdate) {
            onStatusUpdate("failed")
          }
        } else if (response.status === "IN_PROGRESS") {
          setStatus("processing")

          // Calculate progress based on time elapsed
          if (response.delayTime) {
            estimatedTime = response.delayTime
          }

          const elapsed = Date.now() - startTime
          const calculatedProgress = Math.min(Math.floor((elapsed / estimatedTime) * 100), 95)
          setProgress(calculatedProgress)

          if (onStatusUpdate) {
            onStatusUpdate("processing")
          }
        }
      } catch (error) {
        console.error("Error checking video status:", error)
        setError("Failed to check video status")
      }
    }

    // Check immediately and then every 5 seconds
    checkStatus()
    intervalId = setInterval(checkStatus, 5000)

    return () => clearInterval(intervalId)
  }, [videoId, onStatusUpdate])

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Video Generation Status</CardTitle>
            <CardDescription>
              {status === "pending" && "Your video is in queue..."}
              {status === "processing" && "Your video is being generated..."}
              {status === "completed" && "Your video is ready!"}
              {status === "failed" && "Video generation failed"}
            </CardDescription>
          </div>
          {cost !== null && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCost(cost)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(status === "pending" || status === "processing") && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {status === "pending" ? "Waiting in queue..." : `Processing: ${progress}%`}
            </p>
          </div>
        )}

        {status === "completed" && videoUrl && (
          <div className="aspect-video overflow-hidden rounded-md bg-black">
            <video src={videoUrl} controls className="h-full w-full" autoPlay loop />
          </div>
        )}

        {status === "failed" && (
          <div className="p-4 text-center text-destructive">
            <p>{error || "An error occurred during video generation"}</p>
          </div>
        )}
      </CardContent>

      {status === "completed" && videoUrl && (
        <CardFooter>
          <Button asChild className="w-full bg-primary hover:bg-primary/90">
            <a href={videoUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </a>
          </Button>
        </CardFooter>
      )}

      {(status === "pending" || status === "processing") && (
        <CardFooter>
          <div className="flex items-center justify-center w-full text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>This may take a few minutes</span>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

