"use client"

import { useEffect, useState } from "react"
import { Copy, Check, KeyRound, ExternalLink, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export function ApiKeyForm() {
  const [apiKey, setApiKey] = useState("")
  const [isKeySet, setIsKeySet] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()
  // Add state for collapsible behavior
  const [isExpanded, setIsExpanded] = useState(false)

  // Load API key from localStorage on component mount
  useEffect(() => {
    try {
      const storedKey = localStorage.getItem("api-key")
      if (storedKey) {
        setApiKey(storedKey)
        setIsKeySet(true)
        // Start collapsed when a key is already set
        setIsExpanded(false)
      } else {
        // Start expanded when no key is set
        setIsExpanded(true)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

  // Update the handleSaveKey function to collapse the form after saving
  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key",
        variant: "destructive",
      })
      return
    }

    // Basic validation for API key format
    if (apiKey.trim().length < 10) {
      toast({
        title: "Invalid API Key",
        description: "The API key appears to be too short. Please check your key.",
        variant: "destructive",
      })
      return
    }

    try {
      localStorage.setItem("api-key", apiKey.trim())
      setIsKeySet(true)
      // Collapse the form after saving
      setIsExpanded(false)
      toast({
        title: "API Key Saved",
        description: "Your API key has been saved to local storage",
      })
    } catch (error) {
      console.error("Error saving to localStorage:", error)
      toast({
        title: "Error Saving API Key",
        description: "Could not save your API key. Please check your browser settings.",
        variant: "destructive",
      })
    }
  }

  const handleClearKey = () => {
    try {
      localStorage.removeItem("api-key")
      setApiKey("")
      setIsKeySet(false)
      toast({
        title: "API Key Cleared",
        description: "Your API key has been removed from local storage",
      })
    } catch (error) {
      console.error("Error removing from localStorage:", error)
      toast({
        title: "Error Clearing API Key",
        description: "Could not clear your API key. Please check your browser settings.",
        variant: "destructive",
      })
    }
  }

  const handleCopyKey = () => {
    navigator.clipboard
      .writeText(apiKey)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
        toast({
          title: "API Key Copied",
          description: "Your API key has been copied to clipboard",
        })
      })
      .catch((err) => {
        console.error("Could not copy API key:", err)
        toast({
          title: "Copy Failed",
          description: "Could not copy API key to clipboard",
          variant: "destructive",
        })
      })
  }

  if (isKeySet) {
    return (
      <Card className="mb-6 border border-border shadow-sm" id="api-key-section">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
              <KeyRound className="h-4 w-4" />
              <div>
                <CardTitle className="text-lg flex items-center">
                  API Key
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </CardTitle>
                {!isExpanded && <CardDescription className="text-xs">Click to expand</CardDescription>}
              </div>
            </div>
            <a
              href="https://api.market"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80 dark:hover:text-white transition-colors flex items-center"
            >
              <span>Get an API Key</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </CardHeader>

        {isExpanded && (
          <>
            <CardContent>
              <CardDescription className="mb-2">Your API key is securely stored in your browser</CardDescription>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono bg-background border border-input"
                  readOnly
                />
                <Button variant="outline" size="icon" onClick={handleCopyKey} className="h-10 w-10 border border-input">
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="outline" onClick={handleClearKey} className="bg-background border border-input">
                Clear API Key
              </Button>
              <Button onClick={handleSaveKey} className="button-primary">
                Update Key
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    )
  }

  return (
    <Card className="mb-6 border border-border shadow-sm" id="api-key-section">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              <KeyRound className="mr-2 h-4 w-4" />
              API Key Required
            </CardTitle>
            <CardDescription>Enter your API key to use the Text to Video generator</CardDescription>
          </div>
          <a
            href="https://api.market/store/magicapi/wan-text-to-image"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:text-primary/80 dark:hover:text-white transition-colors flex items-center"
          >
            <span>Get an API Key</span>
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono bg-background border border-input"
          />
          <Button onClick={handleSaveKey} className="button-primary">
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

