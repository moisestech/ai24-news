import { devLog } from '@/lib/utils/log'
import { ArtStyle } from '@/types/art'
import Together from 'together-ai'
import { z } from 'zod'
import { getArtStylePrompt } from './art-styles'
import { newsQueries } from './supabase'

interface GenerateImageOptions {
  width?: number
  height?: number
  steps?: number
  seed?: number
  iterativeMode?: boolean
  newsId?: string
}

const defaultOptions: GenerateImageOptions = {
  width: 1024,
  height: 768,
  steps: 3,
  iterativeMode: false
}

// Define the schema for the image generation response
const ImageResponseSchema = z.object({
  data: z.array(z.object({
    b64_json: z.string()
  }))
})

interface ImageGenerationConfig {
  prompt: string
  style: keyof typeof ArtStyle
  metadata?: {
    style_notes?: string[]
    composition?: string
    lighting?: string
    color_palette?: string
    negative_prompt?: string
  }
}

export async function generateImage(config: ImageGenerationConfig): Promise<string> {
  try {
    devLog('Environment check:', {
      prefix: 'image-service',
      level: 'debug'
    }, {
      data: {
        NODE_ENV: process.env.NODE_ENV,
        MOCK_API: process.env.NEXT_PUBLIC_MOCK_API,
        TOGETHER_API_KEY: !!process.env.TOGETHER_API_KEY,
        HELICONE_API_KEY: !!process.env.HELICONE_API_KEY
      }
    })

    // Only use mock mode if explicitly enabled
    if (process.env.NEXT_PUBLIC_MOCK_API === 'true') {
      devLog('Using mock image', {
        prefix: 'image-service',
        level: 'debug'
      })
      const fallbackBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      return fallbackBase64
    }

    if (!process.env.TOGETHER_API_KEY) {
      throw new Error('Together API key not configured')
    }

    // Construct the full prompt with metadata
    const fullPrompt = constructFullPrompt(config)

    const client = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
      baseURL: process.env.HELICONE_API_KEY ? "https://together.helicone.ai/v1" : undefined,
      defaultHeaders: process.env.HELICONE_API_KEY ? {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`
      } : undefined
    })

    devLog('Calling Together API:', {
      prefix: 'image-service',
      level: 'debug'
    }, {
      data: {
        prompt: fullPrompt,
        model: "black-forest-labs/FLUX.1-schnell",
        options: defaultOptions
      }
    })

    const response = await client.images.create({
      prompt: fullPrompt,
      model: "black-forest-labs/FLUX.1-schnell",
      width: defaultOptions.width,
      height: defaultOptions.height,
      seed: defaultOptions.iterativeMode ? 123 : undefined,
      steps: defaultOptions.steps,
      response_format: "base64"
    })

    devLog('Raw API response structure:', {
      prefix: 'image-service',
      level: 'debug'
    }, {
      data: {
        responseType: typeof response,
        hasData: !!response.data,
        dataKeys: Object.keys(response),
        data: response.data,
        firstItem: {
          type: typeof response.data?.[0],
          keys: response.data?.[0] ? Object.keys(response.data[0]) : [],
          value: response.data?.[0],
          stringified: JSON.stringify(response.data?.[0], null, 2)
        }
      }
    })

    // Validate the response
    const validatedResponse = ImageResponseSchema.parse(response)

    const base64Image = validatedResponse.data[0].b64_json

    devLog('Image generated successfully', {
      prefix: 'image-service',
      level: 'debug'
    }, {
      data: {
        style: config.style,
        promptLength: fullPrompt.length,
        base64Length: base64Image.length,
        preview: base64Image.substring(0, 50) + '...'
      }
    })

    return base64Image

  } catch (error) {
    devLog('Image generation failed', {
      prefix: 'image-service',
      level: 'error'
    }, { 
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

function constructFullPrompt(config: ImageGenerationConfig): string {
  const parts = [config.prompt]

  if (config.metadata) {
    if (config.metadata.style_notes?.length) {
      parts.push(`Style notes: ${config.metadata.style_notes.join(', ')}`)
    }
    if (config.metadata.composition) {
      parts.push(`Composition: ${config.metadata.composition}`)
    }
    if (config.metadata.lighting) {
      parts.push(`Lighting: ${config.metadata.lighting}`)
    }
    if (config.metadata.color_palette) {
      parts.push(`Color palette: ${config.metadata.color_palette}`)
    }
  }

  return parts.join('\n')
}

export async function optimizeImage(
  blob: Blob,
  options: GenerateImageOptions = defaultOptions
): Promise<Blob> {
  // Add image optimization logic here if needed
  return blob
} 