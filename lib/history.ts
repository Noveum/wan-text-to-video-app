import type { HistoryItem } from "./types"

const HISTORY_KEY = "video-generation-history"

export function saveToHistory(item: HistoryItem): void {
  try {
    const history = getHistory()
    history.unshift(item)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch (error) {
    console.error("Failed to save to history:", error)
  }
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return []

  try {
    const historyJson = localStorage.getItem(HISTORY_KEY)
    if (!historyJson) return []
    return JSON.parse(historyJson)
  } catch (error) {
    console.error("Failed to parse history:", error)
    return []
  }
}

export function updateHistoryItem(id: string, updates: Partial<HistoryItem>): void {
  try {
    const history = getHistory()
    const index = history.findIndex((item) => item.id === id)

    if (index !== -1) {
      history[index] = { ...history[index], ...updates }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    }
  } catch (error) {
    console.error("Failed to update history item:", error)
  }
}

export function deleteHistoryItem(id: string): void {
  try {
    const history = getHistory()
    const filteredHistory = history.filter((item) => item.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory))
  } catch (error) {
    console.error("Failed to delete history item:", error)
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    console.error("Failed to clear history:", error)
  }
}

