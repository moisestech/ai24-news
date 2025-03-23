import { ArtStyle, type ArtStyleKey, type ArtStyleValue } from '@/types/art'
import { createClient } from '@supabase/supabase-js'
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

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { headline, artStyle, prompt, newsId } = await request.json()

    // Validate required fields
    if (!headline || !artStyle || !prompt) {
      return NextResponse.json(
        { details: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate art style
    if (!isValidArtStyle(artStyle)) {
      devLog('Invalid art style received', {
        prefix: 'api:generate-image',
        level: 'error'
      }, {
        data: {
          receivedArtStyle: artStyle,
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
    const normalizedArtStyle = normalizeArtStyle(artStyle) as ArtStyleKey

    devLog('Generating image', {
      prefix: 'api:generate-image',
      level: 'info'
    }, {
      data: {
        headline,
        artStyle: normalizedArtStyle,
        prompt,
        newsId
      }
    })

    // Generate the image using the provided prompt
    const base64Image = await generateImage({
      prompt,
      style: normalizedArtStyle,
      metadata: {
        style_notes: [],
        composition: '',
        lighting: '',
        color_palette: ''
      }
    })

    // Convert base64 to blob
    const binaryString = atob(base64Image)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const imageBlob = new Blob([bytes], { type: 'image/jpeg' })

    // Upload to Supabase Storage
    const filename = `${Date.now()}-${headline.slice(0, 50).replace(/[^a-z0-9]/gi, '_')}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news-images')
      .upload(filename, imageBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      })

    if (uploadError) {
      devLog('Image upload failed', {
        prefix: 'api:generate-image',
        level: 'error'
      }, { error: uploadError })
      
      return NextResponse.json({
        error: 'Failed to upload image',
        details: uploadError.message
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('news-images')
      .getPublicUrl(filename)

    // Update news_history with image_url and prompt if newsId is provided
    if (newsId) {
      const { error: updateError } = await supabase
        .from('news_history')
        .update({ 
          image_url: publicUrl,
          prompt: prompt
        })
        .eq('id', newsId)

      if (updateError) {
        devLog('Failed to update news_history', {
          prefix: 'api:generate-image',
          level: 'error'
        }, { error: updateError })
      }
    }

    devLog('Image uploaded successfully', {
      prefix: 'api:generate-image',
      level: 'info'
    }, {
      data: {
        filename,
        publicUrl,
        size: imageBlob.size,
        newsId
      }
    })

    return NextResponse.json({
      imageData: base64Image,
      prompt,
      artStyle: ArtStyle[normalizedArtStyle],
      imageUrl: publicUrl
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