import { ArtStyle, type ArtStyleKey, type ArtStyleValue } from '@/types/art'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// UTILS
import { devLog } from '@/lib/utils/log'
import { generateImage } from '@/lib/image'
import { getArtStylePrompt } from '@/lib/art-styles'
import { isValidArtStyle, normalizeArtStyle } from '@/lib/utils/art/server'
import { getArtStyleValue } from '@/lib/utils/art/artStyles'

let ratelimit: Ratelimit | undefined

if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(5, "1440 m"),
    analytics: true,
    prefix: "ai24news",
  })
}

export async function POST(request: Request) {
  try {
    const { headline, style, prompt, newsId } = await request.json()

    // Validate required fields
    if (!headline || !style || !prompt) {
      return NextResponse.json(
        { details: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate art style
    if (!isValidArtStyle(style)) {
      devLog('Invalid art style received', {
        prefix: 'api:generate-image',
        level: 'error'
      }, {
        data: {
          receivedStyle: style,
          validStyles: Object.values(ArtStyle)
        }
      })
      
      return NextResponse.json(
        { 
          details: 'Invalid art style',
          validStyles: Object.values(ArtStyle)
        },
        { status: 400 }
      )
    }

    // Convert style to proper format
    const normalizedStyle = normalizeArtStyle(style) as ArtStyleKey

    devLog('Generating image', {
      prefix: 'api:generate-image',
      level: 'info'
    }, {
      data: {
        headline,
        style: normalizedStyle,
        prompt,
        newsId
      }
    })

    // Generate the image using the provided prompt
    const base64Image = await generateImage({
      prompt,
      style: normalizedStyle,
      metadata: {
        style_notes: [],
        composition: '',
        lighting: '',
        color_palette: ''
      }
    })

    devLog('Image generated successfully', {
      prefix: 'api:generate-image',
      level: 'info'
    }, {
      data: {
        hasImageData: !!base64Image,
        newsId
      }
    })

    return NextResponse.json({
      imageData: base64Image,
      prompt,
      style: ArtStyle[normalizedStyle]
    })

  } catch (error) {
    devLog('Image generation failed', {
      prefix: 'api:generate-image',
      level: 'error'
    }, { error })
    
    return NextResponse.json({
      error: 'Image generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getIPAddress() {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  return forwardedFor || 'unknown'
}

export const runtime = "edge" 