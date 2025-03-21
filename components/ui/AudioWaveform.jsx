'use client'

import React, { useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'

function WaveformBar(props) {
  const { index, analyser, dataArrayRef, color = '#14b8a6' } = props
  const barRef = useRef(null)
  
  useFrame(() => {
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
  })
  
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

export function AudioWaveform(props) {
  const { analyser, dataArrayRef, isPaused = false, primaryColor = '#14b8a6', secondaryColor = '#0f766e' } = props
  const numBars = 32
  
  return (
    <div className="w-full h-32 rounded-md overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10], fov: 40 }}>
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
      </Canvas>
    </div>
  )
} 