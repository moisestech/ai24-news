'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { devLog } from '@/lib/utils/log'
import { useToast } from '@/hooks/use-toast'
import { ArtStyle } from '@/types/art'
import { audioService } from '@/lib/services/audio'
import { useArtStyle } from '@/hooks/useArtStyle'
import type { AudioState, ImageState } from '@/types/news'
import type { ArtStyleKey } from '@/types/art'

interface UseNewsMediaProps {
  headline: string
  source_name: string
  url: string
  imageUrl?: string
  audioUrl?: string
  audioAlignment?: any
  artStyle?: ArtStyleKey
  currentNews?: { id: string }
  onImageGenerated?: (url: string) => Promise<void>
  autoGenerate?: boolean
}

interface NewsMediaState {
  image: ImageState
  audio: AudioState
}

export function useNewsMedia({
  headline,
  source_name,
  url,
  imageUrl,
  audioUrl,
  audioAlignment,
  artStyle,
  currentNews,
  onImageGenerated,
  autoGenerate = false
}: UseNewsMediaProps) {
  const { toast } = useToast()
  const { getRandomStyle } = useArtStyle()
  const hasGeneratedAudio = useRef(false)
  const isGeneratingRef = useRef(false)
  const generationAttempts = useRef(0)
  const [status, setStatus] = useState<'idle' | 'generating' | 'complete' | 'error'>('idle')
  
  // Log initial props
  useEffect(() => {
    devLog('useNewsMedia: Initial props', {
      prefix: 'news-media',
      level: 'debug'
    }, {
      data: {
        headline,
        source_name,
        url,
        hasImage: !!imageUrl,
        hasAudio: !!audioUrl,
        hasAudioAlignment: !!audioAlignment,
        audioAlignmentType: audioAlignment ? typeof audioAlignment : 'undefined',
        audioAlignmentKeys: audioAlignment ? Object.keys(audioAlignment) : [],
        audioAlignmentStructure: audioAlignment ? {
          charactersLength: audioAlignment.characters?.length,
          startTimesLength: audioAlignment.character_start_times_seconds?.length,
          endTimesLength: audioAlignment.character_end_times_seconds?.length,
          sampleCharacters: audioAlignment.characters?.slice(0, 5),
          sampleStartTimes: audioAlignment.character_start_times_seconds?.slice(0, 5),
          sampleEndTimes: audioAlignment.character_end_times_seconds?.slice(0, 5)
        } : null,
        currentNewsId: currentNews?.id,
        artStyle
      }
    })
  }, [headline, source_name, url, imageUrl, audioUrl, audioAlignment, currentNews?.id, artStyle])

  const [state, setState] = useState<NewsMediaState>({
    image: {
      url: imageUrl,
      isGenerating: false,
      isPending: false,
      error: null
    },
    audio: {
      url: audioUrl,
      alignment: audioAlignment,
      isGenerating: false,
      isPending: false,
      error: null
    }
  })

  // Log state changes
  useEffect(() => {
    devLog('useNewsMedia: State updated', {
      prefix: 'news-media',
      level: 'debug'
    }, {
      data: {
        status,
        image: {
          url: state.image.url,
          isGenerating: state.image.isGenerating,
          isPending: state.image.isPending,
          hasError: !!state.image.error
        },
        audio: {
          url: state.audio.url,
          hasAlignment: !!state.audio.alignment,
          alignmentType: state.audio.alignment ? typeof state.audio.alignment : 'undefined',
          alignmentKeys: state.audio.alignment ? Object.keys(state.audio.alignment) : [],
          alignmentStructure: state.audio.alignment ? {
            charactersLength: state.audio.alignment.characters?.length,
            startTimesLength: state.audio.alignment.character_start_times_seconds?.length,
            endTimesLength: state.audio.alignment.character_end_times_seconds?.length,
            sampleCharacters: state.audio.alignment.characters?.slice(0, 5),
            sampleStartTimes: state.audio.alignment.character_start_times_seconds?.slice(0, 5),
            sampleEndTimes: state.audio.alignment.character_end_times_seconds?.slice(0, 5)
          } : null,
          isGenerating: state.audio.isGenerating,
          isPending: state.audio.isPending,
          hasError: !!state.audio.error
        },
        hasGeneratedAudio: hasGeneratedAudio.current,
        isGeneratingRef: isGeneratingRef.current,
        generationAttempts: generationAttempts.current
      }
    })
  }, [state, status])

  // Throttle to prevent excessive API calls
  const [lastGenerationTime, setLastGenerationTime] = useState<number>(0)
  const THROTTLE_TIME = 5000 // 5 seconds
  const MAX_ATTEMPTS = 3 // Maximum number of generation attempts

  // Utility to check if we're throttled
  const isThrottled = () => {
    const now = Date.now()
    return (now - lastGenerationTime) < THROTTLE_TIME
  }

  const generateMedia = useCallback(async () => {
    if (isThrottled() || isGeneratingRef.current) {
      devLog('Generation throttled or already in progress', {
        prefix: 'news-media',
        level: 'info'
      }, {
        data: {
          isThrottled: isThrottled(),
          isGenerating: isGeneratingRef.current,
          attempts: generationAttempts.current
        }
      })
      return
    }

    setLastGenerationTime(Date.now())
    setStatus('generating')

    try {
      // Only generate media that doesn't exist
      const promises: Promise<void>[] = []
      
      // Check if we need to generate image
      if (!state.image.url && !state.image.error) {
        devLog('Image needed', {
          prefix: 'news-media',
          level: 'debug'
        }, {
          data: {
            hasImage: !!state.image.url,
            hasError: !!state.image.error
          }
        })
        promises.push(generateImage())
      }
      
      // Check if we need to generate audio
      if (!state.audio.url && !state.audio.error && generationAttempts.current < MAX_ATTEMPTS) {
        devLog('Audio needed', {
          prefix: 'news-media',
          level: 'debug'
        }, {
          data: {
            hasAudio: !!state.audio.url,
            hasError: !!state.audio.error,
            attempts: generationAttempts.current
          }
        })
        promises.push(generateAudio())
      }
      
      if (promises.length === 0) {
        devLog('No media generation needed', {
          prefix: 'news-media',
          level: 'info'
        }, {
          data: {
            hasImage: !!state.image.url,
            hasAudio: !!state.audio.url,
            imageError: !!state.image.error,
            audioError: !!state.audio.error,
            attempts: generationAttempts.current
          }
        })
        setStatus('complete')
        return
      }
      
      // Generate missing media in parallel
      const results = await Promise.allSettled(promises)
      
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
  }, [state, isThrottled])

  const generateImage = useCallback(async () => {
    if (state.image.isGenerating || !headline || state.image.url) return
    
    try {
      setState(prev => ({
        ...prev,
        image: {
          ...prev.image,
          isGenerating: true,
          error: null
        }
      }))
      
      // Use existing art style or get random one using the proper function
      const artStyle = state.image.artStyle || getRandomStyle()
      const displayStyle = ArtStyle[artStyle]
      
      devLog('Generating image', {
        prefix: 'news-media',
        level: 'debug'
      }, {
        data: {
          headline,
          artStyle,
          displayStyle,
          existingImage: state.image.url
        }
      })
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          headline,
          style: displayStyle,
          newsId: currentNews?.id // Pass the newsId if available
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Failed to generate image')
      }
      
      const data = await response.json()
      
      // Update image state with the new URL and style
      setState(prev => ({
        ...prev,
        image: {
          ...prev.image,
          isGenerating: false,
          url: data.imageUrl,
          artStyle
        }
      }))

      // Call onImageGenerated callback if provided
      if (data.imageUrl && onImageGenerated) {
        await onImageGenerated(data.imageUrl)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      devLog('Image generation failed', {
        prefix: 'news-media',
        level: 'error'
      }, { error })
      
      setState(prev => ({
        ...prev,
        image: {
          ...prev.image,
          isGenerating: false,
          error: error instanceof Error ? error : new Error(errorMessage)
        }
      }))
      
      // Show toast for image generation failure
      toast({
        title: 'Image Generation Failed',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }, [headline, state.image.isGenerating, state.image.url, state.image.artStyle, toast, currentNews?.id, onImageGenerated, getRandomStyle])
  
  const generateAudio = useCallback(async () => {
    // Add detailed logging for the initial check
    devLog('Checking audio generation conditions', {
      prefix: 'news-media',
      level: 'debug'
    }, {
      data: {
        isGenerating: state.audio.isGenerating,
        hasAudio: !!state.audio.url,
        isGeneratingRef: isGeneratingRef.current,
        attempts: generationAttempts.current,
        audioUrl: state.audio.url,
        audioAlignment: state.audio.alignment,
        currentNewsId: currentNews?.id
      }
    })

    if (state.audio.isGenerating || !headline || state.audio.url || isGeneratingRef.current || generationAttempts.current >= MAX_ATTEMPTS) {
      devLog('Audio generation skipped', {
        prefix: 'news-media',
        level: 'debug'
      }, {
        data: {
          reason: state.audio.isGenerating ? 'already generating' :
                 !headline ? 'no headline' :
                 state.audio.url ? 'audio already exists' :
                 isGeneratingRef.current ? 'generation in progress' :
                 'max attempts reached',
          isGenerating: state.audio.isGenerating,
          hasAudio: !!state.audio.url,
          isGeneratingRef: isGeneratingRef.current,
          attempts: generationAttempts.current,
          audioUrl: state.audio.url
        }
      })
      return
    }

    // Ensure we have a valid newsId
    if (!currentNews?.id) {
      devLog('Audio generation skipped - no valid newsId', {
        prefix: 'news-media',
        level: 'error'
      }, {
        data: {
          currentNews,
          headline
        }
      })
      return
    }
    
    try {
      isGeneratingRef.current = true
      hasGeneratedAudio.current = true
      generationAttempts.current++
      
      setState(prev => ({
        ...prev,
        audio: {
          ...prev.audio,
          isGenerating: true,
          error: null
        }
      }))
      
      // Use the current news ID
      const newsId = currentNews.id
      
      devLog('Generating audio', {
        prefix: 'news-media',
        level: 'debug'
      }, {
        data: {
          headline,
          newsId,
          existingAudio: state.audio.url,
          isGenerating: isGeneratingRef.current,
          attempt: generationAttempts.current
        }
      })
      
      const result = await audioService.generateAudio({
        headline,
        newsId,
        onStatusUpdate: (status) => {
          if (status.status === 'ready' && status.audioUrl) {
            setState(prev => ({
              ...prev,
              audio: {
                ...prev.audio,
                isGenerating: false,
                url: status.audioUrl || undefined,
                alignment: status.alignment || null
              }
            }))
            isGeneratingRef.current = false
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Failed to generate audio')
          }
        }
      })

      if (result.status === 'ready' && result.audioUrl) {
        setState(prev => ({
          ...prev,
          audio: {
            ...prev.audio,
            isGenerating: false,
            url: result.audioUrl || undefined,
            alignment: result.alignment || null
          }
        }))
        isGeneratingRef.current = false
      } else {
        throw new Error(result.error || 'Failed to generate audio')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio'
      
      devLog('Audio generation failed', {
        prefix: 'news-media',
        level: 'error'
      }, { error })
      
      setState(prev => ({
        ...prev,
        audio: {
          ...prev.audio,
          isGenerating: false,
          error: error instanceof Error ? error : new Error(errorMessage)
        }
      }))
      
      isGeneratingRef.current = false
      
      // Only show toast if not already shown from specific error handling
      if (!['ElevenLabs API key is invalid or missing', 'Rate limit exceeded', 'API configuration error'].includes(errorMessage)) {
        toast({
          title: 'Audio Generation Failed',
          description: errorMessage,
          variant: 'destructive'
        })
      }
    }
  }, [headline, state.audio.isGenerating, state.audio.url, toast, currentNews, getRandomStyle])

  // Update audio state when props change
  useEffect(() => {
    if (audioUrl !== state.audio.url || audioAlignment !== state.audio.alignment) {
      devLog('Audio props changed, updating state', {
        prefix: 'news-media',
        level: 'debug'
      }, {
        data: {
          oldUrl: state.audio.url,
          newUrl: audioUrl,
          hasAlignment: !!audioAlignment,
          isGenerating: state.audio.isGenerating
        }
      })

      setState(prev => ({
        ...prev,
        audio: {
          ...prev.audio,
          url: audioUrl,
          alignment: audioAlignment,
          isGenerating: false,
          isPending: false,
          error: null
        }
      }))

      // Reset generation refs if we have new audio
      if (audioUrl) {
        hasGeneratedAudio.current = true
        isGeneratingRef.current = false
        generationAttempts.current = 0
      }
    }
  }, [audioUrl, audioAlignment])

  // Memoize retryGeneration to prevent unnecessary re-renders
  const retryGeneration = useCallback(async (type: 'image' | 'audio') => {
    if (isThrottled() || isGeneratingRef.current) return

    setStatus('generating')
    try {
      if (type === 'image') {
        setState(prev => ({
          ...prev,
          image: {
            ...prev.image,
            isGenerating: true,
            isPending: true,
            error: null
          }
        }))
        generateImage()
      } else {
        setState(prev => ({
          ...prev,
          audio: {
            ...prev.audio,
            isGenerating: true,
            isPending: true,
            error: null
          }
        }))
        hasGeneratedAudio.current = false // Reset the ref when retrying
        isGeneratingRef.current = false // Reset the generating ref
        generationAttempts.current = 0 // Reset the attempts counter
        generateAudio()
      }
    } catch (error) {
      devLog(`${type} generation failed`, {
        prefix: 'news-media',
        level: 'error'
      }, { error })
      setState(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          error: error as Error,
          isGenerating: false,
          isPending: false
        }
      }))
    }
  }, [generateImage, generateAudio, state, isThrottled])

  return {
    state,
    generateMedia,
    retryGeneration
  }
} 