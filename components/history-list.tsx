"use client"

import { useEffect, useState } from "react"
import { Clock, Download, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { clearHistory, getHistory } from "@/lib/history"
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

export function HistoryList() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
    const historyItems = getHistory()
    setHistory(historyItems)

    // Set up an interval to refresh history
    const intervalId = setInterval(() => {
      setHistory(getHistory())
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
    toast({
      title: "History Cleared",
      description: "Your generation history has been cleared",
    })
  }

  if (!isClient) {
    return <div className="text-center py-8">Loading history...</div>
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Generation History
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Generation History
        </h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
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

      <div className="space-y-4">
        {history.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-base">{item.prompt}</CardTitle>
                  <CardDescription>{new Date(item.timestamp).toLocaleString()}</CardDescription>
                </div>
                <StatusBadge status={item.status} />
              </div>
            </CardHeader>

            {item.videoUrl && (
              <CardContent>
                <div className="aspect-video overflow-hidden rounded-md">
                  <video src={item.videoUrl} controls className="h-full w-full" />
                </div>
              </CardContent>
            )}

            {item.videoUrl && (
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <a href={item.videoUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download Video
                  </a>
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: HistoryItem["status"] }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
          Pending
        </Badge>
      )
    case "processing":
      return (
        <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
          Processing
        </Badge>
      )
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">
          Failed
        </Badge>
      )
    default:
      return null
  }
}

