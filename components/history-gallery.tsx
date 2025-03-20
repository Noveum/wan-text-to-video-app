"use client"

import { useEffect, useState } from "react"
import { Clock, Loader2, Play, Trash2, Code, Copy, DollarSign, AlertTriangle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { clearHistory, getHistory, deleteHistoryItem } from "@/lib/history"
import type { HistoryItem } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CurlSyntaxHighlighter } from "./curl-syntax-highlighter"

interface HistoryGalleryProps {
  limit?: number
  title?: string
  selectedItemId?: string
  onItemClick?: (item: HistoryItem) => void
  onReuseRequest?: (requestJson: string) => void
}

export function HistoryGallery({
  limit,
  title = "Generation History",
  selectedItemId,
  onItemClick,
  onReuseRequest,
}: HistoryGalleryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
    const historyItems = getHistory()
    setHistory(limit ? historyItems.slice(0, limit) : historyItems)

    // Set up an interval to refresh history
    const intervalId = setInterval(() => {
      const updatedHistory = getHistory()
      setHistory(limit ? updatedHistory.slice(0, limit) : updatedHistory)
    }, 5000)

    return () => clearInterval(intervalId)
  }, [limit])

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
    toast({
      title: "History Cleared",
      description: "Your generation history has been cleared",
    })
  }

  const handleDeleteItem = (id: string) => {
    deleteHistoryItem(id)
    setHistory((prev) => prev.filter((item) => item.id !== id))
    toast({
      title: "Item Deleted",
      description: "The selected video has been removed from history",
    })
  }

  if (!isClient) {
    return <div className="text-center py-8">Loading history...</div>
  }

  if (history.length === 0) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>Your video generation history will appear here</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No history yet. Generate your first video!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          {title}
        </h2>
        {!limit && (
          <div className="flex items-center gap-2">
            <Link
              href="/info"
              className="text-xs text-primary hover:text-primary/80 dark:hover:text-white transition-colors flex items-center"
            >
              <AlertTriangle className="mr-1 h-3 w-3 text-amber-500" />
              <span>Usage Info</span>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-8">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear History</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your entire generation history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {!limit && (
        <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
            Videos are automatically deleted after 24 hours. Download any videos you want to keep.{" "}
            <Link href="/info" className="text-primary hover:text-primary/80 dark:hover:text-white underline">
              Learn more
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {history.map((item) => (
          <HistoryCard
            key={item.id}
            item={item}
            onClick={() => onItemClick && onItemClick(item)}
            onReuseRequest={onReuseRequest}
            onDelete={handleDeleteItem}
            isSelected={selectedItemId === item.id}
          />
        ))}
      </div>
    </div>
  )
}

function HistoryCard({
  item,
  onClick,
  onReuseRequest,
  onDelete,
  isSelected,
}: {
  item: HistoryItem
  onClick: () => void
  onReuseRequest?: (requestJson: string) => void
  onDelete: (id: string) => void
  isSelected?: boolean
}) {
  // Calculate cost if executionTime is available
  const cost = item.executionTime ? (item.executionTime / 1000) * 0.001 : null
  const [curlCommand, setCurlCommand] = useState<string | null>(null)

  // Generate curl command on mount
  useEffect(() => {
    if (item.requestJson) {
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
  }, [item.requestJson])

  return (
    <Card
      className={`overflow-hidden hover:shadow-md transition-shadow border ${
        isSelected ? "ring-2 ring-primary border-primary" : "border-border shadow-sm"
      }`}
    >
      <div className="relative aspect-video bg-black/5 dark:bg-black/20 cursor-pointer" onClick={onClick}>
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            className="h-full w-full object-cover"
            muted
            onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
            onMouseOut={(e) => {
              ;(e.target as HTMLVideoElement).pause()
              ;(e.target as HTMLVideoElement).currentTime = 0
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            {item.status === "pending" || item.status === "processing" ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
            ) : (
              <Play className="h-8 w-8 text-muted-foreground/70" />
            )}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={item.status} />
        </div>
        {cost !== null && (
          <div className="absolute bottom-2 left-2">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20 dark:text-white dark:bg-primary/30 dark:border-primary/40"
            >
              <DollarSign className="h-3 w-3 mr-1" />${cost.toFixed(4)}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-1 cursor-pointer" onClick={onClick}>
          {item.prompt}
        </h3>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-muted-foreground">
            {new Date(item.timestamp).toLocaleString(undefined, {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
          <div className="flex gap-1">
            {item.requestJson && onReuseRequest && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        onReuseRequest(item.requestJson!)
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reuse settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(item.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete item</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {item.requestJson && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Code className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Generation Request</DialogTitle>
                          <DialogDescription>
                            The cURL command and JSON payload used to generate this video
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">cURL Command</h3>
                            <CurlSyntaxHighlighter code={curlCommand || ""} />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium mb-2">JSON Payload</h3>
                            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">{item.requestJson}</pre>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View request</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: HistoryItem["status"] }) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/60"
        >
          Pending
        </Badge>
      )
    case "processing":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60"
        >
          Processing
        </Badge>
      )
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/60"
        >
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60"
        >
          Failed
        </Badge>
      )
    default:
      return null
  }
}

