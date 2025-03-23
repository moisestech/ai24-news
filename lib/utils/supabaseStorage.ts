import { devLog } from './log'
import { SupabaseClient } from '@supabase/supabase-js'
import { getStorageSupabase } from '../supabase/client'

interface UploadOptions {
  bucket?: string
  folder?: string
  contentType?: string
  cacheControl?: string
}

const defaultOptions: UploadOptions = {
  bucket: 'news-images',
  folder: 'images',
  contentType: 'image/png',
  cacheControl: '3600'
}

// Get the admin client for storage operations
const supabaseAdmin = getStorageSupabase()

/**
 * Uploads a file to Supabase Storage with validation and error handling
 */
export async function uploadToSupabase(
  imageData: Blob,
  fileName: string,
  options: { bucket?: string; path?: string } = {}
): Promise<string> {
  try {
    const bucket = options.bucket || 'news-images'
    const path = options.path || 'generated'
    const fullPath = `${path}/${fileName}`

    devLog('Starting Supabase upload', {
      prefix: 'supabase-storage',
      level: 'debug'
    }, {
      data: {
        fileName,
        bucket,
        path: fullPath,
        size: imageData.size,
        type: imageData.type,
        usingServiceRole: true
      }
    })

    const file = new File([imageData], fileName, { type: 'image/png' })

    // Use the admin client for storage operations
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fullPath, file, {
        upsert: true,
        contentType: 'image/png'
      })

    if (error) {
      devLog('Upload failed', {
        prefix: 'supabase-storage',
        level: 'error'
      }, {
        error,
        data: {
          fileName,
          bucket,
          path: fullPath
        }
      })
      throw error
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fullPath)

    return urlData.publicUrl

  } catch (error) {
    devLog('Upload failed', {
      prefix: 'supabase-storage',
      level: 'error'
    }, {
      error,
      data: {
        fileName,
        size: imageData.size,
        type: imageData.type
      }
    })
    throw new Error('Failed to upload image')
  }
}

/**
 * Helper to sanitize file names for storage
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-') // Replace invalid chars with dash
    .replace(/-+/g, '-') // Remove multiple dashes
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes
}

/**
 * Wrapper for image uploads with specific settings
 */
export async function uploadNewsImage(
  supabase: SupabaseClient,
  imageData: Blob | File,
  headline: string
): Promise<string> {
  const timestamp = Date.now()
  const fileName = `ai24live_${sanitizeFileName(headline)}_${timestamp}.png`

  try {
    const publicUrl = await uploadToSupabase(imageData, fileName, {
      bucket: 'news-images',
      path: 'generated'
    })

    if (!publicUrl) {
      throw new Error('Failed to get public URL')
    }

    return publicUrl

  } catch (error) {
    devLog('News image upload failed', {
      prefix: 'news-image',
      level: 'error'
    }, {
      error,
      data: { fileName }
    })
    throw error
  }
} 