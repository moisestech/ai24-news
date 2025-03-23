'use client'

import React, { useRef, useEffect } from 'react'
import { devLog } from '@/lib/utils/log'

/**
 * AudioVisualizer Component
 * 
 * This component renders a real-time waveform visualization of audio playback.
 * 
 * Requirements for proper operation:
 * 1. Audio Context must be initialized and in 'running' state
 * 2. Audio element must have crossOrigin="anonymous" set
 * 3. Analyzer node must be properly connected in the audio graph:
 *    source -> gain -> analyzer -> destination
 * 4. FFT size should be set to 256 for optimal performance
 * 5. Data array must be initialized with correct size (frequencyBinCount)
 * 
 * @param {Object} props
 * @param {AnalyserNode} props.analyser - The Web Audio API analyzer node
 * @param {React.RefObject<Uint8Array>} props.dataArrayRef - Reference to the frequency data array
 * @param {boolean} props.isPaused - Whether the audio is currently paused
 * @param {string} props.primaryColor - Primary color for the waveform
 * @param {string} props.secondaryColor - Secondary color for the waveform
 */
export default function AudioVisualizer({ 
  analyser, 
  dataArrayRef, 
  isPaused = false, 
  primaryColor = '#14b8a6', 
  secondaryColor = '#0f766e' 
}) {
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const lastLogTime = useRef(0)

  useEffect(() => {
    // Validate required props and log state for debugging
    if (!analyser || !canvasRef.current || !dataArrayRef?.current) {
      devLog('Missing required props', {
        prefix: 'audio-visualizer',
        level: 'warn'
      }, {
        hasAnalyser: !!analyser,
        hasCanvas: !!canvasRef.current,
        hasDataArray: !!dataArrayRef?.current,
        analyserState: analyser ? {
          fftSize: analyser.fftSize,
          frequencyBinCount: analyser.frequencyBinCount,
          minDecibels: analyser.minDecibels,
          maxDecibels: analyser.maxDecibels,
          smoothingTimeConstant: analyser.smoothingTimeConstant
        } : null
      })
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dataArray = dataArrayRef.current

    // Set canvas size with device pixel ratio for sharp rendering
    const setCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      devLog('Canvas size set', {
        prefix: 'audio-visualizer',
        level: 'debug'
      }, {
        width: canvas.width,
        height: canvas.height,
        dpr,
        rect
      })
    }

    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)

    // Log initialization state for debugging
    devLog('Initialized audio analyzer', {
      prefix: 'audio-visualizer',
      level: 'debug'
    }, {
      bufferLength: dataArray.length,
      fftSize: analyser.fftSize,
      minDecibels: analyser.minDecibels,
      maxDecibels: analyser.maxDecibels,
      isPaused,
      canvasSize: {
        width: canvas.width,
        height: canvas.height
      }
    })

    // Main animation loop
    const draw = () => {
      if (isPaused) {
        // Log paused state occasionally
        const now = Date.now()
        if (now - lastLogTime.current > 5000) { // Log every 5 seconds when paused
          devLog('Visualizer paused', {
            prefix: 'audio-visualizer',
            level: 'debug'
          }, {
            isPaused,
            analyserState: {
              fftSize: analyser.fftSize,
              frequencyBinCount: analyser.frequencyBinCount,
              minDecibels: analyser.minDecibels,
              maxDecibels: analyser.maxDecibels,
              smoothingTimeConstant: analyser.smoothingTimeConstant
            }
          })
          lastLogTime.current = now
        }
        animationFrameRef.current = requestAnimationFrame(draw)
        return
      }

      // Get frequency data from analyzer
      analyser.getByteFrequencyData(dataArray)

      // Log frequency data occasionally for debugging
      const now = Date.now()
      if (now - lastLogTime.current > 1000) { // Log every second
        devLog('Frequency data sample', {
          prefix: 'audio-visualizer',
          level: 'debug'
        }, {
          min: Math.min(...dataArray),
          max: Math.max(...dataArray),
          avg: dataArray.reduce((a, b) => a + b, 0) / dataArray.length,
          nonZeroCount: dataArray.filter(x => x > 0).length,
          analyserState: {
            fftSize: analyser.fftSize,
            frequencyBinCount: analyser.frequencyBinCount,
            minDecibels: analyser.minDecibels,
            maxDecibels: analyser.maxDecibels,
            smoothingTimeConstant: analyser.smoothingTimeConstant
          }
        })
        lastLogTime.current = now
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate bar width and spacing
      const barWidth = (canvas.width / dataArray.length) * 2.5
      const barSpacing = 2

      // Draw frequency bars
      let x = 0
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
        gradient.addColorStop(0, i % 2 === 0 ? primaryColor : secondaryColor)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)')

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + barSpacing
      }

      // Add glow effect
      ctx.globalCompositeOperation = 'lighter'
      ctx.filter = 'blur(4px)'
      ctx.globalAlpha = 0.3

      x = 0
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height
        ctx.fillStyle = i % 2 === 0 ? primaryColor : secondaryColor
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + barSpacing
      }

      // Reset context properties
      ctx.globalCompositeOperation = 'source-over'
      ctx.filter = 'none'
      ctx.globalAlpha = 1

      animationFrameRef.current = requestAnimationFrame(draw)
    }

    // Start the animation loop
    draw()

    // Cleanup function
    return () => {
      window.removeEventListener('resize', setCanvasSize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      devLog('Audio visualizer cleaned up', {
        prefix: 'audio-visualizer',
        level: 'debug'
      })
    }
  }, [analyser, dataArrayRef, isPaused, primaryColor, secondaryColor])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-32 rounded-md bg-black"
      style={{ 
        imageRendering: 'pixelated',
      }}
    />
  )
} 