import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { devLog } from '@/lib/utils/log'
import { elevenLabsApi } from '@/lib/elevenlabs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(request: Request) {
  try {
    // Validate ElevenLabs API key is configured
    if (!process.env.ELEVEN_LABS_API_KEY) {
      devLog('ElevenLabs API key is not configured', {
        prefix: 'generate-audio',
        level: 'error'
      })
      
      return NextResponse.json({ 
        error: 'ElevenLabs API key is not configured', 
        errorType: 'configuration',
        message: 'Please configure your ElevenLabs API key in the environment variables.'
      }, { status: 500 })
    }

    const { headline, newsId, voiceId = '21m00Tcm4TlvDq8ikWAM' } = await request.json()

    if (!headline) {
      return NextResponse.json({ error: 'Missing headline' }, { status: 400 })
    }

    if (!newsId) {
      return NextResponse.json({ error: 'Missing newsId' }, { status: 400 })
    }

    // Update news status to processing
    const { error: updateError } = await supabase
      .from('news_history')
      .update({ 
        audio_status: 'processing'
      })
      .eq('id', newsId)

    if (updateError) {
      devLog('Failed to update news status', {
        prefix: 'generate-audio',
        level: 'error'
      }, { error: updateError })
      
      return NextResponse.json(
        { error: 'Failed to update news status', details: updateError },
        { status: 500 }
      )
    }

    // Call ElevenLabs API
    try {
      // Start API call
      devLog('Calling ElevenLabs API', {
        prefix: 'generate-audio',
        level: 'info'
      }, {
        headline,
        newsId,
        voiceId
      })

      const data = await elevenLabsApi.generateSpeech(headline, voiceId)
      
      if (!data || !data.audio_base64) {
        throw new Error('No audio data returned from ElevenLabs API')
      }
      
      // Convert base64 to blob
      const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audio_base64}`).then(r => r.blob())
      
      // Upload to Supabase Storage
      const filename = `audio/${newsId}-${Date.now()}.mp3`
      const { error: uploadError } = await supabase.storage
        .from('news-media')
        .upload(filename, audioBlob, {
          contentType: 'audio/mpeg',
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('news-media')
        .getPublicUrl(filename)

      // Update news_history with audio URL and alignment data
      const { error: saveError } = await supabase
        .from('news_history')
        .update({
          audio_url: publicUrl,
          audio_alignment: JSON.stringify(data.alignment),
          audio_status: 'ready'
        })
        .eq('id', newsId)

      if (saveError) throw saveError

      return NextResponse.json({
        success: true,
        newsId,
        status: 'ready',
        audioUrl: publicUrl
      })

    } catch (error: any) {
      // Handle different types of errors
      let errorMessage = 'Audio generation failed'
      let errorType = 'unknown'
      let statusCode = 500
      
      // Mark as failed in database
      await supabase
        .from('news_history')
        .update({ 
          audio_status: 'failed',
          audio_error: error?.message || errorMessage
        })
        .eq('id', newsId)
        
      if (error.response) {
        // API responded with an error status
        const status = error.response.status
        
        if (status === 401) {
          errorType = 'authentication'
          errorMessage = 'ElevenLabs API authentication failed. Please check your API key.'
          statusCode = 401
        } else if (status === 429) {
          errorType = 'rate_limit'
          errorMessage = 'ElevenLabs API rate limit exceeded. Please try again later.'
          statusCode = 429
        }
      } else if (error.request) {
        // No response received
        errorType = 'network'
        errorMessage = 'Network error when connecting to ElevenLabs API. Please check your internet connection.'
      }
      
      devLog(errorMessage, {
        prefix: 'generate-audio',
        level: 'error'
      }, { 
        error,
        errorType,
        newsId 
      })

      return NextResponse.json(
        { 
          error: errorMessage, 
          errorType,
          details: error?.message || 'Unknown error'
        },
        { status: statusCode }
      )
    }

  } catch (error: any) {
    devLog('Audio generation failed', {
      prefix: 'generate-audio',
      level: 'error'
    }, { error })

    return NextResponse.json(
      { 
        error: 'Audio generation failed', 
        errorType: 'server',
        details: error?.message || 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 