import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { devLog } from '../utils/log'

// Singleton instances
let clientInstance: ReturnType<typeof createClientComponentClient> | null = null
let adminInstance: ReturnType<typeof createClient> | null = null
let storageInstance: ReturnType<typeof createClient> | null = null

// Track client creation
let clientCreated = false
let adminCreated = false
let storageCreated = false

// Client-side Supabase client
export function getClientSupabase() {
  if (typeof window === 'undefined') {
    throw new Error('getClientSupabase can only be used in browser context')
  }

  if (!clientInstance) {
    if (clientCreated) {
      devLog('Warning: Attempting to recreate client-side Supabase instance', {
        prefix: 'supabase-client',
        level: 'warn'
      })
    }
    clientInstance = createClientComponentClient()
    clientCreated = true
    devLog('Created new client-side Supabase instance', {
      prefix: 'supabase-client',
      level: 'debug'
    })
  }
  return clientInstance
}

// Admin Supabase client (for server-side operations)
export function getAdminSupabase() {
  if (!adminInstance) {
    if (adminCreated) {
      devLog('Warning: Attempting to recreate admin Supabase instance', {
        prefix: 'supabase-client',
        level: 'warn'
      })
    }
    adminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    adminCreated = true
    devLog('Created new admin Supabase instance', {
      prefix: 'supabase-client',
      level: 'debug'
    })
  }
  return adminInstance
}

// Storage-specific admin client
export function getStorageSupabase() {
  if (!storageInstance) {
    if (storageCreated) {
      devLog('Warning: Attempting to recreate storage Supabase instance', {
        prefix: 'supabase-client',
        level: 'warn'
      })
    }
    storageInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    storageCreated = true
    devLog('Created new storage Supabase instance', {
      prefix: 'supabase-client',
      level: 'debug'
    })
  }
  return storageInstance
}

// Cleanup function for testing
export function resetSupabaseClients() {
  clientInstance = null
  adminInstance = null
  storageInstance = null
  clientCreated = false
  adminCreated = false
  storageCreated = false
} 