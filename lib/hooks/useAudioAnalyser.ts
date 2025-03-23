import { useState, useEffect, useRef } from 'react'
import { AudioContextManager } from '../audio/AudioContextManager'
import { devLog } from '../utils/log'

export function useAudioAnalyser(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const audioContextManager = useRef(AudioContextManager.getInstance())
  const isInitializedRef = useRef(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) {
      devLog('No audio element found', {
        prefix: 'audio-context',
        level: 'debug'
      })
      return
    }

    // Skip if already initialized for this audio element
    if (isInitializedRef.current) {
      devLog('Audio analyzer already initialized', {
        prefix: 'audio-context',
        level: 'debug'
      })
      return
    }

    const initializeAnalyzer = async () => {
      try {
        devLog('Initializing audio analyzer', {
          prefix: 'audio-context',
          level: 'debug'
        }, {
          data: {
            readyState: audioElement.readyState,
            crossOrigin: audioElement.crossOrigin,
            src: audioElement.src
          }
        })

        // Ensure crossOrigin is set
        if (!audioElement.crossOrigin) {
          audioElement.crossOrigin = 'anonymous'
        }

        const { analyzer: newAnalyzer } = await audioContextManager.current.initialize(audioElement)
        
        // Check if component is still mounted
        if (!isMountedRef.current) {
          audioContextManager.current.cleanup(audioElement)
          return
        }

        // Create data array for analyzer
        const dataArray = new Uint8Array(newAnalyzer.frequencyBinCount)
        dataArrayRef.current = dataArray

        setAnalyser(newAnalyzer)
        isInitializedRef.current = true

        devLog('Audio analyzer initialization completed', {
          prefix: 'audio-context',
          level: 'debug'
        }, {
          data: {
            hasAnalyzer: !!newAnalyzer,
            hasDataArray: !!dataArray,
            frequencyBinCount: newAnalyzer.frequencyBinCount,
            readyState: audioElement.readyState,
            src: audioElement.src
          }
        })
      } catch (error) {
        devLog('Failed to initialize audio analyzer', {
          prefix: 'audio-context',
          level: 'error'
        }, { error })
        throw error
      }
    }

    // Initialize analyzer when audio element is ready
    if (audioElement.readyState >= 2) {
      initializeAnalyzer()
    } else {
      const handleLoadedMetadata = () => {
        if (isMountedRef.current) {
          initializeAnalyzer()
        }
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    }

    // Cleanup function
    return () => {
      if (isInitializedRef.current) {
        devLog('Cleaning up audio analyzer', {
          prefix: 'audio-context',
          level: 'debug'
        })
        audioContextManager.current.cleanup(audioElement)
        setAnalyser(null)
        dataArrayRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [audioRef])

  return {
    analyser,
    dataArrayRef
  }
} 