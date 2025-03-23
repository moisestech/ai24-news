import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { devLog } from '@/lib/utils/log'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const newsId = searchParams.get('newsId')

    if (!newsId) {
      return NextResponse.json({ error: 'Missing newsId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('news_history')
      .select('id, audio_url, audio_alignment, audio_status')
      .eq('id', newsId)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'News not found', details: error },
        { status: 404 }
      )
    }

    // Parse alignment data if available
    let alignment = null
    if (data.audio_alignment) {
      try {
        alignment = JSON.parse(data.audio_alignment)
      } catch (e) {
        devLog('Failed to parse alignment data', {
          prefix: 'get-audio-status',
          level: 'error'
        }, { error: e })
      }
    }

    return NextResponse.json({
      newsId: data.id,
      audioUrl: data.audio_url,
      alignment,
      status: data.audio_status
    })

  } catch (error) {
    devLog('Failed to get audio status', {
      prefix: 'get-audio-status',
      level: 'error'
    }, { error })

    return NextResponse.json(
      { error: 'Failed to get audio status', details: error },
      { status: 500 }
    )
  }
} 