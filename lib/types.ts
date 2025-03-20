export interface VideoGenerationInput {
  model: string
  frames: number
  prompt: string
  lora_url?: string
  aspect_ratio: string
  sample_shift: number
  resolution: string
  sample_steps: number
  negative_prompt: string
  lora_strength_clip: number
  sample_guide_scale: number
  lora_strength_model: number
  seed: number | null
  fast_mode: string
}

export interface VideoGenerationRequest {
  input: VideoGenerationInput
}

export interface VideoGenerationResponse {
  id: string
  status: string
}

export interface VideoStatusResponse {
  delayTime?: number
  executionTime?: number
  id: string
  status: string
  workerId?: string
  output?: {
    video_url?: string
    completed_at?: string
    input?: any
    metrics?: any
    output?: string[]
    status?: string
  }
}

export interface HistoryItem {
  id: string
  prompt: string
  timestamp: number
  status: "pending" | "processing" | "completed" | "failed"
  videoUrl?: string
  requestJson?: string
  executionTime?: number // Added to store execution time for cost calculation
}

