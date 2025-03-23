import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { devLog } from '@/lib/utils/log'
import { elevenLabsApi } from '@/lib/elevenlabs'

// Validate environment variables
const requiredEnvVars = {
  ELEVEN_LABS_API_KEY: process.env.ELEVEN_LABS_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Log environment variables status (server-side only)
devLog('Environment variables status', {
  prefix: 'generate-audio',
  level: 'info'
}, {
  data: {
    hasElevenLabsKey: !!requiredEnvVars.ELEVEN_LABS_API_KEY,
    hasSupabaseUrl: !!requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY,
    isDev: process.env.NODE_ENV === 'development',
    nodeEnv: process.env.NODE_ENV
  }
})

// Create Supabase client
const supabase = createClient(
  requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Validate ElevenLabs API key
    if (!requiredEnvVars.ELEVEN_LABS_API_KEY) {
      devLog('ElevenLabs API key is not configured', {
        prefix: 'generate-audio',
        level: 'error'
      }, {
        data: {
          hasKey: false,
          isDev: process.env.NODE_ENV === 'development',
          nodeEnv: process.env.NODE_ENV,
          envVars: Object.keys(requiredEnvVars)
        }
      })
      
      return NextResponse.json({ 
        error: 'ElevenLabs API key is not configured', 
        errorType: 'configuration',
        message: 'Please check your environment variables.'
      }, { status: 500 })
    }

    // Validate request body
    const { headline, newsId } = await request.json()
    if (!headline || !newsId) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        errorType: 'validation',
        message: 'Headline and newsId are required.'
      }, { status: 400 })
    }

    // Generate audio using ElevenLabs API
    const audioData = await elevenLabsApi.generateSpeech(headline)
    
    // Upload audio to Supabase storage
    const audioPath = `audio/${newsId}.mp3`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news-audio')
      .upload(audioPath, Buffer.from(audioData.audio_base64, 'base64'), {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      devLog('Failed to upload audio', {
        prefix: 'generate-audio',
        level: 'error'
      }, { error: uploadError })
      
      return NextResponse.json({ 
        error: 'Failed to upload audio', 
        errorType: 'storage',
        message: uploadError.message
      }, { status: 500 })
    }

    // Get public URL for the uploaded audio
    const { data: { publicUrl } } = supabase.storage
      .from('news-audio')
      .getPublicUrl(audioPath)

    // Transform alignment data for AudioPlayer component
    const transformedAlignment = {
      characters: audioData.alignment.characters,
      character_start_times_seconds: audioData.alignment.character_start_times_seconds,
      character_end_times_seconds: audioData.alignment.character_end_times_seconds
    }

    devLog('Audio generation successful', {
      prefix: 'generate-audio',
      level: 'info'
    }, {
      data: {
        audioUrl: publicUrl,
        hasAlignment: !!transformedAlignment,
        alignmentLength: transformedAlignment.characters.length,
        sampleAlignment: {
          firstChar: transformedAlignment.characters[0],
          firstStart: transformedAlignment.character_start_times_seconds[0],
          firstEnd: transformedAlignment.character_end_times_seconds[0],
          lastChar: transformedAlignment.characters[transformedAlignment.characters.length - 1],
          lastStart: transformedAlignment.character_start_times_seconds[transformedAlignment.character_start_times_seconds.length - 1],
          lastEnd: transformedAlignment.character_end_times_seconds[transformedAlignment.character_end_times_seconds.length - 1]
        }
      }
    })

    // Update news_history with audio URL and alignment
    const { error: updateError } = await supabase
      .from('news_history')
      .update({
        audio_url: publicUrl,
        audio_alignment: transformedAlignment,
        audio_status: 'ready'
      })
      .eq('id', newsId)

    if (updateError) {
      devLog('Failed to update news_history with audio data', {
        prefix: 'generate-audio',
        level: 'error'
      }, { error: updateError })
    }

    return NextResponse.json({ 
      audioUrl: publicUrl,
      alignment: transformedAlignment
    })
  } catch (error) {
    devLog('Audio generation failed', {
      prefix: 'generate-audio',
      level: 'error'
    }, { error })
    
    return NextResponse.json({ 
      error: 'Failed to generate audio', 
      errorType: 'generation',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 