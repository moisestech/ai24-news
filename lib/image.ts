import { ArtStyle } from '@/types/art'
import Together from "together-ai"

interface GenerateImageOptions {
  width?: number
  height?: number
  steps?: number
  seed?: number
  iterativeMode?: boolean
}

const defaultOptions: GenerateImageOptions = {
  width: 1024,
  height: 768,
  steps: 3,
  iterativeMode: false
}

export async function generateImage(
  headline: string,
  style: keyof typeof ArtStyle,
  options: GenerateImageOptions = defaultOptions
): Promise<Blob> {
  try {
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      MOCK_API: process.env.NEXT_PUBLIC_MOCK_API,
      TOGETHER_API_KEY: !!process.env.TOGETHER_API_KEY,
      HELICONE_API_KEY: !!process.env.HELICONE_API_KEY
    })

    // Only use mock mode if explicitly enabled
    if (process.env.NEXT_PUBLIC_MOCK_API === 'true') {
      console.log('Using mock image')
      const fallbackBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      const byteCharacters = atob(fallbackBase64)
      const byteArray = new Uint8Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i)
      }
      return new Blob([byteArray], { type: 'image/png' })
    }

    if (!process.env.TOGETHER_API_KEY) {
      throw new Error('Together API key not configured')
    }

    // Create Together client
    const client = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
      baseURL: process.env.HELICONE_API_KEY ? "https://together.helicone.ai/v1" : undefined,
      defaultHeaders: process.env.HELICONE_API_KEY ? {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`
      } : undefined
    })

    const styleDisplay = ArtStyle[style]
    const prompt = `${headline}. Use a ${styleDisplay} style for the image.`

    console.log('Calling Together API:', {
      prompt,
      model: "black-forest-labs/FLUX.1-schnell",
      options
    })

    const response = await client.images.create({
      prompt,
      model: "black-forest-labs/FLUX.1-schnell",
      width: options.width,
      height: options.height,
      seed: options.iterativeMode ? 123 : undefined,
      steps: options.steps,
      response_format: "base64"
    })

    console.log('Raw API response structure:', {
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
    })

    // Log the full response for debugging
    console.log('Full API response:', JSON.stringify(response, null, 2))

    const firstItem = response.data?.[0]
    if (!firstItem) {
      throw new Error('No data in response')
    }

    console.log('First item structure:', {
      type: typeof firstItem,
      keys: Object.keys(firstItem),
      hasBase64: 'base64' in firstItem,
      hasImage: 'image' in firstItem,
      hasB64Json: 'b64_json' in firstItem,
      properties: Object.getOwnPropertyNames(firstItem)
    })

    // Get base64 from b64_json field
    const base64String = (firstItem as any).b64_json
    if (typeof base64String !== 'string') {
      console.error('Invalid base64 data:', {
        type: typeof base64String,
        value: base64String,
        availableFields: Object.keys(firstItem || {})
      })
      throw new Error('Invalid or missing base64 data in response')
    }

    console.log('Base64 data found:', {
      length: base64String.length,
      preview: base64String.substring(0, 50) + '...'
    })

    try {
      const byteCharacters = atob(base64String)
      const byteArray = new Uint8Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i)
      }
      
      const blob = new Blob([byteArray], { type: 'image/jpeg' }) // Changed to jpeg since that's what the base64 header suggests
      
      console.log('Blob created:', {
        size: blob.size,
        type: blob.type
      })

      return blob
    } catch (error) {
      console.error('Failed to convert base64 to blob:', {
        error,
        base64Length: base64String.length,
        base64Start: base64String.substring(0, 50)
      })
      throw new Error('Failed to convert image data')
    }

  } catch (error) {
    console.error('Image generation failed:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

export async function optimizeImage(
  blob: Blob,
  options: GenerateImageOptions = defaultOptions
): Promise<Blob> {
  // Add image optimization logic here if needed
  return blob
} 