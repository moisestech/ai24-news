'use client'

import { useAtom } from 'jotai'
import { userEmailAtom } from '../lib/atoms'
import { newsQueries } from '../lib/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { devLog } from '../lib/utils/log'
import type { ArtStyleKey } from '@/types/news'
import { NewsHistorySchema, type NewsHistoryRecord } from '@/lib/schemas/news'
import { z } from 'zod'
import { useEffect } from 'react'

interface NewsHistoryItem {
  headline: string
  source: string
  url: string
  image_url: string
  art_style: ArtStyleKey
  created_at: string
  user_email?: string | null
}

export function useSupabaseApp() {
  const [email] = useAtom(userEmailAtom)
  const supabase = createClientComponentClient()

  useEffect(() => {
    devLog('SupabaseApp hook initialized', {
      prefix: 'supabase-app',
      level: 'debug'
    }, {
      isInitialized: !!supabase,
      email
    })
  }, [supabase, email])

  const saveNewsToHistory = async (news: NewsHistoryRecord) => {
    try {
      // First check if entry exists
      const { data: existing } = await supabase
        .from('news_history')
        .select('*')
        .eq('headline', news.headline)
        .eq('source', news.source)
        .single()

      devLog('Fetched existing news', {
        prefix: 'supabase',
        level: 'debug'
      }, { 
        existing,
        hasImage: !!existing?.image_url
      })

      if (existing) {
        devLog('Existing entry found', {
          prefix: 'supabase',
          level: 'info'
        }, { existing })

        // Only update if image_url is different
        if (existing.image_url !== news.image_url) {
          const { data, error } = await supabase
            .from('news_history')
            .update({
              image_url: news.image_url,
              art_style: news.art_style,
              created_at: new Date().toISOString()
            })
            .eq('headline', news.headline)
            .eq('source', news.source)
            .select()
            .single()

          if (error) throw error
          return data
        }

        return existing
      }

      // If no existing entry, insert new one
      const { data, error } = await supabase
        .from('news_history')
        .insert([{
          ...news,
          user_email: email || null
        }])
        .select()
        .single()

      if (error) throw error
      return data

    } catch (error) {
      if (error instanceof z.ZodError) {
        devLog('Validation error', {
          prefix: 'supabase',
          level: 'error'
        }, { 
          issues: error.issues,
          data: news
        })
        throw error
      }
      devLog('Database error', {
        prefix: 'supabase',
        level: 'error'
      }, { error })
      throw error
    }
  }

  const fetchNewsHistory = async () => {
    if (!email) return []

    try {
      return await newsQueries.fetchUserNewsHistory(email)
    } catch (error) {
      console.error('Error fetching news history:', error)
      return []
    }
  }

  return {
    supabase,
    saveNewsToHistory,
    fetchNewsHistory
  }
} 