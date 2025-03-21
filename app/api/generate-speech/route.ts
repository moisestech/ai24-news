import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { devLog } from '@/lib/utils/log'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(request: Request) {
  try {
    const { text, voiceId } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      }
    )

    if (!response.ok) {
      throw new Error('ElevenLabs API call failed')
    }

    const data = await response.json()
    
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