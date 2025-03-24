'use server'

import { devLog } from '@/lib/utils/log'
import { getAdminSupabase } from '@/lib/supabase/client'
import { NEWS_TABLE } from '@/constants/tables'

export async function saveNewsImage(
  newsId: string,
  imageUrl: string
): Promise<void> {
  try {
    devLog('Saving news image URL', {
      prefix: 'news-action',
      level: 'debug'
    }, {
      data: {
        newsId,
        imageUrl,
        timestamp: new Date().toISOString()
      }
    })

    const { error } = await getAdminSupabase()
      .from(NEWS_TABLE)
      .update({ 
        image_url: imageUrl
      })
      .eq('id', newsId)

    if (error) {
      devLog('Failed to save news image URL', {
        prefix: 'news-action',
        level: 'error'
      }, {
        error,
        data: {
          newsId,
          imageUrl,
          timestamp: new Date().toISOString()
        }
      })
      throw error
    }

    devLog('News image URL saved successfully', {
      prefix: 'news-action',
      level: 'debug'
    }, {
      data: {
        newsId,
        imageUrl,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    devLog('Error saving news image URL', {
      prefix: 'news-action',
      level: 'error'
    }, {
      error,
      data: {
        newsId,
        imageUrl,
        timestamp: new Date().toISOString()
      }
    })
    throw error
  }
} 