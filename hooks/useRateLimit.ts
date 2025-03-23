'use client'

import type { AnonymousSession } from '@/types/art'
import { useAtom } from 'jotai'
import { userLimitAtom } from '../lib/atoms'
import { rateLimitQueries } from '../lib/supabase'
import { useSession } from './useSession'
import { timeUtils } from '../lib/utils/time'
import { RateLimitError } from '../lib/utils/errors'
import { config } from '@/lib/config'
import { devLog } from '@/lib/utils/log'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const DAILY_LIMIT = 5
const ANONYMOUS_LIMIT = 1
const ANONYMOUS_STORAGE_KEY = 'ai24_anonymous_session'
const isBrowser = typeof window !== 'undefined'

interface RateLimitSession {
  email: string | null
  usageCount: number
  lastResetDate: string
  anonymousId?: string
}

export function useRateLimit() {
  const { getSession: getBaseSession, saveSession } = useSession()
  const [remainingLimit, setRemainingLimit] = useAtom(userLimitAtom)
  
  // Get or create anonymous session
  const getAnonymousSession = useCallback(() => {
    if (!isBrowser) {
      return {
        id: '',
        generationsToday: 0,
        lastResetDate: timeUtils.getCurrentDay()
      }
    }
    
    const stored = localStorage.getItem(ANONYMOUS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    
    const newSession = {
      id: uuidv4(),
      generationsToday: 0,
      lastResetDate: timeUtils.getCurrentDay()
    }
    localStorage.setItem(ANONYMOUS_STORAGE_KEY, JSON.stringify(newSession))
    return newSession
  }, [])

  // Update anonymous session
  const updateAnonymousSession = useCallback((updates: Partial<AnonymousSession>) => {
    if (!isBrowser) return null
    
    const current = getAnonymousSession()
    const updated = { ...current, ...updates }
    localStorage.setItem(ANONYMOUS_STORAGE_KEY, JSON.stringify(updated))
    return updated
  }, [getAnonymousSession])

  const getSession = useCallback((): RateLimitSession => {
    const session = getBaseSession()
    if (session.email) {
      return {
        email: session.email,
        usageCount: session.usageCount || 0,
        lastResetDate: session.lastResetDate || timeUtils.getCurrentDay()
      }
    }

    // Handle anonymous session
    const anonymousSession = getAnonymousSession()
    return {
      email: null,
      usageCount: anonymousSession.generationsToday,
      lastResetDate: anonymousSession.lastResetDate,
      anonymousId: anonymousSession.id
    }
  }, [getBaseSession, getAnonymousSession])

  const checkAndDecrementLimit = useCallback(async () => {
    if (config.debug.bypassRateLimit) {
      devLog('Rate limit check bypassed (debug mode)', {
        prefix: 'rate-limit',
        level: 'debug'
      })
      return true
    }

    const session = getSession()
    const isAnonymous = !session.email

    try {
      // Check if we need to reset
      if (timeUtils.isNewDay(session.lastResetDate)) {
        if (isAnonymous) {
          updateAnonymousSession({
            generationsToday: 0,
            lastResetDate: timeUtils.getCurrentDay()
          })
        } else {
          await rateLimitQueries.resetDailyLimit(session.email!)
        }
        
        saveSession({
          usageCount: 0,
          lastResetDate: timeUtils.getCurrentDay()
        })
        
        setRemainingLimit(isAnonymous ? ANONYMOUS_LIMIT : DAILY_LIMIT)
        return true
      }

      // Check current usage
      const limit = isAnonymous ? ANONYMOUS_LIMIT : DAILY_LIMIT
      const currentUsage = isAnonymous 
        ? session.usageCount
        : await rateLimitQueries.getDailyUsage(session.email!)

      if (currentUsage >= limit) {
        throw new RateLimitError()
      }

      // Don't increment usage here - it will be done after successful operation
      return true
    } catch (error) {
      if (error instanceof RateLimitError) throw error
      devLog('Rate limit check failed', {
        prefix: 'rate-limit',
        level: 'error'
      }, { error })
      return false
    }
  }, [getSession, saveSession, setRemainingLimit, updateAnonymousSession])

  const incrementUsage = useCallback(async () => {
    const session = getSession()
    const isAnonymous = !session.email

    try {
      // Increment usage
      if (isAnonymous) {
        updateAnonymousSession({
          generationsToday: session.usageCount + 1,
          lastGeneration: new Date().toISOString()
        })
      } else {
        await rateLimitQueries.incrementUsage(session.email!)
      }
      
      // Update local state
      const newUsage = session.usageCount + 1
      saveSession({ usageCount: newUsage })
      setRemainingLimit((isAnonymous ? ANONYMOUS_LIMIT : DAILY_LIMIT) - newUsage)
      
      return true
    } catch (error) {
      devLog('Failed to increment usage', {
        prefix: 'rate-limit',
        level: 'error'
      }, { error })
      return false
    }
  }, [getSession, saveSession, setRemainingLimit, updateAnonymousSession])

  const resetLimit = useCallback(async () => {
    const session = getSession()
    if (!session.email) return false
    
    try {
      await rateLimitQueries.resetDailyLimit(session.email)
      saveSession({
        usageCount: 0,
        lastResetDate: timeUtils.getCurrentDay()
      })
      setRemainingLimit(DAILY_LIMIT)

      devLog('Rate limit reset', {
        prefix: 'rate-limit',
        level: 'info'
      }, {
        data: {
          email: session.email,
          newLimit: DAILY_LIMIT,
          resetDate: timeUtils.getCurrentDay()
        }
      })

      return true
    } catch (error) {
      devLog('Failed to reset limit', {
        prefix: 'rate-limit',
        level: 'error'
      }, { error })
      return false
    }
  }, [getSession, saveSession, setRemainingLimit])

  return {
    remainingLimit,
    checkAndDecrementLimit,
    incrementUsage,
    resetLimit,
    getSession,
    isAnonymous: !getSession().email
  }
}   