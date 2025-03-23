import { devLog } from '@/lib/utils/log'

interface AudioContextState {
  context: AudioContext | null
  gainNode: GainNode | null
  activeConnections: Map<HTMLAudioElement, {
    source: MediaElementAudioSourceNode
    gainNode: GainNode
    analyzer: AnalyserNode
  }>
  isInitialized: boolean
}

export class AudioContextManager {
  private static instance: AudioContextManager
  private state: AudioContextState
  private initializationInProgress: Set<HTMLAudioElement>
  private cleanupTimeout: NodeJS.Timeout | null

  private constructor() {
    this.state = {
      context: null,
      gainNode: null,
      activeConnections: new Map(),
      isInitialized: false
    }
    this.initializationInProgress = new Set()
    this.cleanupTimeout = null
  }

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager()
    }
    return AudioContextManager.instance
  }

  async initialize(audioElement: HTMLAudioElement): Promise<{
    context: AudioContext
    gainNode: GainNode
    analyzer: AnalyserNode
  }> {
    // Check if initialization is already in progress for this audio element
    if (this.initializationInProgress.has(audioElement)) {
      devLog('Initialization already in progress', {
        prefix: 'audio-context',
        level: 'debug'
      })
      return this.getExistingConnection(audioElement)
    }

    try {
      this.initializationInProgress.add(audioElement)

      // Create new AudioContext if needed
      if (!this.state.context) {
        this.state.context = new (window.AudioContext || (window as any).webkitAudioContext)()
        devLog('AudioContext initialized', {
          prefix: 'audio-context',
          level: 'debug'
        })
      }

      // Create gain node
      const gainNode = this.state.context.createGain()
      gainNode.gain.value = 1.0

      // Create analyzer
      const analyzer = this.state.context.createAnalyser()
      analyzer.fftSize = 2048

      // Create audio source
      const source = this.state.context.createMediaElementSource(audioElement)

      // Connect nodes
      source.connect(gainNode)
      gainNode.connect(analyzer)
      analyzer.connect(this.state.context.destination)

      // Store connection
      this.state.activeConnections.set(audioElement, {
        source,
        gainNode,
        analyzer
      })

      devLog('Audio analyzer created successfully', {
        prefix: 'audio-context',
        level: 'debug'
      })

      return {
        context: this.state.context,
        gainNode,
        analyzer
      }
    } catch (error) {
      devLog('Failed to initialize audio context', {
        prefix: 'audio-context',
        level: 'error'
      }, { error })
      throw error
    } finally {
      this.initializationInProgress.delete(audioElement)
    }
  }

  private getExistingConnection(audioElement: HTMLAudioElement) {
    const connection = this.state.activeConnections.get(audioElement)
    if (!connection) {
      throw new Error('No existing connection found')
    }
    return {
      context: this.state.context!,
      gainNode: connection.gainNode,
      analyzer: connection.analyzer
    }
  }

  cleanup(audioElement?: HTMLAudioElement): void {
    // If no specific audio element is provided, cleanup everything
    if (!audioElement) {
      this.cleanupAll()
      return
    }

    // Cleanup specific audio element connection
    const connection = this.state.activeConnections.get(audioElement)
    if (connection) {
      try {
        connection.source.disconnect()
        connection.gainNode.disconnect()
        connection.analyzer.disconnect()
        this.state.activeConnections.delete(audioElement)
        
        devLog('Cleaned up audio connection', {
          prefix: 'audio-context',
          level: 'debug'
        })
      } catch (error) {
        devLog('Failed to cleanup audio connection', {
          prefix: 'audio-context',
          level: 'error'
        }, { error })
      }
    }

    // If no more connections, cleanup context
    if (this.state.activeConnections.size === 0) {
      this.cleanupAll()
    }
  }

  private cleanupAll(): void {
    // Clear any pending cleanup timeout
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout)
      this.cleanupTimeout = null
    }

    // Schedule cleanup after a delay to prevent rapid cleanup cycles
    this.cleanupTimeout = setTimeout(() => {
      try {
        // Disconnect all active connections
        this.state.activeConnections.forEach((connection, src) => {
          try {
            connection.source.disconnect()
            connection.gainNode.disconnect()
            connection.analyzer.disconnect()
            this.state.activeConnections.delete(src)
          } catch (error) {
            devLog('Failed to disconnect audio connection', {
              prefix: 'audio-context',
              level: 'error'
            }, { error, src })
          }
        })

        // Close and reset context
        if (this.state.context) {
          this.state.context.close()
          this.state.context = null
        }

        // Reset state
        this.state.gainNode = null
        this.state.isInitialized = false
        this.initializationInProgress.clear()

        devLog('AudioContext cleaned up', {
          prefix: 'audio-context',
          level: 'debug'
        })
      } catch (error) {
        devLog('Failed to cleanup audio context', {
          prefix: 'audio-context',
          level: 'error'
        }, { error })
      }
    }, 1000) // 1 second delay before cleanup
  }

  getState(): AudioContextState {
    return { ...this.state }
  }
} 