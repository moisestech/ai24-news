'use client'

import { useAtom } from 'jotai'
import { userEmailAtom } from '../atoms'
import { newsQueries } from '../supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useSupabaseApp() {
  const [email] = useAtom(userEmailAtom)
  const supabase = createClientComponentClient()

  const saveNewsToHistory = async (newsData: {
    headline: string
    source: string
    url: string
    image_url?: string
  }) => {
    if (!email) return null

    try {
      return await newsQueries.saveNewsToHistory({
        ...newsData,
        user_email: email
      })
    } catch (error) {
      console.error('Error saving news:', error)
      return null
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