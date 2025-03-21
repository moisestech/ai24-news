import { devLog } from '@/lib/utils/log'
import { generateImage } from '@/lib/image'
import { ArtStyle } from '@/types/art'
import type { ArtStyleKey } from '@/types/news'
import { config } from '@/lib/config'
import { headers } from 'next/headers'
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { getArtStyleKey, isArtStyleKey, debugArtStyle } from '@/types/art'
import { getArtStyleDisplay } from '@/lib/utils/art'

let ratelimit: Ratelimit | undefined

// Add rate limiting if Upstash API keys are set
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
    const body = await request.json()
    
    devLog('Generate image request received', {
      prefix: 'api:generate-image',
      level: 'debug'
    }, {
      data: { 
        body,
        artStyle: {
          received: body.style,
          type: typeof body.style,
          isValid: isArtStyleKey(body.style),
          display: isArtStyleKey(body.style) ? getArtStyleDisplay(body.style as ArtStyleKey) : null
        },
        env: {
          NODE_ENV: process.env.NODE_ENV,
          MOCK_API: process.env.NEXT_PUBLIC_MOCK_API,
          hasTogetherKey: !!process.env.TOGETHER_API_KEY,
          hasHeliconeKey: !!process.env.HELICONE_API_KEY
        }
      }
    })

    const { headline, style } = body

    // Convert display value to enum key
    const styleKey = Object.entries(ArtStyle)
      .find(([_, value]) => value === style)?.[0] as ArtStyleKey

    devLog('Style conversion', {
      prefix: 'api:generate-image',
      level: 'debug'
    }, {
      data: {
        input: style,
        foundKey: styleKey,
        enumEntries: Object.entries(ArtStyle).map(([k, v]) => ({ key: k, value: v })),
        exactMatch: Object.values(ArtStyle).includes(style),
        requestData: {
          headline,
          style: styleKey
        }
      }
    })

    if (!styleKey) {
      devLog('Invalid art style', {
        prefix: 'api:generate-image',
        level: 'error'
      }, {
        data: {
          receivedStyle: style,
          validValues: Object.values(ArtStyle),
          stringComparison: Object.values(ArtStyle).map(v => ({
            value: v,
            matches: v === style,
            lengthMatch: v.length === style.length
          }))
        }
      })
      return Response.json({
        error: 'Invalid art style',
        details: `Style must be one of: ${Object.values(ArtStyle).join(', ')}`
      }, { status: 400 })
    }

    // Use the validated enum key
    try {
      const imageData = await generateImage(headline, styleKey)

      devLog('Image generation result', {
        prefix: 'api:generate-image',
        level: 'debug'
      }, {
        data: {
          success: true,
          imageType: imageData.type,
          imageSize: imageData.size,
          isMockImage: imageData.size < 100 // The mock image is very small
        }
      })

      // Convert Blob to base64
      const arrayBuffer = await imageData.arrayBuffer()
      const base64String = Buffer.from(arrayBuffer).toString('base64')

      devLog('Response preparation', {
        prefix: 'api:generate-image',
        level: 'debug'
      }, {
        data: {
          base64Length: base64String.length,
          isMockBase64: base64String === 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        }
      })

      return Response.json({
        imageData: base64String,
        style: style,
        success: true
      })

    } catch (generateError) {
      devLog('Image generation failed', {
        prefix: 'api:generate-image',
        level: 'error'
      }, {
        error: generateError,
        data: {
          headline,
          style: styleKey,
          displayValue: getArtStyleDisplay(styleKey as ArtStyleKey)
        }
      })

      return Response.json({
        error: 'Failed to generate image',
        details: generateError instanceof Error ? generateError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    devLog('API error', {
      prefix: 'api:generate-image',
      level: 'error'
    }, {
      error,
      stack: error instanceof Error ? error.stack : undefined
    })

    return Response.json({
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function getIPAddress() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0"
  const headersList = await headers()
  const forwardedFor = headersList.get("x-forwarded-for")

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS
  }

  return headersList.get("x-real-ip") ?? FALLBACK_IP_ADDRESS
}

export const runtime = "edge" 