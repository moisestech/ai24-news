'use server'

import { createClient } from '@supabase/supabase-js'
import { devLog } from '../utils/log'

// Create admin client on the server side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function uploadToStorage(
  imageData: Blob,
  fileName: string,
  options: { bucket?: string; path?: string } = {}
): Promise<string> {
  try {
    const bucket = options.bucket || 'news-images'
    const path = options.path || 'generated'
    const fullPath = `${path}/${fileName}`

    devLog('Starting storage upload', {
      prefix: 'storage-action',
      level: 'debug'
    }, {
      data: {
        fileName,
        imageDetails: {
          size: imageData.size,
          type: imageData.type,
          isMockImage: imageData.size < 100
        },
        env: {
          NODE_ENV: process.env.NODE_ENV,
          MOCK_API: process.env.NEXT_PUBLIC_MOCK_API
        }
      }
    })

    // Convert Blob to Buffer if needed
    const buffer = imageData instanceof Blob 
      ? Buffer.from(await imageData.arrayBuffer())
      : imageData

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fullPath, buffer, {
        upsert: true,
        contentType: 'image/png'
      })

    if (error) {
      devLog('Supabase upload error', {
        prefix: 'storage-action',
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
      prefix: 'storage-action',
      level: 'error'
    }, {
      error,
      data: {
        fileName,
        dataType: imageData.constructor.name
      }
    })
    throw new Error('Failed to upload image')
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function uploadNewsImage(
  imageData: Blob,
  headline: string
): Promise<string> {
  const timestamp = Date.now()
  const fileName = `ai24live_${sanitizeFileName(headline)}_${timestamp}.png`

  try {
    return await uploadToStorage(imageData, fileName, {
      bucket: 'news-images',
      path: 'generated'
    })
  } catch (error) {
    devLog('News image upload failed', {
      prefix: 'storage-action',
      level: 'error'
    }, {
      error,
      data: { 
        fileName,
        dataType: imageData.constructor.name
      }
    })
    throw error
  }
} 