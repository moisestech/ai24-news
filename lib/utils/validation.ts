import { devLog } from './log'

export const validateInput = {
  email: (email: string) => {
    if (!email) throw new Error('Email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format')
    }
    return true
  },

  newsHeadline: (headline: string) => {
    if (!headline?.trim()) throw new Error('Headline is required')
    if (headline.length > 200) throw new Error('Headline too long')
    return headline.trim()
  },

  imageUrl: (url: string) => {
    if (!url) throw new Error('Image URL is required')
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    if (!validExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
      throw new Error('Invalid image format')
    }
    return true
  }
}

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validateImageUrl = (url: string): boolean => {
  return url.startsWith('https://') && (
    url.endsWith('.jpg') || 
    url.endsWith('.png') || 
    url.endsWith('.webp')
  )
}

export const sanitizeUserInput = (input: string): string => {
  return input.trim().slice(0, 1000) // Reasonable length limit
}

export interface ValidationResult {
  isValid: boolean
  message: string
  details?: Record<string, any>
}

/**
 * Validates that the ElevenLabs API key is properly configured
 */
export function validateElevenLabsApiKey(): ValidationResult {
  const apiKey = process.env.ELEVEN_LABS_API_KEY

  if (!apiKey) {
    devLog('ElevenLabs API key is not configured', {
      prefix: 'validation',
      level: 'warn'
    })
    
    return {
      isValid: false,
      message: 'ElevenLabs API key is not configured in your environment variables.'
    }
  }
  
  // Check for common formatting issues
  if (apiKey.includes('YOUR_ELEVEN_LABS_API_KEY') || apiKey.length < 32) {
    devLog('ElevenLabs API key appears to be invalid', {
      prefix: 'validation',
      level: 'warn'
    }, {
      keyLength: apiKey.length,
      containsPlaceholder: apiKey.includes('YOUR_ELEVEN_LABS_API_KEY')
    })
    
    return {
      isValid: false,
      message: 'ElevenLabs API key appears to be invalid or is using a placeholder value.',
      details: {
        length: apiKey.length,
        containsPlaceholder: apiKey.includes('YOUR_ELEVEN_LABS_API_KEY')
      }
    }
  }
  
  return {
    isValid: true,
    message: 'ElevenLabs API key is valid'
  }
}

/**
 * Validates that the Together AI API key is properly configured
 */
export function validateTogetherApiKey(): ValidationResult {
  const apiKey = process.env.TOGETHER_API_KEY

  if (!apiKey) {
    devLog('Together API key is not configured', {
      prefix: 'validation',
      level: 'warn'
    })
    
    return {
      isValid: false,
      message: 'Together API key is not configured in your environment variables.'
    }
  }
  
  return {
    isValid: true,
    message: 'Together API key is valid'
  }
}

/**
 * Provides information about the development environment
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    elevenlabsApiKey: !!process.env.ELEVEN_LABS_API_KEY,
    togetherApiKey: !!process.env.TOGETHER_API_KEY,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
    mockApi: process.env.NEXT_PUBLIC_MOCK_API === 'true',
  }
} 