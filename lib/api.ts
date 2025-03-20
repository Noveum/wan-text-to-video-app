import type { VideoGenerationRequest, VideoGenerationResponse, VideoStatusResponse } from "./types"

const API_BASE_URL = "https://prod.api.market/api/v1/magicapi/wan-text-to-image/text-to-video"

export async function generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
  const apiKey = localStorage.getItem("api-key")
  if (!apiKey) {
    throw new Error("API key not found")
  }

  try {
    console.log("Sending request to API:", JSON.stringify(request, null, 2))

    const response = await fetch(`${API_BASE_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-magicapi-key": apiKey,
      },
      body: JSON.stringify(request),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("API error response:", data)
      throw new Error(data.message || `API error: ${response.status} ${response.statusText}`)
    }

    return data
  } catch (error) {
    console.error("Error in generateVideo:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to connect to video generation service")
  }
}

// Update the checkVideoStatus function to handle the new response format
export async function checkVideoStatus(id: string): Promise<VideoStatusResponse> {
  const apiKey = localStorage.getItem("api-key")
  if (!apiKey) {
    throw new Error("API key not found")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/status/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-magicapi-key": apiKey,
      },
    })

    const data = await response.json()
    console.log("Status API response:", data)

    if (!response.ok) {
      console.error("API error response:", data)
      throw new Error(data.message || `API error: ${response.status} ${response.statusText}`)
    }

    // Handle the new response format
    if (data.output && data.output.output && Array.isArray(data.output.output) && data.output.output.length > 0) {
      // If the video URL is in the nested output array
      return {
        ...data,
        output: {
          ...data.output,
          video_url: data.output.output[0],
        },
      }
    }

    return data
  } catch (error) {
    console.error("Error in checkVideoStatus:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to connect to video status service")
  }
}

export const LORA_OPTIONS = [
  {
    label: "None",
    value: "none",
    description: "No LoRA style applied to the video.",
  },
  {
    label: "360 Effect",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/360_epoch20.safetensors",
    description: "Creates a 360-degree spinning or panoramic effect around the subject.",
  },
  {
    label: "Aging Effect",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/aging_30_epochs.safetensors",
    description: "Adds an aging transformation to subjects, showing progression through time.",
  },
  {
    label: "Baby Style",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/baby_epoch_50.safetensors",
    description: "Transforms subjects to have more baby-like or childish features.",
  },
  {
    label: "Base I2V LoRA",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/wan-1.3b-cfgdistill-video-4.0-00001000_comfy.safetensors",
    description: "Base LoRA model for image-to-video transformation with the 1.3b model.",
  },
  {
    label: "Bride Transformation",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/bride50.safetensors",
    description: "Transforms a subject into bridal attire and styling.",
  },
  {
    label: "Cake Style",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/cakeify_16_epochs.safetensors",
    description: "Transforms subjects or scenes into cake-like textures and appearances.",
  },
  {
    label: "Crushing Effect",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/crushit_epoch20.safetensors",
    description: "Applies a crushing or compressing animation to subjects.",
  },
  {
    label: "Decay Effect",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/decay_50_epochs.safetensors",
    description: "Adds deterioration, aging, or weathering effects to subjects.",
  },
  {
    label: "Deflate Animation",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/deflate_epoch20.safetensors",
    description: "Creates a deflating animation effect on subjects.",
  },
  {
    label: "Flying Effect",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/flying_effect.safetensors",
    description: "Adds movement suggesting flight or floating in air.",
  },
  {
    label: "Flying Effect (Wan2.1)",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/flying_effect(Wan2.1 I2V LoRA).safetensors",
    description: "An optimized flying effect specifically tuned for Wan2.1 models.",
  },
  {
    label: "Gun Effect",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/gun_epoch20.safetensors",
    description: "Creates animations related to firearms or shooting.",
  },
  {
    label: "Inflate Animation",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/inflate_20_epochs.safetensors",
    description: "Produces an inflating or expanding effect on subjects.",
  },
  {
    label: "Jungle Environment",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/jungle_50_epochs.safetensors",
    description: "Transforms scenes to have jungle or tropical forest qualities.",
  },
  {
    label: "Landscape Effect",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/sc1-f1_l4ndsc4p3.safetensors",
    description: "Optimizes scenes for landscape views and natural environments.",
  },
  {
    label: "Mona Lisa Style",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/mona_lisa_35_epochs.safetensors",
    description: "Applies a style reminiscent of Leonardo da Vinci's Mona Lisa.",
  },
  {
    label: "Muscle Enhancement",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/muscles_epoch18.safetensors",
    description: "Enhances or adds muscular definition to subjects.",
  },
  {
    label: "Painting Style",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/painting_50_epochs.safetensors",
    description: "Transforms videos to have a hand-painted artistic quality.",
  },
  {
    label: "Samurai Transformation",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/samurai_50_epochs.safetensors",
    description: "Transforms subjects to have samurai-themed attire and styling.",
  },
  {
    label: "Squish Animation",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/squish_18.safetensors",
    description: "Creates a squishing or compressing animation effect.",
  },
  {
    label: "VIP Styling",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/vip_50_epochs.safetensors",
    description: "Adds elements suggesting VIP status, luxury, or celebrity treatment.",
  },
  {
    label: "Warrior Transformation",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/warrior_45_epochs.safetensors",
    description: "Transforms subjects into warrior-like appearances.",
  },
  {
    label: "Westworld Style",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/remade_westworld_35.safetensors",
    description: "Applies a style reminiscent of the Westworld show aesthetics.",
  },
  {
    label: "Zen Style",
    value: "https://dtu1vvf8tvi89.cloudfront.net/wan/i2v_lora/zen_50_epochs.safetensors",
    description: "Adds elements suggesting tranquility, meditation, and zen-like qualities.",
  },
  {
    label: "Wan Flat Color v2",
    value: "https://huggingface.co/motimalu/wan-flat-color-v2/resolve/main/wan_flat_color_v2.safetensors",
    description: "Flat color style with vibrant colors and simplified forms.",
  },
  {
    label: "Wan Anime v1",
    value: "https://huggingface.co/motimalu/wan-anime-style/resolve/main/wan_anime_style_v1.safetensors",
    description: "Anime-inspired style with characteristic line work and aesthetics.",
  },
  {
    label: "Wan Watercolor v1",
    value: "https://huggingface.co/motimalu/wan-watercolor/resolve/main/wan_watercolor_v1.safetensors",
    description: "Watercolor painting effect with soft edges and color blending.",
  },
  {
    label: "Wan Pixel Art v1",
    value: "https://huggingface.co/motimalu/wan-pixel-art/resolve/main/wan_pixel_art_v1.safetensors",
    description: "Pixel art style with blocky, retro game aesthetics.",
  },
]

export const RESOLUTION_OPTIONS = [
  { label: "480p", value: "480p" },
  { label: "720p", value: "720p" },
  { label: "1080p", value: "1080p" },
]

export const ASPECT_RATIO_OPTIONS = [
  { label: "16:9", value: "16:9" },
  { label: "1:1", value: "1:1" },
  { label: "9:16", value: "9:16" },
]

export const MODEL_OPTIONS = [
  { label: "1.3b", value: "1.3b" },
  { label: "14b", value: "14b" },
]

