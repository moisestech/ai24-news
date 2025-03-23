import { useState, useEffect, useRef, useCallback } from 'react'
import { devLog } from '@/lib/utils/log'
import { AudioContextManager } from '@/lib/audio/AudioContextManager'
import { useAtom } from 'jotai'
import { 
  isAudioContextInitializedAtom, 
  audioContextErrorAtom,
  activeConnectionsAtom
} from '@/lib/atoms/audio'

/**
 * Hook to provide audio frequency analysis for visualizations
 * @param audioRef Reference to the HTML audio element
 * @returns Object containing the analyser node, data array reference, and initialization status
 */
export function useAudioAnalyser(
  audioRef: React.RefObject<HTMLAudioElement | null>
) {
  // State hooks - called unconditionally at the top level
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [isLocalInitialized, setIsLocalInitialized] = useState(false)
  const [isContextInitialized, setIsContextInitialized] = useAtom(isAudioContextInitializedAtom)
  const [error, setError] = useAtom(audioContextErrorAtom)
  const [connections, setConnections] = useAtom(activeConnectionsAtom)

  // Refs - called unconditionally at the top level
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const initializationAttempted = useRef(false)
  const audioContextManager = useRef(AudioContextManager.getInstance())
  const isMounted = useRef(true)
  const eventListenersAdded = useRef(false)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Memoized callback for audio element updates
  const handleAudioElementUpdate = useCallback((newElement: HTMLAudioElement) => {
    if (!isMounted.current) return
    
    devLog('Audio element updated', {
      prefix: 'audio-analyzer',
      level: 'info'
    }, {
      data: {
        src: newElement.src,
        readyState: newElement.readyState,
        crossOrigin: newElement.crossOrigin
      }
    })
    
    audioElementRef.current = newElement
    if (!initializationAttempted.current) {
      initializeAudio(newElement)
    }
  }, [])

  // Memoized initialization function
  const initializeAudio = useCallback(async (audio: HTMLAudioElement) => {
    if (!isMounted.current || initializationAttempted.current) {
      devLog('Initialization skipped', {
        prefix: 'audio-analyzer',
        level: 'debug'
      }, {
        data: {
          isMounted: isMounted.current,
          initializationAttempted: initializationAttempted.current,
          readyState: audio.readyState,
          crossOrigin: audio.crossOrigin,
          src: audio.src,
          hasAudioContext: !!audioContextManager.current.getState().isInitialized
        }
      })
      return
    }

    const maxRetries = 3
    let retryCount = 0

    const tryInitialize = async (): Promise<void> => {
      try {
        // Ensure audio element is ready
        if (audio.readyState < 2) {
          devLog('Audio not ready, waiting for metadata', {
            prefix: 'audio-analyzer',
            level: 'debug'
          }, {
            data: {
              readyState: audio.readyState,
              crossOrigin: audio.crossOrigin,
              src: audio.src,
              hasAudioContext: !!audioContextManager.current.getState().isInitialized,
              retryCount
            }
          })

          await new Promise((resolve) => {
            const handleLoaded = () => {
              audio.removeEventListener('loadedmetadata', handleLoaded)
              resolve(true)
            }
            audio.addEventListener('loadedmetadata', handleLoaded)
          })
        }

        initializationAttempted.current = true

        // Ensure crossOrigin is set
        if (!audio.crossOrigin) {
          audio.crossOrigin = 'anonymous'
          devLog('Set crossOrigin to anonymous', {
            prefix: 'audio-analyzer',
            level: 'debug'
          }, {
            data: {
              src: audio.src,
              readyState: audio.readyState,
              retryCount
            }
          })
        }

        // Initialize audio context if needed
        const contextState = audioContextManager.current.getState()
        if (!contextState.isInitialized) {
          devLog('Initializing audio context', {
            prefix: 'audio-analyzer',
            level: 'debug'
          }, {
            data: {
              hasError: !!contextState.error,
              activeConnections: contextState.activeConnections.size,
              retryCount
            }
          })
          await audioContextManager.current.initialize()
        }

        devLog('Creating audio analyzer', {
          prefix: 'audio-analyzer',
          level: 'debug'
        }, {
          data: {
            src: audio.src,
            readyState: audio.readyState,
            crossOrigin: audio.crossOrigin,
            hasAudioContext: !!audioContextManager.current.getState().isInitialized,
            retryCount
          }
        })

        const result = await audioContextManager.current.createAnalyzer(audio)
        
        if (!result) {
          throw new Error('Failed to create audio analyzer')
        }
        
        if (!isMounted.current) {
          // Clean up if component unmounted during async operation
          audioContextManager.current.cleanup()
          return
        }
        
        setAnalyser(result.analyzer)
        dataArrayRef.current = result.dataArray
        setIsLocalInitialized(true)

        const managerState = audioContextManager.current.getState()
        setIsContextInitialized(managerState.isInitialized)
        setError(managerState.error)
        setConnections(managerState.activeConnections)

        devLog('Audio analyzer initialized', {
          prefix: 'audio-analyzer',
          level: 'info'
        }, {
          data: {
            isLocalInitialized: true,
            isContextInitialized: managerState.isInitialized,
            hasAnalyser: !!result.analyzer,
            hasDataArray: !!result.dataArray,
            crossOrigin: audio.crossOrigin,
            readyState: audio.readyState,
            src: audio.src,
            retryCount,
            analyserState: {
              fftSize: result.analyzer.fftSize,
              frequencyBinCount: result.analyzer.frequencyBinCount
            }
          }
        })
      } catch (error) {
        devLog('Failed to initialize audio analyzer', {
          prefix: 'audio-analyzer',
          level: 'error'
        }, { 
          error,
          data: {
            src: audio.src,
            readyState: audio.readyState,
            crossOrigin: audio.crossOrigin,
            hasAudioContext: !!audioContextManager.current.getState().isInitialized,
            retryCount
          }
        })

        if (retryCount < maxRetries) {
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
          return tryInitialize()
        }

        initializationAttempted.current = false
        setError(error as Error)
        throw error
      }
    }

    await tryInitialize()
  }, [setIsContextInitialized, setError, setConnections])

  // Effect for setting up audio element listeners and cleanup
  useEffect(() => {
    isMounted.current = true
    
    if (!audioRef.current) {
      devLog('No audio element found', {
        prefix: 'audio-analyzer',
        level: 'debug'
      })
      return
    }
    
    const audio = audioRef.current
    audioElementRef.current = audio
    
    devLog('Setting up audio analyzer', {
      prefix: 'audio-analyzer',
      level: 'debug'
    }, {
      data: {
        readyState: audio.readyState,
        crossOrigin: audio.crossOrigin,
        src: audio.src,
        hasAnalyser: !!analyser,
        hasDataArray: !!dataArrayRef?.current,
        isLocalInitialized,
        isContextInitialized,
        initializationAttempted: initializationAttempted.current,
        eventListenersAdded: eventListenersAdded.current
      }
    })

    // Define event handlers
    const handlePlay = () => {
      if (audioContextManager.current.getState().isInitialized) {
        audioContextManager.current.initialize()
      }
    }

    const handleClick = () => {
      if (audioContextManager.current.getState().isInitialized) {
        audioContextManager.current.initialize()
      }
    }

    const handleLoadedMetadata = () => {
      if (!initializationAttempted.current) {
        initializeAudio(audio)
      }
    }

    // Set up event listeners if not already added
    if (!eventListenersAdded.current) {
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('click', handleClick)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      eventListenersAdded.current = true

      // Register callback for audio element updates
      audioContextManager.current.onAudioElementUpdate(handleAudioElementUpdate)
    }

    // Initialize audio if not already attempted
    if (!initializationAttempted.current) {
      initializeAudio(audio)
    }

    return () => {
      isMounted.current = false
      if (eventListenersAdded.current) {
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('click', handleClick)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audioContextManager.current.removeAudioElementUpdateCallback(handleAudioElementUpdate)
      }
      audioContextManager.current.cleanup()
    }
  }, [audioRef, initializeAudio, handleAudioElementUpdate])

  return {
    analyser,
    dataArrayRef,
    error,
    isInitialized: isLocalInitialized && isContextInitialized
  }
} 