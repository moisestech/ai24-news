import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { userEmailAtom } from '../lib/atoms'
import { timeUtils } from '../lib/utils/time'

const SESSION_KEY = 'ai_news_session'

interface SessionData {
  email: string | null
  lastAccess: string
  usageCount: number
  lastResetDate: string
}

export function useSession() {
  const [, setEmail] = useAtom(userEmailAtom)

  // Handle page refresh and multiple tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_KEY) {
        const data: SessionData = JSON.parse(e.newValue || '{}')
        setEmail(data.email)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [setEmail])

  const saveSession = (data: Partial<SessionData>) => {
    const current = getSession()
    const updated = {
      ...current,
      ...data,
      lastAccess: new Date().toISOString()
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  }

  const getSession = (): SessionData => {
    const defaultSession: SessionData = {
      email: null,
      lastAccess: new Date().toISOString(),
      usageCount: 0,
      lastResetDate: timeUtils.getCurrentDay()
    }

    const saved = localStorage.getItem(SESSION_KEY)
    if (!saved) return defaultSession

    const session: SessionData = JSON.parse(saved)
    
    // Check if we need to reset daily counts
    if (timeUtils.isNewDay(session.lastResetDate)) {
      return {
        ...session,
        usageCount: 0,
        lastResetDate: timeUtils.getCurrentDay()
      }
    }

    return session
  }

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY)
    setEmail(null)
  }

  return {
    saveSession,
    getSession,
    clearSession
  }
} 