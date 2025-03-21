import { useState, useCallback } from 'react'
import { useRateLimit } from '../hooks/useRateLimit'
import { useSession } from '../hooks/useSession'
import { devLog } from '../lib/utils/log'
import type { NewsData } from '@/types/news'

interface FetchNewsState {
  isLoading: boolean
  error: Error | null
  data: NewsData | null
}

export function useFetchNews() {
  const { checkAndDecrementLimit, remainingLimit, isAnonymous } = useRateLimit()
  const { getSession } = useSession()
  const [state, setState] = useState<FetchNewsState>({
    isLoading: false,
    error: null,
    data: null
  })

  const fetchNews = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check rate limit first
      const canProceed = await checkAndDecrementLimit()
      if (!canProceed) {
        throw new Error('Rate limit exceeded')
      }

      // Fetch news from API
      const response = await fetch('/api/fetch-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session: getSession()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()

      setState({
        isLoading: false,
        error: null,
        data
      })

      return data

    } catch (error) {
      devLog('News fetch failed', {
        prefix: 'fetch-news',
        level: 'error'
      }, { error })

      setState({
        isLoading: false,
        error: error as Error,
        data: null
      })

      throw error
    }
  }, [checkAndDecrementLimit, getSession])

  return {
    ...state,
    fetchNews,
    remainingLimit,
    isAnonymous
  }
} 