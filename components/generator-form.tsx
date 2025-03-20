"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { Wand2, Info, Code, ChevronDown, ExternalLink, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ASPECT_RATIO_OPTIONS, LORA_OPTIONS, MODEL_OPTIONS, RESOLUTION_OPTIONS, generateVideo } from "@/lib/api"
import { saveToHistory } from "@/lib/history"
import type { VideoGenerationInput } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { CurlSyntaxHighlighter } from "./curl-syntax-highlighter"

interface GeneratorFormProps {
  onVideoGenerated?: (videoId: string) => void
  initialValues?: Partial<VideoGenerationInput> | null
  onFormValuesUsed?: () => void
}

export function GeneratorForm({ onVideoGenerated, initialValues, onFormValuesUsed }: GeneratorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [curlCommand, setCurlCommand] = useState<string>("")
  const [requestJson, setRequestJson] = useState<string>("")
  const [activeLoraTab, setActiveLoraTab] = useState<string>("preset")
  const [isNegativePromptOpen, setIsNegativePromptOpen] = useState(false)
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false)
  const { toast } = useToast()

  const defaultValues = {
    model: "1.3b",
    frames: 81,
    prompt: "",
    lora_url: "https://huggingface.co/motimalu/wan-flat-color-v2/resolve/main/wan_flat_color_v2.safetensors",
    aspect_ratio: "16:9",
    sample_shift: 8,
    resolution: "480p",
    sample_steps: 30,
    negative_prompt: "",
    lora_strength_clip: 1,
    sample_guide_scale: 5,
    lora_strength_model: 1,
    seed: null,
    fast_mode: "Balanced",
  }

  const form = useForm<VideoGenerationInput>({
    defaultValues,
  })

  // Apply initial values when they change
  useEffect(() => {
    if (initialValues) {
      // Reset the form with the initial values
      const currentDefaults = form.getValues()
      form.reset({ ...currentDefaults, ...initialValues })

      // If there's a negative prompt, expand that section
      if (initialValues.negative_prompt) {
        setIsNegativePromptOpen(true)
      }

      // If there are advanced settings, expand that section
      if (
        initialValues.sample_steps !== undefined ||
        initialValues.sample_guide_scale !== undefined ||
        initialValues.sample_shift !== undefined ||
        initialValues.lora_strength_model !== undefined ||
        initialValues.lora_strength_clip !== undefined ||
        initialValues.seed !== undefined ||
        initialValues.fast_mode !== undefined
      ) {
        setIsAdvancedSettingsOpen(true)
      }

      // Set the correct LoRA tab
      if (initialValues.lora_url) {
        const isPreset = LORA_OPTIONS.some((option) => option.value === initialValues.lora_url)
        setActiveLoraTab(isPreset ? "preset" : "custom")
      }

      // Notify parent that values have been used
      if (onFormValuesUsed) {
        onFormValuesUsed()
      }

      // Update the curl command with the new values
      updateCurlCommand(initialValues as VideoGenerationInput)
    }
  }, [initialValues, form, onFormValuesUsed])

  // Watch for form changes to update the curl command
  useEffect(() => {
    const subscription = form.watch((value) => {
      updateCurlCommand(value as VideoGenerationInput)
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Function to update the curl command based on current form values
  const updateCurlCommand = useCallback((data: VideoGenerationInput) => {
    try {
      const apiKey = localStorage.getItem("api-key") || "REPLACE_WITHCUSTOMER_API_KEY_IF_PRESENT"

      let requestPayload

      // Handle the "none" value for lora_url
      if (data.lora_url === "none") {
        // Create a new object without the lora_url property
        const { lora_url, ...inputWithoutLora } = data
        requestPayload = { input: inputWithoutLora }
      } else {
        // Proceed with lora_url included
        requestPayload = { input: data }
      }

      // Format the JSON with proper indentation
      const formattedJson = JSON.stringify(requestPayload, null, 2)
      setRequestJson(formattedJson)

      // Create the curl command with the proper format
      const curl = `curl -X 'POST' \\
  'https://prod.api.market/api/v1/magicapi/wan-text-to-image/text-to-video/run' \\
  -H 'accept: application/json' \\
  -H 'x-magicapi-key: ${apiKey}' \\
  -H 'Content-Type: application/json' \\
  -d '${formattedJson}'`

      setCurlCommand(curl)
    } catch (error) {
      console.error("Error generating curl command:", error)
    }
  }, [])

  const onSubmit = async (data: VideoGenerationInput) => {
    try {
      if (!data.prompt.trim()) {
        toast({
          title: "Prompt Required",
          description: "Please enter a prompt to generate a video",
          variant: "destructive",
        })
        return
      }

      // Validate API key before submission
      const apiKey = localStorage.getItem("api-key")
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please add your API key in the settings",
          variant: "destructive",
        })
        return
      }

      setIsGenerating(true)

      let requestPayload
      let response

      // Handle the "none" value for lora_url
      if (data.lora_url === "none") {
        // Create a new object without the lora_url property
        const { lora_url, ...inputWithoutLora } = data
        requestPayload = { input: inputWithoutLora }

        console.log("Submitting video generation request without LoRA")
        response = await generateVideo(requestPayload)
      } else {
        // Proceed with lora_url included
        requestPayload = { input: data }

        console.log("Submitting video generation request with LoRA:", data.lora_url)
        response = await generateVideo(requestPayload)
      }

      console.log("Video generation response:", response)

      // Save to history with the request JSON
      saveToHistory({
        id: response.id,
        prompt: data.prompt,
        timestamp: Date.now(),
        status: "pending",
        requestJson: JSON.stringify(requestPayload, null, 2),
      })

      toast({
        title: "Video Generation Started",
        description: "Your video is being generated. This may take a few minutes.",
      })

      if (onVideoGenerated) {
        onVideoGenerated(response.id)
      }
    } catch (error) {
      console.error("Error generating video:", error)

      // More detailed error message
      let errorMessage = "Failed to generate video"
      if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Function to reset the form to default values
  const handleReset = () => {
    form.reset(defaultValues)
    setIsNegativePromptOpen(false)
    setIsAdvancedSettingsOpen(false)
    setActiveLoraTab("preset")

    toast({
      title: "Form Reset",
      description: "Generator form has been reset to default values",
    })
  }

  const selectedLoraDescription = LORA_OPTIONS.find((option) => option.value === form.watch("lora_url"))?.description

  return (
    <TooltipProvider>
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Wand2 className="mr-2 h-5 w-5" />
                Text to Video Generator
              </CardTitle>
              <CardDescription>Enter a prompt to generate a video using AI</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/info"
                className="text-xs text-primary hover:text-primary/80 dark:hover:text-white transition-colors flex items-center"
              >
                <Info className="mr-1 h-3 w-3" />
                <span>Usage Info</span>
              </Link>
              <a
                href="https://api.market/store/magicapi/wan-text-to-image"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary/80 dark:hover:text-white transition-colors flex items-center"
              >
                <span>API Documentation</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the video you want to generate..."
                        className="min-h-24 resize-none bg-background border border-input"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Be descriptive for better results</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full justify-between p-0 h-9"
                  onClick={() => setIsNegativePromptOpen(!isNegativePromptOpen)}
                >
                  <span className="font-medium">Negative Prompt</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isNegativePromptOpen ? "rotate-180" : ""}`} />
                </Button>
                {isNegativePromptOpen && (
                  <div className="pt-2">
                    <FormField
                      control={form.control}
                      name="negative_prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Negative Prompt (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Elements to avoid in the video..."
                              className="resize-none bg-background border border-input"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Describe what you don't want to see in the video</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border border-input">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MODEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resolution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolution</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border border-input">
                            <SelectValue placeholder="Select resolution" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESOLUTION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aspect_ratio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aspect Ratio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background border border-input">
                            <SelectValue placeholder="Select aspect ratio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ASPECT_RATIO_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frames</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number.parseInt(value))}
                        defaultValue={field.value.toString()}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border border-input">
                            <SelectValue placeholder="Select frames" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="17">17 frames (~1 sec at 16fps)</SelectItem>
                          <SelectItem value="33">33 frames (~2 sec at 16fps)</SelectItem>
                          <SelectItem value="49">49 frames (~3 sec at 16fps)</SelectItem>
                          <SelectItem value="65">65 frames (~4 sec at 16fps)</SelectItem>
                          <SelectItem value="81">81 frames (~5 sec at 16fps)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Higher frames = smoother video but more cost/time</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Tabs value={activeLoraTab} onValueChange={setActiveLoraTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted p-0.5">
                  <TabsTrigger value="preset" className="data-[state=active]:bg-background">
                    Preset LoRA
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="data-[state=active]:bg-background">
                    Custom LoRA URL
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="preset" className="mt-4">
                  <FormField
                    control={form.control}
                    name="lora_url"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>LoRA Style</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px]">
                              LoRA (Low-Rank Adaptation) models apply specific styles or effects to your video
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            // If a preset is selected, stay on preset tab
                            setActiveLoraTab("preset")
                          }}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background border border-input">
                              <SelectValue placeholder="Select LoRA style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {LORA_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedLoraDescription && <FormDescription>{selectedLoraDescription}</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="custom" className="mt-4">
                  <FormField
                    control={form.control}
                    name="lora_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom LoRA URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://huggingface.co/path/to/lora.safetensors"
                            value={field.value === "none" ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value.trim()
                              field.onChange(value || "none") // If empty, set to "none"
                            }}
                            className="bg-background border border-input"
                          />
                        </FormControl>
                        <FormDescription>Enter a custom LoRA URL from Hugging Face or other sources</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full justify-between p-0 h-9"
                  onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                >
                  <span className="font-medium">Advanced Settings</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isAdvancedSettingsOpen ? "rotate-180" : ""}`}
                  />
                </Button>
                {isAdvancedSettingsOpen && (
                  <div className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="sample_steps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sample Steps: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={60}
                                step={1}
                                defaultValue={[field.value]}
                                value={[field.value]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="py-2"
                              />
                            </FormControl>
                            <FormDescription>More steps increase quality but slow down generation</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sample_guide_scale"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Guidance Scale: {field.value.toFixed(1)}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={10}
                                step={0.1}
                                defaultValue={[field.value]}
                                value={[field.value]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="py-2"
                              />
                            </FormControl>
                            <FormDescription>Higher values = stronger adherence to prompt</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sample_shift"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sample Shift: {field.value.toFixed(1)}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={10}
                                step={0.1}
                                defaultValue={[field.value]}
                                value={[field.value]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="py-2"
                              />
                            </FormControl>
                            <FormDescription>Higher values yield more creative motion</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lora_strength_model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LoRA Model Strength: {field.value.toFixed(1)}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={2}
                                step={0.1}
                                defaultValue={[field.value]}
                                value={[field.value]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="py-2"
                              />
                            </FormControl>
                            <FormDescription>Strength of LoRA applied to the model</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lora_strength_clip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LoRA CLIP Strength: {field.value.toFixed(1)}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={2}
                                step={0.1}
                                defaultValue={[field.value]}
                                value={[field.value]}
                                onValueChange={(values) => field.onChange(values[0])}
                                className="py-2"
                              />
                            </FormControl>
                            <FormDescription>Strength of LoRA on text encoding</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="seed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seed (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Random seed"
                                value={field.value === null ? "" : field.value}
                                onChange={(e) => {
                                  const value = e.target.value.trim()
                                  field.onChange(value ? Number.parseInt(value) : null)
                                }}
                                className="bg-background border border-input"
                              />
                            </FormControl>
                            <FormDescription>For reproducible results (leave empty for random)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fast_mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Generation Speed</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background border border-input">
                                  <SelectValue placeholder="Select speed mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Off">Off (Highest Quality)</SelectItem>
                                <SelectItem value="Balanced">Balanced</SelectItem>
                                <SelectItem value="Fast">Fast (Lower Quality)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>Trade-off between generation speed and quality</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-4">
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" type="button" className="bg-background border border-input">
                        <Code className="mr-2 h-4 w-4" />
                        View API Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>API Request</DialogTitle>
                        <DialogDescription>
                          The cURL command and JSON payload that will be sent to the API
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">cURL Command</h3>
                          <CurlSyntaxHighlighter code={curlCommand} />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">JSON Payload</h3>
                          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                            {requestJson || "No JSON payload available"}
                          </pre>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="bg-background border border-input"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Form
                  </Button>
                </div>

                <Button type="submit" disabled={isGenerating} className="bg-primary hover:bg-primary/90">
                  {isGenerating ? "Generating..." : "Generate Video"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

