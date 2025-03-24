'use server'

import { devLog } from '../utils/log'
import { getAdminSupabase } from '../supabase/client'

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
        },
        options: {
          bucket,
          path,
          fullPath
        },
        timestamp: new Date().toISOString()
      }
    })

    // Convert Blob to Buffer if needed
    const buffer = imageData instanceof Blob 
      ? Buffer.from(await imageData.arrayBuffer())
      : imageData

    devLog('Converting image data to buffer', {
      prefix: 'storage-action',
      level: 'debug'
    }, {
      data: {
        fileName,
        bufferSize: buffer.length,
        originalType: imageData.constructor.name,
        timestamp: new Date().toISOString()
      }
    })

    const { data, error } = await getAdminSupabase().storage
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
          path: fullPath,
          bufferSize: buffer.length,
          timestamp: new Date().toISOString()
        }
      })
      throw error
    }

    devLog('File uploaded successfully', {
      prefix: 'storage-action',
      level: 'debug'
    }, {
      data: {
        fileName,
        bucket,
        path: fullPath,
        uploadData: data,
        timestamp: new Date().toISOString()
      }
    })

    const { data: urlData } = getAdminSupabase().storage
      .from(bucket)
      .getPublicUrl(fullPath)

    devLog('Generated public URL', {
      prefix: 'storage-action',
      level: 'debug'
    }, {
      data: {
        fileName,
        bucket,
        path: fullPath,
        publicUrl: urlData.publicUrl,
        timestamp: new Date().toISOString()
      }
    })

    return urlData.publicUrl

  } catch (error) {
    devLog('Upload failed', {
      prefix: 'storage-action',
      level: 'error'
    }, {
      error,
      data: {
        fileName,
        dataType: imageData.constructor.name,
        size: imageData instanceof Blob ? imageData.size : 'unknown',
        timestamp: new Date().toISOString()
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

export async function uploadImageToStorage(
  base64Data: string,
  headline: string,
  options: { bucket?: string; contentType?: string; newsId?: string } = {}
): Promise<string> {
  try {
    const {
      bucket = 'news-images',
      contentType = 'image/png',
      newsId
    } = options

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate filename
    const timestamp = Date.now()
    const fileName = `ai24live_${headline.slice(0, 50).replace(/[^a-z0-9]/gi, '_')}_${timestamp}.png`

    devLog('Uploading to Supabase storage', {
      prefix: 'storage-action',
      level: 'debug'
    }, {
      data: {
        fileName,
        bucket,
        newsId,
        bufferSize: buffer.length,
        contentType
      }
    })

    // Upload to Supabase storage using admin client
    const { data: uploadData, error: uploadError } = await getAdminSupabase().storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      })

    if (uploadError) {
      devLog('Upload error', {
        prefix: 'storage-action',
        level: 'error'
      }, { 
        error: uploadError,
        details: {
          bucket,
          fileName,
          contentType,
          bufferSize: buffer.length,
          newsId
        }
      })
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = getAdminSupabase().storage
      .from(bucket)
      .getPublicUrl(fileName)

    devLog('Image uploaded successfully', {
      prefix: 'storage-action',
      level: 'debug'
    }, {
      data: {
        publicUrl,
        uploadData,
        newsId,
        fileName
      }
    })

    return publicUrl

  } catch (error) {
    devLog('Image upload failed', {
      prefix: 'storage-action',
      level: 'error'
    }, { error })
    throw error
  }
} 