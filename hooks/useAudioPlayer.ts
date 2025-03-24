import React, { useCallback } from 'react'
import { devLog } from '@/lib/utils/log'

interface AudioTrack {
  id: string
  url: string
  alignment: {
    characters: string[]
    character_start_times_seconds: number[]
    character_end_times_seconds: number[]
  } | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}

const useAudioPlayer = () => {
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const currentTrackRef = React.useRef<AudioTrack | null>(null)
  const currentSourceRef = React.useRef<AudioBufferSourceNode | null>(null)
  const currentGainNodeRef = React.useRef<GainNode | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTrack, setCurrentTrack] = React.useState<AudioTrack | null>(null)

  const pauseTrack = useCallback(async () => {
    if (!currentSourceRef.current || !currentTrackRef.current) {
      return
    }

    try {
      // Stop the current source
      currentSourceRef.current.stop()
      currentSourceRef.current.disconnect()
      currentSourceRef.current = null

      // Disconnect gain node
      if (currentGainNodeRef.current) {
        currentGainNodeRef.current.disconnect()
        currentGainNodeRef.current = null
      }

      // Update state
      setIsPlaying(false)
      setCurrentTrack(null)
      currentTrackRef.current = null

      devLog('Audio playback paused', {
        prefix: 'audio-player',
        level: 'debug'
      })
    } catch (error) {
      devLog('Failed to pause track', {
        prefix: 'audio-player',
        level: 'error'
      }, { error })
      throw error
    }
  }, [])

  const playTrack = useCallback(async (track: AudioTrack) => {
    if (!audioContextRef.current) {
      devLog('Audio context not initialized', {
        prefix: 'audio-player',
        level: 'error'
      })
      return
    }

    try {
      // Stop any currently playing audio
      if (currentTrackRef.current) {
        await pauseTrack()
      }

      // Create and configure audio source
      const response = await fetch(track.url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer

      // Create and configure gain node
      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.value = track.volume

      // Connect nodes
      source.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      // Store references
      currentSourceRef.current = source
      currentGainNodeRef.current = gainNode
      currentTrackRef.current = track

      // Start playback
      source.start(0, track.currentTime)
      setIsPlaying(true)
      setCurrentTrack(track)

      // Handle playback completion
      source.onended = () => {
        devLog('Audio playback completed', {
          prefix: 'audio-player',
          level: 'debug'
        })
        setIsPlaying(false)
        setCurrentTrack(null)
        currentSourceRef.current = null
        currentGainNodeRef.current = null
        currentTrackRef.current = null
      }

    } catch (error) {
      devLog('Failed to play track', {
        prefix: 'audio-player',
        level: 'error'
      }, { error, track })
      setIsPlaying(false)
      setCurrentTrack(null)
      currentSourceRef.current = null
      currentGainNodeRef.current = null
      currentTrackRef.current = null
      throw error
    }
  }, [pauseTrack])

  return {
    isPlaying,
    currentTrack,
    playTrack,
    pauseTrack
  }
}

export default useAudioPlayer 