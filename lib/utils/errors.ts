export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> => {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (attempt === maxAttempts) throw error
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
    }
  }
  
  throw lastError
}

export const handleImageFailure = async (error: Error) => {
  // Log error
  console.error('Image generation failed:', error)
  // Return fallback image URL
  return '/images/fallback-news-image.jpg'
}

export class RateLimitError extends Error {
  constructor() {
    super('Daily limit reached')
    this.name = 'RateLimitError'
  }
}

export const handleApiError = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof RateLimitError) throw error
      if (i === maxRetries - 1) throw error
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }
  throw new Error('Max retries exceeded')
} 