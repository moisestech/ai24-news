import { atom } from 'jotai'
import { devLog } from '@/lib/utils/log'

interface AudioContextState {
  isInitialized: boolean
  error: Error | null
  activeConnections: Map<string, {
    analyzer: AnalyserNode
    dataArray: Uint8Array
    source: MediaElementAudioSourceNode
    gainNode: GainNode
  }>
}

// Base atoms for state
export const audioContextAtom = atom<AudioContext | null>(null)
export const isAudioContextInitializedAtom = atom<boolean>(false)
export const audioContextErrorAtom = atom<Error | null>(null)
export const activeConnectionsAtom = atom<Map<string, {
  analyzer: AnalyserNode
  dataArray: Uint8Array
  source: MediaElementAudioSourceNode
  gainNode: GainNode
}>>(new Map())

// Derived atoms for computed values
export const audioContextStateAtom = atom((get) => ({
  isInitialized: get(isAudioContextInitializedAtom),
  error: get(audioContextErrorAtom),
  activeConnections: get(activeConnectionsAtom)
}))

// Action atoms
export const initializeAudioContextAtom = atom(
  null,
  async (get, set) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      set(audioContextAtom, audioContext)
      set(isAudioContextInitializedAtom, true)
      
      devLog('AudioContext initialized', {
        prefix: 'audio-context',
        level: 'info'
      })
    } catch (error) {
      devLog('Failed to initialize AudioContext', {
        prefix: 'audio-context',
        level: 'error'
      }, { error })
      set(audioContextErrorAtom, error as Error)
    }
  }
)

export const cleanupAudioContextAtom = atom(
  null,
  async (get, set) => {
    const connections = get(activeConnectionsAtom)
    const audioContext = get(audioContextAtom)
    
    // Disconnect all active connections
    for (const [id, connection] of connections.entries()) {
      try {
        connection.source.disconnect()
        connection.gainNode.disconnect()
        connection.analyzer.disconnect()
        connections.delete(id)
        
        devLog('Disconnected audio analyzer', {
          prefix: 'audio-context',
          level: 'info'
        }, { id })
      } catch (error) {
        devLog('Failed to disconnect audio analyzer', {
          prefix: 'audio-context',
          level: 'error'
        }, { error, id })
      }
    }

    // Close audio context if it exists
    if (audioContext) {
      try {
        await audioContext.close()
      } catch (error) {
        devLog('Failed to close AudioContext', {
          prefix: 'audio-context',
          level: 'error'
        }, { error })
      }
    }

    // Reset all state
    set(audioContextAtom, null)
    set(activeConnectionsAtom, new Map())
    set(isAudioContextInitializedAtom, false)
    set(audioContextErrorAtom, null)
  }
) 