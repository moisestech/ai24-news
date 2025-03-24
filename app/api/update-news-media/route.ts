import { NextResponse } from 'next/server'
import { devLog } from '@/lib/utils/log'
import { getAdminSupabase } from '@/lib/supabase/client'
import { NEWS_TABLE } from '@/constants/tables'

export async function POST(request: Request) {
  try {
    const { newsId, imageUrl, audioUrl, audioAlignment, prompt } = await request.json()

    if (!newsId) {
      return NextResponse.json(
        { error: 'News ID is required' },
        { status: 400 }
      )
    }

    devLog('Updating news media', {
      prefix: 'api:update-news-media',
      level: 'info'
    }, {
      data: {
        newsId,
        hasImage: !!imageUrl,
        hasAudio: !!audioUrl,
        hasAlignment: !!audioAlignment,
        alignmentType: audioAlignment ? typeof audioAlignment : 'undefined',
        alignmentKeys: audioAlignment ? Object.keys(audioAlignment) : [],
        hasPrompt: !!prompt
      }
    })

    // Prepare update data
    const updateData: Record<string, any> = {}
    
    if (imageUrl) updateData.image_url = imageUrl
    if (audioUrl) updateData.audio_url = audioUrl
    if (audioAlignment) {
      updateData.audio_alignment = {
        characters: audioAlignment.characters || [],
        character_start_times_seconds: audioAlignment.character_start_times_seconds || [],
        character_end_times_seconds: audioAlignment.character_end_times_seconds || []
      }
    }
    if (prompt) updateData.prompt = prompt

    // Update the news item
    const { data, error } = await getAdminSupabase()
      .from(NEWS_TABLE)
      .update(updateData)
      .eq('id', newsId)
      .select()
      .single()

    if (error) {
      devLog('Failed to update news media', {
        prefix: 'api:update-news-media',
        level: 'error'
      }, { error })
      throw error
    }

    devLog('News media updated successfully', {
      prefix: 'api:update-news-media',
      level: 'info'
    }, {
      data: {
        newsId,
        updatedFields: Object.keys(updateData),
        hasAudioAlignment: !!data.audio_alignment,
        audioAlignmentType: data.audio_alignment ? typeof data.audio_alignment : 'undefined',
        audioAlignmentKeys: data.audio_alignment ? Object.keys(data.audio_alignment) : []
      }
    })

    return NextResponse.json(data)

  } catch (error) {
    devLog('Error updating news media', {
      prefix: 'api:update-news-media',
      level: 'error'
    }, { error })

    return NextResponse.json(
      { error: 'Failed to update news media' },
      { status: 500 }
    )
  }
} 