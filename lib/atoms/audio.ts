import { atom } from 'jotai'
import { devLog } from '@/lib/utils/log'
import { AudioContextManager } from '@/lib/audio/AudioContextManager'
import type { AudioAlignment } from '@/types/audio'

export interface AudioTrack {
  id: string
  url: string
  alignment: AudioAlignment | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}

interface AudioContextState {
  isInitialized: boolean
  error: Error | null
  activeTrack: AudioTrack | null
  availableTracks: Map<string, AudioTrack>
}

// Base atoms for state
export const audioContextStateAtom = atom<AudioContextState>({
  isInitialized: false,
  error: null,
  activeTrack: null,
  availableTracks: new Map()
})

// Action atoms
export const registerTrackAtom = atom(
  null,
  async (get, set, track: AudioTrack) => {
    const state = get(audioContextStateAtom)
    
    devLog('Registering audio track', {
      prefix: 'audio-context',
      level: 'debug'
    }, {
      data: {
        trackId: track.id,
        hasAlignment: !!track.alignment,
        alignmentLength: track.alignment?.characters?.length
      }
    })

    set(audioContextStateAtom, {
      ...state,
      availableTracks: new Map(state.availableTracks).set(track.id, track)
    })
  }
)

export const unregisterTrackAtom = atom(
  null,
  async (get, set, trackId: string) => {
    const state = get(audioContextStateAtom)
    
    devLog('Unregistering audio track', {
      prefix: 'audio-context',
      level: 'debug'
    }, { trackId })

    const newTracks = new Map(state.availableTracks)
    newTracks.delete(trackId)
    
    set(audioContextStateAtom, {
      ...state,
      availableTracks: newTracks
    })
  }
)

export const initializeAudioContextAtom = atom(
  null,
  async (get, set) => {
    try {
      const state = get(audioContextStateAtom)
      const manager = AudioContextManager.getInstance()
      
      devLog('Initializing AudioContext', {
        prefix: 'audio-context',
        level: 'debug'
      }, {
        currentState: {
          isInitialized: state.isInitialized,
          hasActiveTrack: !!state.activeTrack
        }
      })

      if (state.isInitialized) {
        devLog('AudioContext already initialized', {
          prefix: 'audio-context',
          level: 'debug'
        })
        return
      }

      await manager.initialize()
      
      set(audioContextStateAtom, {
        ...state,
        isInitialized: true
      })
      
      devLog('AudioContext initialization complete', {
        prefix: 'audio-context',
        level: 'info'
      })
    } catch (error) {
      devLog('Failed to initialize AudioContext', {
        prefix: 'audio-context',
        level: 'error'
      }, { error })
      set(audioContextStateAtom, {
        ...get(audioContextStateAtom),
        error: error as Error
      })
    }
  }
)

export const playTrackAtom = atom(
  null,
  async (get, set, trackId: string) => {
    try {
      const state = get(audioContextStateAtom)
      const manager = AudioContextManager.getInstance()
      
      devLog('Starting playTrack', {
        prefix: 'audio-context',
        level: 'debug'
      }, { trackId })

      // Get track from available tracks
      const track = state.availableTracks.get(trackId)
      if (!track) {
        throw new Error(`Track ${trackId} not found`)
      }

      // Stop current track if playing
      if (state.activeTrack?.isPlaying) {
        await set(stopTrackAtom)
      }

      // Initialize context if needed
      if (!state.isInitialized) {
        await set(initializeAudioContextAtom)
      }

      // Create audio element and get analyzer
      const audioElement = new Audio(track.url)
      audioElement.crossOrigin = 'anonymous'
      
      const analyzer = await manager.createAnalyzer(audioElement)
      if (!analyzer) {
        throw new Error('Failed to create audio analyzer')
      }

      // Start playback
      await audioElement.play()

      set(audioContextStateAtom, {
        ...state,
        activeTrack: {
          ...track,
          isPlaying: true,
          currentTime: 0
        }
      })

      devLog('Track playback started', {
        prefix: 'audio-context',
        level: 'info'
      }, { 
        trackId,
        hasAnalyzer: !!analyzer,
        audioState: {
          currentTime: audioElement.currentTime,
          duration: audioElement.duration,
          readyState: audioElement.readyState
        }
      })

    } catch (error) {
      devLog('Failed to play track', {
        prefix: 'audio-context',
        level: 'error'
      }, { error })
      set(audioContextStateAtom, {
        ...get(audioContextStateAtom),
        error: error as Error
      })
    }
  }
)

export const stopTrackAtom = atom(
  null,
  async (get, set) => {
    const state = get(audioContextStateAtom)
    const manager = AudioContextManager.getInstance()
    
    if (state.activeTrack) {
      // Clean up the audio context
      manager.cleanup()
      
      set(audioContextStateAtom, {
        ...state,
        activeTrack: null
      })

      devLog('Track stopped and cleaned up', {
        prefix: 'audio-context',
        level: 'info'
      })
    }
  }
)

