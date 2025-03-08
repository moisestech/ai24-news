'use client'

import { useAtom } from 'jotai'
import { userLimitAtom } from '../atoms'
import { rateLimitQueries } from '../supabase'
import { useSession } from './useSession'
import { timeUtils } from '../utils/time'
import { RateLimitError } from '../utils/errors'

const DAILY_LIMIT = 5

export function useRateLimit() {
  const { getSession, saveSession } = useSession()
  const [remainingLimit, setRemainingLimit] = useAtom(userLimitAtom)
  
  const checkAndDecrementLimit = async () => {
    const session = getSession()
    if (!session.email) return false
    
    try {
      // Check if we need to reset
      if (timeUtils.isNewDay(session.lastResetDate)) {
        await rateLimitQueries.resetDailyLimit(session.email)
        saveSession({
          usageCount: 0,
          lastResetDate: timeUtils.getCurrentDay()
        })
        setRemainingLimit(DAILY_LIMIT)
        return true
      }

      // Check current usage
      const currentUsage = await rateLimitQueries.getDailyUsage(session.email)
      if (currentUsage >= DAILY_LIMIT) {
        throw new RateLimitError()
      }

      // Increment usage atomically
      await rateLimitQueries.incrementUsage(session.email)
      
      // Update local state
      const newUsage = session.usageCount + 1
      saveSession({ usageCount: newUsage })
      setRemainingLimit(DAILY_LIMIT - newUsage)
      
      return true
    } catch (error) {
      if (error instanceof RateLimitError) throw error
      console.error('Rate limit check failed:', error)
      return false
    }
  }

  const resetLimit = async () => {
    const session = getSession()
    if (!session.email) return false
    
    try {
      await rateLimitQueries.resetDailyLimit(session.email)
      saveSession({
        usageCount: 0,
        lastResetDate: timeUtils.getCurrentDay()
      })
      setRemainingLimit(DAILY_LIMIT)
      return true
    } catch (error) {
      console.error('Failed to reset limit:', error)
      return false
    }
  }

  return {
    remainingLimit,
    checkAndDecrementLimit,
    resetLimit
  }
}   