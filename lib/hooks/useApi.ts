'use client'

import { useState } from 'react'
import { useLocalStorage } from '@uidotdev/usehooks'
import { useToast } from '@/hooks/use-toast'

interface CacheConfig {
  key: string
  ttl: number // Time to live in milliseconds
}

interface RetryConfig {
  maxAttempts: number
  delay: number // Delay between retries in milliseconds
}

export function useApi<T>() {
  const [isLoading, setIsLoading] = useState(false)
  const [cache, setCache] = useLocalStorage<Record<string, { data: T; timestamp: number }>>(
    'api-cache',
    {}
  )
  const { toast } = useToast()

  const fetchWithCache = async (
    url: string,
    options?: RequestInit,
    cacheConfig?: CacheConfig,
    retryConfig?: RetryConfig
  ): Promise<T> => {
    setIsLoading(true)

    try {
      // Check cache first
      if (cacheConfig) {
        const cached = cache[cacheConfig.key]
        const now = Date.now()
        
        if (cached && now - cached.timestamp < cacheConfig.ttl) {
          setIsLoading(false)
          return cached.data
        }
      }

      // Implement retry logic
      const attempt = async (attemptNumber: number): Promise<T> => {
        try {
          const response = await fetch(url, options)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()

          // Update cache if configured
          if (cacheConfig) {
            setCache({
              ...cache,
              [cacheConfig.key]: { data, timestamp: Date.now() }
            })
          }

          return data
        } catch (error) {
          if (retryConfig && attemptNumber < retryConfig.maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryConfig.delay))
            return attempt(attemptNumber + 1)
          }
          throw error
        }
      }

      const data = await attempt(1)
      setIsLoading(false)
      return data
    } catch (error) {
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