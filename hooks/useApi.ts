'use client'

import { useState } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useToast } from '@/hooks/use-toast'
import { devLog } from '@/lib/utils/log'

interface CacheOptions {
  key: string
  ttl: number // Time to live in milliseconds
}

interface RetryOptions {
  maxAttempts: number
  delay: number // Delay between retries in milliseconds
}

type FetchOptions = RequestInit & {
  retry?: RetryOptions
}

export function useApi() {
  const [isLoading, setIsLoading] = useState(false)
  const [cache, setCache] = useLocalStorage<Record<string, { data: any; timestamp: number }>>(
    'api-cache',
    {}
  )
  const { toast } = useToast()

  const fetchWithCache = async <T>(
    url: string,
    options?: FetchOptions,
    cacheOptions?: CacheOptions
  ): Promise<T> => {
    try {
      devLog('Starting API request', {
        prefix: 'useApi',
        level: 'debug',
        timestamp: true
      })

      devLog({ url, options, cacheOptions }, {
        prefix: 'useApi',
        level: 'debug'
      })

      setIsLoading(true)

      // Check cache first
      if (cacheOptions) {
        const cached = cache[cacheOptions.key]
        const now = Date.now()
        
        if (cached && now - cached.timestamp < cacheOptions.ttl) {
          setIsLoading(false)
          return cached.data as T
        }
      }

      // Implement retry logic
      const attempt = async (attemptNumber: number): Promise<T> => {
        try {
          const response = await fetch(url, options)
          
          if (!response.ok) {
            devLog('API request failed', {
              prefix: 'useApi',
              level: 'error',
              timestamp: true
            })

            devLog({
              status: response.status,
              statusText: response.statusText,
              url
            }, {
              prefix: 'useApi',
              level: 'error'
            })

            throw new Error(`API Error: ${response.statusText}`)
          }
          
          const data = await response.json()

          devLog('API request successful', {
            prefix: 'useApi',
            level: 'info',
            timestamp: true
          })

          devLog({ data }, {
            prefix: 'useApi',
            level: 'debug'
          })

          // Update cache if configured
          if (cacheOptions) {
            setCache({
              ...cache,
              [cacheOptions.key]: { data, timestamp: Date.now() }
            })
          }

          return data as T
        } catch (error) {
          const retryOptions = options?.retry
          if (retryOptions && attemptNumber < retryOptions.maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryOptions.delay))
            return attempt(attemptNumber + 1)
          }
          throw error
        }
      }

      const data = await attempt(1)
      setIsLoading(false)
      return data
    } catch (error) {
      devLog('API request error', {
        prefix: 'useApi',
        level: 'error',
        timestamp: true
      })

      devLog({
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }, {
        prefix: 'useApi',
        level: 'error'
      })

      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data. Please try again."
      })
      throw error
    }
  }

  return {
    isLoading,
    fetchWithCache
  }
} 