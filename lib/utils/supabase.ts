import { devLog } from './log'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export async function uploadFileToSupabase(
  file: File | Blob,
  fileName: string,
  storageBucket: string = 'news-images'
) {
  try {
    const supabase = createClientComponentClient()

    devLog('Starting file upload to Supabase', {
      prefix: 'supabase-storage',
      level: 'info'
    }, {
      data: {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        bucket: storageBucket
      }
    })

    const { data, error } = await supabase.storage
      .from(storageBucket)
      .upload(`images/${fileName}`, file, {
        contentType: 'image/png',
        cacheControl: '3600'
      })

    if (error) {
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(`images/${fileName}`)

    devLog('File upload successful', {
      prefix: 'supabase-storage',
      level: 'info'
    }, {
      data: {
        fileName,
        publicUrl
      }
    })

    return { publicUrl, error: null }

  } catch (error) {
    devLog('File upload failed', {
      prefix: 'supabase-storage',
      level: 'error'
    }, {
      error
    })
    return { publicUrl: null, error }
  }
} 