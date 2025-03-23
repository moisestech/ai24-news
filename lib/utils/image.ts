import { devLog } from './log'
import { uploadImageToStorage } from '@/lib/actions/storage'

interface ImageGenerationResult {
  imageUrl: string
  prompt: string
  metadata: {
    model: string
    timestamp: string
  }
}

export async function generateImage(prompt: string): Promise<ImageGenerationResult> {
  try {
    devLog('Starting image generation', {
      prefix: 'image-generation',
      level: 'debug'
    }, {
      data: {
        promptLength: prompt.length,
        model: 'black-forest-labs/FLUX.1-schnell'
      }
    })

    // Only use mock mode if explicitly enabled
    if (process.env.NEXT_PUBLIC_MOCK_API === 'true') {
      devLog('Using mock image', {
        prefix: 'image-generation',
        level: 'debug'
      })
      const fallbackBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      const imageUrl = await uploadImageToStorage(fallbackBase64, prompt)
      return {
        imageUrl,
        prompt,
        metadata: {
          model: 'mock',
          timestamp: new Date().toISOString()
        }
      }
    }

    if (!process.env.TOGETHER_API_KEY) {
      throw new Error('Together API key not configured')
    }

    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt,
        width: 1024,
        height: 768,
        steps: 3,
        response_format: 'base64'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate image')
    }

    const data = await response.json()
    const base64Image = data.data[0].b64_json

    if (!base64Image) {
      throw new Error('No image data received')
    }

    devLog('Raw API response structure:', {
      prefix: 'image-generation',
      level: 'debug'
    }, {
      data: {
        responseType: typeof data,
        hasData: !!data.data,
        dataKeys: Object.keys(data),
        firstItem: {
          type: typeof data.data?.[0],
          keys: data.data?.[0] ? Object.keys(data.data[0]) : [],
          value: data.data?.[0],
          stringified: JSON.stringify(data.data?.[0], null, 2)
        }
      }
    })

    // Upload to Supabase storage
    const imageUrl = await uploadImageToStorage(base64Image, prompt)

    devLog('Image generated and uploaded successfully', {
      prefix: 'image-generation',
      level: 'debug'
    }, {
      data: {
        hasImageUrl: !!imageUrl,
        promptLength: prompt.length,
        base64Length: base64Image.length,
        preview: base64Image.substring(0, 50) + '...'
      }
    })

    return {
      imageUrl,
      prompt,
      metadata: {
        model: 'black-forest-labs/FLUX.1-schnell',
        timestamp: new Date().toISOString()
      }
    }

  } catch (error) {
    devLog('Image generation failed', {
      prefix: 'image-generation',
      level: 'error'
    }, { 
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

export const imageUtils = {
  optimizeUrl: (url: string, { width = 800, quality = 80 } = {}) => {
    // If it's already an optimized URL, return as is
    if (url.includes('imagekit.io')) return url
    
    // For demo, we'll use a simple resize parameter
    // In production, use a proper image optimization service
    return `${url}?w=${width}&q=${quality}`
  },

  getPlaceholder: (width = 800, height = 600) => {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3C/svg%3E`
  },

  preloadImage: (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = src
      img.onload = () => resolve(src)
      img.onerror = reject
    })
  }
} 