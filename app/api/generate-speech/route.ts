import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { devLog } from '@/lib/utils/log'
import { elevenLabsService } from '@/lib/services/elevenlabs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { text, voiceId } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    // Generate speech using ElevenLabs service
    const data = await elevenLabsService.generateSpeech({
      text,
      voiceId,
      onProgress: (status) => {
        devLog('Speech generation progress', {
          prefix: 'generate-speech',
          level: 'debug'
        }, { status })
      }
    })
    
    // Convert base64 to blob
    const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audio_base64}`).then(r => r.blob())
    
    // Upload to Supabase Storage
    const filename = `audio/${Date.now()}-${text.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.mp3`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('news-media')
      .upload(filename, audioBlob, {
        contentType: 'audio/mpeg',
        cacheControl: '3600'
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('news-media')
      .getPublicUrl(filename)

    // Store in news_history
    const { error: dbError } = await supabase
      .from('news_history')
      .update({
        audio_url: publicUrl,
        audio_alignment: JSON.stringify(data.alignment)
      })
      .eq('headline', text)

    if (dbError) {
      devLog('Failed to update news_history', {
        prefix: 'generate-speech',
        level: 'error'
      }, { error: dbError })
    }

    return NextResponse.json({
      audioUrl: publicUrl,
      alignment: data.alignment
    })

  } catch (error) {
    devLog('Speech generation failed', {
      prefix: 'generate-speech',
      level: 'error'
    }, { error })

    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    )
  }
} 