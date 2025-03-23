import { getEnvironmentInfo } from './utils/validation'

// Get environment info
const envInfo = getEnvironmentInfo()

// Feature flags
export const config = {
  features: {
    audio: {
      enabled: true, // Always enabled on client, server will handle validation
      fallbackMode: false // Removed client-side fallback mode
    },
    image: {
      enabled: true, // Always enabled on client, server will handle validation
      fallbackMode: false // Removed client-side fallback mode
    }
  },
  debug: {
    enabled: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
    bypassRateLimit: process.env.NEXT_PUBLIC_BYPASS_RATE_LIMIT === 'true',
    mockImageGeneration: process.env.NEXT_PUBLIC_MOCK_IMAGE_GENERATION === 'true'
  }
}

// Log environment info (server-side only)
if (typeof window === 'undefined') {
  console.log('Environment Info:', envInfo)
}
