type DebugConfig = {
  bypassRateLimit: boolean;
  mockApi: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enabledLogPrefixes: string[];
  disabledFeatures: {
    audioGeneration: boolean;
    imageGeneration: boolean;
  };
  enabled: boolean;
}

type AppConfig = {
  debug: DebugConfig;
  features: {
    audio: {
      enabled: boolean;
      fallbackMode: boolean; // When true, shows UI but doesn't make API calls
      availableVoices: Array<{
        id: string;
        name: string;
      }>;
    };
    image: {
      enabled: boolean;
      fallbackMode: boolean;
    };
  };
}

// Determine if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Check if essential API keys are available
const hasElevenLabsKey = !!process.env.ELEVEN_LABS_API_KEY;
const hasImageApiKey = !!process.env.TOGETHER_API_KEY;

// Configure debug settings based on environment
const debugConfig: DebugConfig = {
  bypassRateLimit: isDev && process.env.BYPASS_RATE_LIMIT === 'true',
  mockApi: process.env.NEXT_PUBLIC_MOCK_API === 'true',
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  enabledLogPrefixes: process.env.NEXT_PUBLIC_ENABLED_LOG_PREFIXES?.split(',') || ['*'],
  disabledFeatures: {
    audioGeneration: !hasElevenLabsKey,
    imageGeneration: !hasImageApiKey
  },
  enabled: true
};

// Log the configuration in development mode
if (isDev) {
  console.log('Debug Config:', debugConfig);
}

export const config: AppConfig = {
  debug: debugConfig,
  features: {
    audio: {
      enabled: hasElevenLabsKey || isDev,
      fallbackMode: !hasElevenLabsKey && isDev,
      availableVoices: [
        {
          id: '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel'
        },
        {
          id: 'AZnzlk1XvdvUeBnXmlld',
          name: 'Domi'
        },
        {
          id: 'EXAVITQu4vr4xnSDxMaL',
          name: 'Bella'
        },
        {
          id: 'ErXwobaYiN019PkySvjV',
          name: 'Antoni'
        }
      ]
    },
    image: {
      enabled: hasImageApiKey || isDev,
      fallbackMode: !hasImageApiKey && isDev
    }
  }
};

export default config;
