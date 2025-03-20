"use client"

import { useState, useEffect } from "react"
import { GeneratorForm } from "./generator-form"
import { VideoPlayer } from "./video-player"
import { HistoryGallery } from "./history-gallery"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wand2, History } from "lucide-react"
import type { HistoryItem, VideoGenerationInput } from "@/lib/types"
import { updateHistoryItem, getHistory } from "@/lib/history"
import { useToast } from "@/components/ui/use-toast"

export function GeneratorDashboard() {
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("generator")
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null)
  const [formValues, setFormValues] = useState<Partial<VideoGenerationInput> | null>(null)
  const { toast } = useToast()

  // Load history on initial render
  useEffect(() => {
    const history = getHistory()
    if (history.length > 0) {
      // If there's history, select the most recent item
      const mostRecent = history[0]
      setSelectedHistoryItem(mostRecent)
      setCurrentVideoId(mostRecent.id)
      if (mostRecent.videoUrl) {
        setCurrentVideoUrl(mostRecent.videoUrl)
      }
    }
  }, [])

  // Handle URL hash for navigation
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#gallery") {
        setActiveTab("gallery")
      } else if (window.location.hash === "#settings") {
        // Scroll to API key section when settings hash is present
        const apiKeySection = document.getElementById("api-key-section")
        if (apiKeySection) {
          apiKeySection.scrollIntoView({ behavior: "smooth" })

          // Force expand the API key form
          const expandApiKeyForm = () => {
            const clickableHeader = apiKeySection.querySelector(".flex.items-center.gap-2.cursor-pointer")
            if (clickableHeader) {
              // Always expand when coming from settings link
              ;(clickableHeader as HTMLElement).click()
            }
          }

          setTimeout(expandApiKeyForm, 100)
        }
      }
    }

    // Handle initial hash
    handleHashChange()

    // Add event listener for hash changes
    window.addEventListener("hashchange", handleHashChange)

    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  const handleVideoGenerated = (videoId: string) => {
    setCurrentVideoId(videoId)
    setActiveTab("gallery")

    // Find the item in history
    const history = getHistory()
    const item = history.find((item) => item.id === videoId)
    if (item) {
      setSelectedHistoryItem(item)
    }
  }

  const handleVideoReady = (videoUrl: string, executionTime?: number) => {
    setCurrentVideoUrl(videoUrl)
    if (currentVideoId) {
      updateHistoryItem(currentVideoId, {
        status: "completed",
        videoUrl,
        executionTime,
      })

      // Update the selected history item
      setSelectedHistoryItem((prev) => {
        if (prev && prev.id === currentVideoId) {
          return { ...prev, status: "completed", videoUrl, executionTime }
        }
        return prev
      })
    }
  }

  const handleVideoFailed = () => {
    if (currentVideoId) {
      updateHistoryItem(currentVideoId, { status: "failed" })

      // Update the selected history item
      setSelectedHistoryItem((prev) => {
        if (prev && prev.id === currentVideoId) {
          return { ...prev, status: "failed" }
        }
        return prev
      })
    }
  }

  const handleVideoProcessing = () => {
    if (currentVideoId) {
      updateHistoryItem(currentVideoId, { status: "processing" })

      // Update the selected history item
      setSelectedHistoryItem((prev) => {
        if (prev && prev.id === currentVideoId) {
          return { ...prev, status: "processing" }
        }
        return prev
      })
    }
  }

  const handleHistoryItemClick = (item: HistoryItem) => {
    setSelectedHistoryItem(item)
    setCurrentVideoId(item.id)
    if (item.videoUrl) {
      setCurrentVideoUrl(item.videoUrl)
    } else {
      setCurrentVideoUrl(null)
    }
    setActiveTab("gallery")
  }

  const handleReuseRequest = (requestJson: string) => {
    try {
      // Parse the JSON to extract the input values
      const parsedRequest = JSON.parse(requestJson)

      if (parsedRequest && parsedRequest.input) {
        // Set the form values to be used by the GeneratorForm
        setFormValues(parsedRequest.input)

        // Switch to the generator tab
        setActiveTab("generator")

        toast({
          title: "Settings Loaded",
          description: "Previous generation settings have been loaded into the form",
        })
      }
    } catch (error) {
      console.error("Error parsing request JSON:", error)
      toast({
        title: "Error",
        description: "Could not load the previous settings",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="generator" className="flex items-center gap-2 rounded-md" data-tab="generator">
            <Wand2 className="h-4 w-4" />
            <span>Generator</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2 rounded-md" data-tab="gallery">
            <History className="h-4 w-4" />
            <span>Gallery & Player</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <GeneratorForm
                onVideoGenerated={handleVideoGenerated}
                initialValues={formValues}
                onFormValuesUsed={() => setFormValues(null)}
              />
            </div>
            <div className="lg:col-span-2">
              {selectedHistoryItem && (
                <VideoPlayer
                  videoId={selectedHistoryItem.id}
                  videoUrl={selectedHistoryItem.videoUrl}
                  title="Current Generation"
                  onVideoReady={handleVideoReady}
                  onVideoFailed={handleVideoFailed}
                  onVideoProcessing={handleVideoProcessing}
                  initialStatus={selectedHistoryItem.status}
                />
              )}

              <div className="mt-6">
                <HistoryGallery
                  limit={3}
                  title="Recent Generations"
                  onItemClick={handleHistoryItemClick}
                  onReuseRequest={handleReuseRequest}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {selectedHistoryItem && (
                <VideoPlayer
                  videoId={selectedHistoryItem.id}
                  videoUrl={selectedHistoryItem.videoUrl}
                  title="Video Player"
                  onVideoReady={handleVideoReady}
                  onVideoFailed={handleVideoFailed}
                  onVideoProcessing={handleVideoProcessing}
                  initialStatus={selectedHistoryItem.status}
                />
              )}
            </div>
            <div>
              <HistoryGallery
                onItemClick={handleHistoryItemClick}
                selectedItemId={selectedHistoryItem?.id}
                onReuseRequest={handleReuseRequest}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

