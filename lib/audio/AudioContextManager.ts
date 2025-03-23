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

class AudioContextManager {
  private static instance: AudioContextManager
  private audioContext: AudioContext | null = null
  private state: AudioContextState = {
    isInitialized: false,
    error: null,
    activeConnections: new Map()
  }
  private elementUpdateCallbacks: Set<(element: HTMLAudioElement) => void> = new Set()
  private initializationInProgress: Map<string, Promise<void>> = new Map()

  private constructor() {}

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager()
    }
    return AudioContextManager.instance
  }

  async initialize(): Promise<void> {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      return
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.state.isInitialized = true
      this.state.error = null

      devLog('AudioContext initialized', {
        prefix: 'audio-context',
        level: 'info'
      }, {
        data: {
          state: this.audioContext.state,
          sampleRate: this.audioContext.sampleRate,
          baseLatency: this.audioContext.baseLatency
        }
      })
    } catch (error) {
      this.state.error = error as Error
      this.state.isInitialized = false
      devLog('Failed to initialize AudioContext', {
        prefix: 'audio-context',
        level: 'error'
      }, { error })
      throw error
    }
  }

  async createAnalyzer(audioElement: HTMLAudioElement): Promise<{
    analyzer: AnalyserNode
    dataArray: Uint8Array
  } | null> {
    // Check if initialization is already in progress for this audio element
    const existingInit = this.initializationInProgress.get(audioElement.src)
    if (existingInit) {
      devLog('Initialization already in progress', {
        prefix: 'audio-context',
        level: 'debug'
      }, {
        data: {
          src: audioElement.src,
          readyState: audioElement.readyState,
          crossOrigin: audioElement.crossOrigin
        }
      })
      await existingInit
      const existingConnection = this.state.activeConnections.get(audioElement.src)
      if (existingConnection) {
        devLog('Using existing audio connection', {
          prefix: 'audio-context',
          level: 'debug'
        }, {
          data: {
            src: audioElement.src,
            hasAnalyzer: !!existingConnection.analyzer,
            hasDataArray: !!existingConnection.dataArray
          }
        })
        return {
          analyzer: existingConnection.analyzer,
          dataArray: existingConnection.dataArray
        }
      }
    }

    // Create a new initialization promise
    const initPromise = (async () => {
      if (!this.audioContext) {
        devLog('No audio context, initializing', {
          prefix: 'audio-context',
          level: 'debug'
        })
        await this.initialize()
      }

      if (!this.audioContext) {
        this.state.error = new Error('Failed to initialize AudioContext')
        devLog('Failed to initialize AudioContext', {
          prefix: 'audio-context',
          level: 'error'
        })
        return
      }

      try {
        // Check for existing connection again after initialization
        const existingConnection = this.state.activeConnections.get(audioElement.src)
        if (existingConnection) {
          devLog('Found existing connection after initialization', {
            prefix: 'audio-context',
            level: 'debug'
          }, {
            data: {
              src: audioElement.src,
              hasAnalyzer: !!existingConnection.analyzer,
              hasDataArray: !!existingConnection.dataArray
            }
          })
          return
        }

        devLog('Creating new audio connection', {
          prefix: 'audio-context',
          level: 'debug'
        }, {
          data: {
            src: audioElement.src,
            readyState: audioElement.readyState,
            crossOrigin: audioElement.crossOrigin,
            contextState: this.audioContext.state
          }
        })

        // Create new connection
        const source = this.audioContext.createMediaElementSource(audioElement)
        const gainNode = this.audioContext.createGain()
        const analyzer = this.audioContext.createAnalyser()
        analyzer.fftSize = 256
        const dataArray = new Uint8Array(analyzer.frequencyBinCount)

        // Connect nodes
        source.connect(gainNode)
        gainNode.connect(analyzer)
        analyzer.connect(this.audioContext.destination)

        // Store connection
        this.state.activeConnections.set(audioElement.src, {
          analyzer,
          dataArray,
          source,
          gainNode
        })

        devLog('Audio analyzer created successfully', {
          prefix: 'audio-context',
          level: 'info'
        }, {
          data: {
            src: audioElement.src,
            hasAnalyzer: !!analyzer,
            hasDataArray: !!dataArray,
            contextState: this.audioContext.state,
            activeConnections: this.state.activeConnections.size
          }
        })

        // Notify callbacks only after successful initialization
        this.elementUpdateCallbacks.forEach(callback => callback(audioElement))
      } catch (error) {
        this.state.error = error as Error
        devLog('Failed to create audio analyzer', {
          prefix: 'audio-context',
          level: 'error'
        }, { 
          error,
          data: {
            src: audioElement.src,
            readyState: audioElement.readyState,
            crossOrigin: audioElement.crossOrigin,
            contextState: this.audioContext?.state
          }
        })
        throw error
      }
    })()

    // Store the initialization promise
    this.initializationInProgress.set(audioElement.src, initPromise)

    try {
      await initPromise
      const connection = this.state.activeConnections.get(audioElement.src)
      if (connection) {
        devLog('Audio analyzer initialization completed', {
          prefix: 'audio-context',
          level: 'info'
        }, {
          data: {
            src: audioElement.src,
            hasAnalyzer: !!connection.analyzer,
            hasDataArray: !!connection.dataArray,
            contextState: this.audioContext?.state
          }
        })
        return {
          analyzer: connection.analyzer,
          dataArray: connection.dataArray
        }
      }
      devLog('No connection found after initialization', {
        prefix: 'audio-context',
        level: 'error'
      }, {
        data: {
          src: audioElement.src,
          contextState: this.audioContext?.state
        }
      })
      return null
    } catch (error) {
      this.initializationInProgress.delete(audioElement.src)
      devLog('Initialization promise failed', {
        prefix: 'audio-context',
        level: 'error'
      }, { 
        error,
        data: {
          src: audioElement.src,
          contextState: this.audioContext?.state
        }
      })
      return null
    }
  }

  cleanup(): void {
    // Disconnect all active connections
    this.state.activeConnections.forEach((connection, src) => {
      try {
        connection.source.disconnect()
        connection.gainNode.disconnect()
        connection.analyzer.disconnect()
        this.state.activeConnections.delete(src)
        this.initializationInProgress.delete(src)
      } catch (error) {
        devLog('Failed to disconnect audio connection', {
          prefix: 'audio-context',
          level: 'error'
        }, { error, src })
      }
    })

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    // Reset state
    this.state = {
      isInitialized: false,
      error: null,
      activeConnections: new Map()
    }

    // Clear callbacks and initialization tracking
    this.elementUpdateCallbacks.clear()
    this.initializationInProgress.clear()

    devLog('AudioContext cleaned up', {
      prefix: 'audio-context',
      level: 'info'
    })
  }

  onAudioElementUpdate(callback: (element: HTMLAudioElement) => void): void {
    this.elementUpdateCallbacks.add(callback)
  }

  removeAudioElementUpdateCallback(callback: (element: HTMLAudioElement) => void): void {
    this.elementUpdateCallbacks.delete(callback)
  }

  getState(): AudioContextState {
    return { ...this.state }
  }
}

export { AudioContextManager } 