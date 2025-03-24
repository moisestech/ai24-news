'use client'

import { useAtom } from 'jotai'
import { userEmailAtom } from '../lib/atoms'
import { newsQueries } from '../lib/supabase'
import { devLog } from '../lib/utils/log'
import type { ArtStyleKey } from '@/types/news'
import { NewsHistorySchema, type NewsHistoryRecord } from '@/lib/schemas/news'
import { z } from 'zod'
import { useEffect, useMemo } from 'react'
import { getClientSupabase } from '@/lib/supabase/client'
import { store } from '@/lib/store'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NEWS_TABLE } from '@/constants/tables'
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
  const [email] = useAtom(userEmailAtom, { store })
  
  // Use useMemo to ensure we only create the client once per component instance
  const supabase = useMemo(() => {
    try {
      return getClientSupabase()
    } catch (error) {
      devLog('Error creating Supabase client', {
        prefix: 'supabase-app',
        level: 'error'
      }, { error })
      return null
    }
  }, [])

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
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    try {
      // First check if entry exists
      const { data: existing } = await supabase
        .from(NEWS_TABLE)
        .select('*')
        .eq('headline', news.headline)
        .eq('source_name', news.source)
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
            .from(NEWS_TABLE)
            .update({
              image_url: news.image_url,
              art_style: news.art_style,
              created_at: new Date().toISOString()
            })
            .eq('headline', news.headline)
            .eq('source_name', news.source)
            .select()
            .single()

          if (error) throw error
          return data
        }

        return existing
      }

      // If no existing entry, insert new one
      const { data, error } = await supabase
        .from(NEWS_TABLE)
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