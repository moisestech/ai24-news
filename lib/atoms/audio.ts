import { atom } from 'jotai'
import { devLog } from '@/lib/utils/log'

interface AudioTrack {
  id: string
  url: string
  alignment: any
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}

interface AudioContextState {
  isInitialized: boolean
  error: Error | null
  activeTrack: AudioTrack | null
  audioContext: AudioContext | null
  gainNode: GainNode | null
  analyzer: AnalyserNode | null
  source: MediaElementAudioSourceNode | null
  audioElement: HTMLAudioElement | null
}

// Base atoms for state
export const audioContextStateAtom = atom<AudioContextState>({
  isInitialized: false,
  error: null,
  activeTrack: null,
  audioContext: null,
  gainNode: null,
  analyzer: null,
  source: null,
  audioElement: null
})

// Action atoms
export const initializeAudioContextAtom = atom(
  null,
  async (get, set) => {
    try {
      const state = get(audioContextStateAtom)
      
      if (state.isInitialized) {
        devLog('AudioContext already initialized', {
          prefix: 'audio-context',
          level: 'debug'
        })
        return
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const gainNode = audioContext.createGain()
      const analyzer = audioContext.createAnalyser()
      analyzer.fftSize = 2048

      gainNode.connect(analyzer)
      analyzer.connect(audioContext.destination)

      // Create a single audio element
      const audioElement = new Audio()
      audioElement.crossOrigin = 'anonymous'

      set(audioContextStateAtom, {
        ...state,
        isInitialized: true,
        audioContext,
        gainNode,
        analyzer,
        audioElement
      })
      
      devLog('AudioContext initialized', {
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
  async (get, set, track: AudioTrack) => {
    try {
      const state = get(audioContextStateAtom)
      
      // Stop current track if playing
      if (state.activeTrack?.isPlaying) {
        await set(stopTrackAtom)
      }

      // Initialize context if needed
      if (!state.isInitialized) {
        await set(initializeAudioContextAtom)
      }

      // Get the single audio element
      const audioElement = get(audioContextStateAtom).audioElement
      if (!audioElement) {
        throw new Error('No audio element found')
      }

      // Set up the audio element
      audioElement.src = track.url
      audioElement.volume = track.volume

      // Create source and connect
      const source = state.audioContext!.createMediaElementSource(audioElement)
      source.connect(state.gainNode!)
      state.gainNode!.connect(state.analyzer!)
      state.analyzer!.connect(state.audioContext!.destination)

      // Set up event listeners
      audioElement.addEventListener('loadedmetadata', () => {
        set(audioContextStateAtom, {
          ...state,
          activeTrack: {
            ...track,
            duration: audioElement.duration
          }
        })
      })

      audioElement.addEventListener('timeupdate', () => {
        set(audioContextStateAtom, {
          ...state,
          activeTrack: {
            ...state.activeTrack!,
            currentTime: audioElement.currentTime
          }
        })
      })

      // Start playback
      await audioElement.play()

      set(audioContextStateAtom, {
        ...state,
        activeTrack: {
          ...track,
          isPlaying: true,
          currentTime: 0
        },
        source
      })

      devLog('Track started playing', {
        prefix: 'audio-context',
        level: 'info'
      }, { trackId: track.id })
    } catch (error) {
      devLog('Failed to play track', {
        prefix: 'audio-context',
        level: 'error'
      }, { error, trackId: track.id })
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
    
    if (state.source) {
      state.source.disconnect()
    }

    if (state.activeTrack) {
      set(audioContextStateAtom, {
        ...state,
        activeTrack: null,
        source: null
      })
    }
  }
)

export const pauseTrackAtom = atom(
  null,
  async (get, set) => {
    const state = get(audioContextStateAtom)
    
    if (state.activeTrack?.isPlaying) {
      state.source?.disconnect()
      set(audioContextStateAtom, {
        ...state,
        activeTrack: {
          ...state.activeTrack,
          isPlaying: false
        }
      })
    }
  }
)

export const resumeTrackAtom = atom(
  null,
  async (get, set) => {
    const state = get(audioContextStateAtom)
    
    if (state.activeTrack && !state.activeTrack.isPlaying) {
      try {
        const audioElement = state.audioElement
        if (!audioElement) {
          throw new Error('No audio element found')
        }

        audioElement.currentTime = state.activeTrack.currentTime
        const source = state.audioContext!.createMediaElementSource(audioElement)
        source.connect(state.gainNode!)
        state.gainNode!.connect(state.analyzer!)
        state.analyzer!.connect(state.audioContext!.destination)

        await audioElement.play()

        set(audioContextStateAtom, {
          ...state,
          activeTrack: {
            ...state.activeTrack,
            isPlaying: true
          },
          source
        })
      } catch (error) {
        devLog('Failed to resume track', {
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

export const seekTrackAtom = atom(
  null,
  async (get, set, time: number) => {
    const state = get(audioContextStateAtom)
    
    if (state.activeTrack) {
      try {
        const audioElement = state.audioElement
        if (!audioElement) {
          throw new Error('No audio element found')
        }

        audioElement.currentTime = time
        const source = state.audioContext!.createMediaElementSource(audioElement)
        source.connect(state.gainNode!)
        state.gainNode!.connect(state.analyzer!)
        state.analyzer!.connect(state.audioContext!.destination)

        if (state.activeTrack.isPlaying) {
          await audioElement.play()
        }

        set(audioContextStateAtom, {
          ...state,
          activeTrack: {
            ...state.activeTrack,
            currentTime: time
          },
          source
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
    
    if (state.gainNode) {
      state.gainNode.gain.value = volume
      if (state.activeTrack) {
        set(audioContextStateAtom, {
          ...state,
          activeTrack: {
            ...state.activeTrack,
            volume
          }
        })
      }
    }
  }
)

export const cleanupAudioContextAtom = atom(
  null,
  async (get, set) => {
    const state = get(audioContextStateAtom)
    
    if (state.source) {
      state.source.disconnect()
    }

    if (state.audioContext) {
      await state.audioContext.close()
    }

    set(audioContextStateAtom, {
      isInitialized: false,
      error: null,
      activeTrack: null,
      audioContext: null,
      gainNode: null,
      analyzer: null,
      source: null,
      audioElement: null
    })
  }
) 