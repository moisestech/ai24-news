import { useState, useEffect, useRef } from 'react'

/**
 * Hook to provide audio frequency analysis for visualizations
 * @param audioRef Reference to the HTML audio element
 * @returns Object containing the analyser node, data array reference, and initialization status
 */
export function useAudioAnalyser(audioRef: React.RefObject<HTMLAudioElement | null>) {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  useEffect(() => {
    if (!audioRef.current) return
    
    const audio = audioRef.current
    
    // Function to initialize audio context and analyzer
    const initializeAudio = () => {
      try {
        // Create audio context - must be created after user interaction
        const audioContext = new (window.AudioContext || 
          (window as any).webkitAudioContext)()
        
        // Create analyzer node
        const analyserNode = audioContext.createAnalyser()
        analyserNode.fftSize = 256
        
        // Connect audio element to the analyzer
        const source = audioContext.createMediaElementSource(audio)
        source.connect(analyserNode)
        analyserNode.connect(audioContext.destination)
        
        // Create data array for frequency data
        const bufferLength = analyserNode.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        // Set state
        setAnalyser(analyserNode)
        dataArrayRef.current = dataArray
        setIsInitialized(true)
        
        // Remove event listeners since we're initialized
        audio.removeEventListener('play', initializeAudio)
        document.removeEventListener('click', initializeAudio)
      } catch (error) {
        console.error('Failed to initialize audio analyzer:', error)
      }
    }
    
    // We need user interaction to initialize AudioContext in most browsers
    if (!isInitialized) {
      audio.addEventListener('play', initializeAudio)
      document.addEventListener('click', initializeAudio)
    }
    
    // Cleanup on unmount
    return () => {
      if (!isInitialized) {
        audio.removeEventListener('play', initializeAudio)
        document.removeEventListener('click', initializeAudio)
      }
    }
  }, [audioRef, isInitialized])
  
  return {
    analyser,
    dataArrayRef,
    isInitialized
  }
} 