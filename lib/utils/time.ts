// First, create time utilities for consistent rate limit resets
export const timeUtils = {
  getCurrentDay: () => new Date().toISOString().split('T')[0],
  
  isNewDay: (lastCheckTime: string) => {
    const lastCheck = new Date(lastCheckTime).toDateString()
    const now = new Date().toDateString()
    return lastCheck !== now
  },
  
  getNextResetTime: () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }
} 