export const pauseTrackAtom = atom(
  null,
  async (get, set) => {
    const state = get(audioContextStateAtom)
    const manager = AudioContextManager.getInstance()
    
    if (state.activeTrack?.isPlaying) {
      // Get the current connection
      const connection = Array.from(manager.getState().activeConnections.values())
        .find(conn => conn.audioElement.src === state.activeTrack?.url)

      if (connection) {
        connection.audioElement.pause()
      }

      set(audioContextStateAtom, {
        ...state,
        activeTrack: {
          ...state.activeTrack,
          isPlaying: false
        }
      })

      devLog('Track paused', {
        prefix: 'audio-context',
        level: 'info'
      })
    }
  }
)

export const resumeTrackAtom = atom(
  null,
  async (get, set) => {
    const state = get(audioContextStateAtom)
    const manager = AudioContextManager.getInstance()

    devLog('Attempting to resume track', {
      prefix: 'audio-context',
      level: 'debug'
    }, { currentState: state })

    if (!state.activeTrack) {
      devLog('No active track to resume', {
        prefix: 'audio-context',
        level: 'error'
      })
      return
    }

    try {
      // Get the current connection
      const connection = Array.from(manager.getState().activeConnections.values())
        .find(conn => conn.audioElement.src === state.activeTrack?.url)

      if (!connection) {
        // If no connection exists, create a new one
        const audioElement = new Audio(state.activeTrack.url)
        audioElement.crossOrigin = 'anonymous'
        audioElement.currentTime = state.activeTrack.currentTime
        
        const analyzer = await manager.createAnalyzer(audioElement)
        if (!analyzer) {
          throw new Error('Failed to create audio analyzer')
        }

        await audioElement.play()
      } else {
        // Resume existing connection
        await connection.audioElement.play()
      }

      set(audioContextStateAtom, {
        ...state,
        activeTrack: {
          ...state.activeTrack,
          isPlaying: true
        }
      })

      devLog('Track resumed successfully', {
        prefix: 'audio-context',
        level: 'debug'
      }, {
        currentTime: state.activeTrack.currentTime,
        duration: state.activeTrack.duration
      })
    } catch (error) {
      devLog('Failed to resume track', {
        prefix: 'audio-context',
        level: 'error'
      }, { error })
      throw error
    }
  }
)

export const seekTrackAtom = atom(
  null,
  async (get, set, time: number) => {
    const state = get(audioContextStateAtom)
    const manager = AudioContextManager.getInstance()
    
    if (state.activeTrack) {
      try {
        // Get the current connection
        const connection = Array.from(manager.getState().activeConnections.values())
          .find(conn => conn.audioElement.src === state.activeTrack?.url)

        if (!connection) {
          // If no connection exists, create a new one
          const audioElement = new Audio(state.activeTrack.url)
          audioElement.crossOrigin = 'anonymous'
          audioElement.currentTime = time
          
          const analyzer = await manager.createAnalyzer(audioElement)
          if (!analyzer) {
            throw new Error('Failed to create audio analyzer')
          }

          if (state.activeTrack.isPlaying) {
            await audioElement.play()
          }
        } else {
          // Update existing connection
          connection.audioElement.currentTime = time
          if (state.activeTrack.isPlaying) {
            await connection.audioElement.play()
          }
        }

        set(audioContextStateAtom, {
          ...state,
          activeTrack: {
            ...state.activeTrack,
            currentTime: time
          }
        })

        devLog('Track seeked successfully', {
          prefix: 'audio-context',
          level: 'debug'
        }, {
          time,
          isPlaying: state.activeTrack.isPlaying
        })
      } catch (error) {
        devLog('Failed to seek track', {
          prefix: 'audio-context',
          level: 'error'
        }, { error })
        set(audioContextStateAtom, {
          ...state,
          error: error as Error
        })
      }
    }
  }
)

export const setVolumeAtom = atom(
  null,
  async (get, set, volume: number) => {
    const state = get(audioContextStateAtom)
    const manager = AudioContextManager.getInstance()
    
    if (state.activeTrack) {
      await manager.setVolume(volume)
      set(audioContextStateAtom, {
        ...state,
        activeTrack: {
          ...state.activeTrack,
          volume
        }
      })

      devLog('Volume updated', {
        prefix: 'audio-context',
        level: 'debug'
      }, { volume })
    }
  }
)

export const cleanupAudioContextAtom = atom(
  null,
  async (get, set) => {
    const manager = AudioContextManager.getInstance()
    manager.cleanup()
    
    set(audioContextStateAtom, {
      isInitialized: false,
      error: null,
      activeTrack: null,
      availableTracks: new Map()
    })

    devLog('Audio context cleaned up', {
      prefix: 'audio-context',
      level: 'info'
    })
  }
) 