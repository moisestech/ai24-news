'use client'

import { useState } from 'react'
import { useAtom } from 'jotai'
import { imageGenerationAtom } from '@/lib/atoms'
import { devLog } from '@/lib/utils/log'
import { uploadImageToStorage } from '@/lib/actions/storage'

interface UploadOptions {
  bucket?: string
  path?: string
  contentType?: string
  newsId?: string
}

export function useImageUpload() {
  const [imageGeneration, setImageGeneration] = useAtom(imageGenerationAtom)

  const uploadImage = async (
    base64Data: string,
    headline: string,
    options: UploadOptions = {}
  ) => {
    try {
      // Update state to uploading
      setImageGeneration(prev => ({
        ...prev,
        uploading: true,
        status: 'uploading',
        currentNewsId: options.newsId || prev.currentNewsId
      }))

      devLog('Starting image upload', {
        prefix: 'image-upload',
        level: 'debug'
      }, {
        data: {
          headline,
          options
        }
      })

      // Upload using server action
      const publicUrl = await uploadImageToStorage(base64Data, headline, options)

      devLog('Image uploaded successfully', {
        prefix: 'image-upload',
        level: 'debug'
      }, {
        data: {
          publicUrl,
          newsId: options.newsId
        }
      })

      // Update state to success
      setImageGeneration(prev => ({
        ...prev,
        uploading: false,
        loading: false,
        imageUrl: publicUrl,
        status: 'success',
        error: null
      }))

      return { publicUrl }

    } catch (error) {
      devLog('Image upload failed', {
        prefix: 'image-upload',
        level: 'error'
      }, { 
        error,
        details: { newsId: options.newsId }
      })

      // Update state to error
      setImageGeneration(prev => ({
        ...prev,
        uploading: false,
        loading: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to upload image'
      }))

      throw error
    }
  }

  return {
    uploadImage,
    isUploading: imageGeneration.uploading,
    status: imageGeneration.status
  }
} 