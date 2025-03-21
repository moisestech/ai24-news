import { useState, useCallback } from 'react'
import { devLog } from '@/lib/utils/log'
import { useToast } from '@/hooks/use-toast'

interface UseNewsMediaProps {
  headline: string
  source: string
  url: string
}

interface ImageState {
  isGenerating: boolean
  isPending: boolean
  error: Error | null
  url: string | null
}

interface AudioState {
  isGenerating: boolean
  isPending: boolean
  error: Error | null
  url: string | null
  alignment: any | null
}

export function useNewsMedia({
  headline,
  source,
  url
}: UseNewsMediaProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle')
  
  const [imageState, setImageState] = useState<ImageState>({
    isGenerating: false,
    isPending: false,
    error: null,
    url: null,
  })
  
  const [audioState, setAudioState] = useState<AudioState>({
    isGenerating: false,
    isPending: false,
    error: null,
    url: null,
    alignment: null,
  })

  // Throttle to prevent excessive API calls
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0)
  const THROTTLE_TIME = 5000 // 5 seconds

  // Utility to check if we're throttled
  const isThrottled = () => {
    const now = Date.now()
    return (now - lastGenerationTime) < THROTTLE_TIME
  }

  const generateImage = useCallback(async () => {
    if (imageState.isGenerating || !headline) return
    
    try {
      setImageState(prev => ({ ...prev, isGenerating: true, error: null }))
      
      // Set to random art style
      const artStyles = ['VanGogh', 'Picasso', 'DaVinci', 'Monet', 'Rembrandt', 'Dali']
      const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)]
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          headline,
          style: randomStyle
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate image')
      }
      
      const data = await response.json()
      
      setImageState(prev => ({
        ...prev,
        isGenerating: false,
        url: data.imageUrl,
      }))
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      devLog('Image generation failed', {
        prefix: 'news-media',
        level: 'error'
      }, { error })
      
      setImageState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error : new Error(errorMessage)
      }))
      
      // Show toast for image generation failure
      toast({
        title: 'Image Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }, [headline, imageState.isGenerating, toast])
  
  const generateAudio = useCallback(async () => {
    if (audioState.isGenerating || !headline) return
    
    try {
      setAudioState(prev => ({ ...prev, isGenerating: true, error: null }))
      
      // Generate a random ID - in a real app, this would be a proper UUID or ID from your database
      const newsId = `news-${Date.now()}`
      
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          headline, 
          newsId 
        })
      })
      
      // Handle API response
      const data = await response.json()
      
      if (!response.ok) {
        // Handle specific error types
        if (data.errorType === 'authentication') {
          toast({
            title: 'API Authentication Failed',
            description: 'Your ElevenLabs API key is invalid or missing. Check your environment variables.',
            variant: 'destructive'
          })
          throw new Error('ElevenLabs API key is invalid or missing')
        } else if (data.errorType === 'rate_limit') {
          toast({
            title: 'Rate Limit Exceeded',
            description: 'You have reached the ElevenLabs API usage limit.',
            variant: 'destructive'
          })
          throw new Error('Rate limit exceeded')  
        } else if (data.errorType === 'configuration') {
          toast({
            title: 'Configuration Error',
            description: 'ElevenLabs API key is not configured in your environment variables.',
            variant: 'destructive'
          })
          throw new Error('API configuration error')
        } else {
          throw new Error(data.error || 'Failed to generate audio')
        }
      }
      
      // If audio is ready immediately
      if (data.status === 'ready' && data.audioUrl) {
        setAudioState(prev => ({
          ...prev,
          isGenerating: false,
          url: data.audioUrl,
          alignment: data.alignment
        }))
      } else {
        // Start polling for status
        let attempts = 0
        const maxAttempts = 10
        const pollInterval = setInterval(async () => {
          try {
            attempts++
            
            const statusResponse = await fetch(`/api/get-audio-status?newsId=${newsId}`)
            const statusData = await statusResponse.json()
            
            if (statusData.status === 'ready' && statusData.audioUrl) {
              clearInterval(pollInterval)
              setAudioState(prev => ({
                ...prev,
                isGenerating: false,
                url: statusData.audioUrl,
                alignment: statusData.alignment
              }))
            } else if (statusData.status === 'failed') {
              clearInterval(pollInterval)
              throw new Error(statusData.error || 'Audio generation failed')
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval)
              throw new Error('Audio generation timed out')
            }
          } catch (error) {
            clearInterval(pollInterval)
            throw error
          }
        }, 3000) // Poll every 3 seconds
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      devLog('Audio generation failed', {
        prefix: 'news-media',
        level: 'error'
      }, { error })
      
      setAudioState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error : new Error(errorMessage)
      }))
      
      // Only show toast if not already shown from specific error handling
      if (!['ElevenLabs API key is invalid or missing', 'Rate limit exceeded', 'API configuration error'].includes(errorMessage)) {
        toast({
          title: 'Audio Generation Failed',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    }
  }, [headline, audioState.isGenerating, toast])
  
  const generateMedia = useCallback(async () => {
    if (isThrottled()) {
      devLog('Generation throttled', {
        prefix: 'news-media',
        level: 'info'
      })
      return
    }
    
    setLastGenerationTime(Date.now())
    setStatus('generating')
    
    try {
      // Generate both media types in parallel
      const results = await Promise.allSettled([
        generateImage(),
        generateAudio()
      ])
      
      // Check results
      const hasErrors = results.some(result => result.status === 'rejected')
      
      setStatus(hasErrors ? 'error' : 'complete')
    } catch (error) {
      setStatus('error')
      
      devLog('Media generation failed', {
        prefix: 'news-media',
        level: 'error'
      }, { error })
    }
  }, [generateImage, generateAudio])
  
  const retryGeneration = useCallback(async (type: 'image' | 'audio') => {
    if (type === 'image') {
      await generateImage()
    } else {
      await generateAudio()
    }
  }, [generateImage, generateAudio])
  
  return {
    state: {
      status,
      image: imageState,
      audio: audioState
    },
    generateMedia,
    retryGeneration
  }
} 