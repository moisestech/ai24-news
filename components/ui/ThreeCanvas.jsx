'use client'

import React, { useRef, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'

// Dynamically import Canvas and useFrame
const ThreeCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), {
  ssr: false
})

const useFrame = dynamic(() => import('@react-three/fiber').then(mod => mod.useFrame), {
  ssr: false
})

function WaveformBar({ index, analyser, dataArrayRef, color = '#14b8a6' }) {
  const barRef = useRef(null)
  const [frame, setFrame] = useState(null)
  
  useEffect(() => {
    if (!analyser || !dataArrayRef.current) return
    
    const animate = () => {
      if (!barRef.current || !analyser || !dataArrayRef.current) return
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArrayRef.current)
      
      // Calculate and apply scale with smooth animation
      const targetScale = (dataArrayRef.current[index] / 256) * 3 + 0.1
      barRef.current.scale.y = THREE.MathUtils.lerp(
        barRef.current.scale.y,
        targetScale,
        0.2
      )
      
      frame?.requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      frame?.cancelAnimationFrame(animate)
    }
  }, [index, analyser, dataArrayRef, frame])
  
  return (
    <mesh ref={barRef} position={[index * 0.35 - 5, 0, 0]}>
      <boxGeometry args={[0.25, 1, 0.25]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  )
}

export default function ThreeCanvasWrapper({ 
  analyser, 
  dataArrayRef, 
  isPaused = false, 
  primaryColor = '#14b8a6', 
  secondaryColor = '#0f766e' 
}) {
  const numBars = 32

  return (
    <ThreeCanvas camera={{ position: [0, 0, 10], fov: 40 }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, -10, -10]} color={secondaryColor} intensity={0.4} />
      
      {Array.from({ length: numBars }).map((_, i) => (
        <WaveformBar 
          key={i}
          index={i}
          analyser={analyser}
          dataArrayRef={dataArrayRef}
          color={i % 2 === 0 ? primaryColor : secondaryColor}
        />
      ))}
      
      {/* Rotating background plane for added effect */}
      <mesh rotation={[0, 0, 0]} position={[0, -2, -5]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          color="#000222"
          metalness={0.8}
          roughness={0.4}
        />
      </mesh>
    </ThreeCanvas>
  )
} 