"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface CurlSyntaxHighlighterProps {
  code: string
}

export function CurlSyntaxHighlighter({ code }: CurlSyntaxHighlighterProps) {
  const [highlightedCode, setHighlightedCode] = useState<React.ReactNode[]>([])

  useEffect(() => {
    if (!code) {
      setHighlightedCode([<span key="empty">No cURL command available</span>])
      return
    }

    // Split the code by lines
    const lines = code.split("\n")

    // Process each line for syntax highlighting
    const processedLines = lines.map((line, lineIndex) => {
      // Handle different parts of the cURL command
      if (line.trim().startsWith("curl")) {
        // Highlight the curl command itself
        return (
          <div key={`line-${lineIndex}`} className="whitespace-pre">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">curl</span>
            {highlightCurlFlags(line.substring(4))}
          </div>
        )
      } else if (line.includes("-H")) {
        // Highlight headers
        return (
          <div key={`line-${lineIndex}`} className="whitespace-pre">
            <span className="text-green-600 dark:text-green-400">{line.substring(0, line.indexOf("-H"))}</span>
            <span className="text-purple-600 dark:text-purple-400">-H</span>
            {highlightHeaderValue(line.substring(line.indexOf("-H") + 2))}
          </div>
        )
      } else if (line.includes("-d")) {
        // Highlight data parameter
        return (
          <div key={`line-${lineIndex}`} className="whitespace-pre">
            <span className="text-green-600 dark:text-green-400">{line.substring(0, line.indexOf("-d"))}</span>
            <span className="text-purple-600 dark:text-purple-400">-d</span>
            <span className="text-amber-600 dark:text-amber-400">{line.substring(line.indexOf("-d") + 2)}</span>
          </div>
        )
      } else if (line.includes("'http")) {
        // Highlight URL
        return (
          <div key={`line-${lineIndex}`} className="whitespace-pre">
            <span className="text-green-600 dark:text-green-400">{line.substring(0, line.indexOf("'http"))}</span>
            {highlightUrl(line.substring(line.indexOf("'http")))}
          </div>
        )
      } else {
        // Default highlighting for other lines
        return (
          <div key={`line-${lineIndex}`} className="whitespace-pre text-green-600 dark:text-green-400">
            {line}
          </div>
        )
      }
    })

    setHighlightedCode(processedLines)
  }, [code])

  // Helper function to highlight curl flags
  const highlightCurlFlags = (text: string) => {
    // Highlight -X flag
    if (text.includes("-X")) {
      const parts = text.split("-X")
      return (
        <>
          {parts[0]}
          <span className="text-purple-600 dark:text-purple-400">-X</span>
          <span className="text-yellow-600 dark:text-yellow-400">{parts[1]}</span>
        </>
      )
    }
    return <span className="text-gray-600 dark:text-gray-400">{text}</span>
  }

  // Helper function to highlight header values
  const highlightHeaderValue = (text: string) => {
    if (text.includes("'")) {
      const parts = text.split("'")
      if (parts.length >= 3) {
        return (
          <>
            <span className="text-gray-600 dark:text-gray-400">{parts[0]}</span>
            <span className="text-amber-600 dark:text-amber-400">'{parts[1]}'</span>
            {parts[2] && <span className="text-gray-600 dark:text-gray-400">{parts[2]}</span>}
          </>
        )
      }
    }
    return <span className="text-gray-600 dark:text-gray-400">{text}</span>
  }

  // Helper function to highlight URLs
  const highlightUrl = (text: string) => {
    if (text.includes("'")) {
      const parts = text.split("'")
      if (parts.length >= 3) {
        return (
          <>
            <span className="text-amber-600 dark:text-amber-400">'{parts[1]}'</span>
            {parts[2] && <span className="text-gray-600 dark:text-gray-400">{parts[2]}</span>}
          </>
        )
      }
    }
    return <span className="text-amber-600 dark:text-amber-400">{text}</span>
  }

  return <div className="bg-muted p-4 rounded-md overflow-x-auto text-xs font-mono">{highlightedCode}</div>
}

