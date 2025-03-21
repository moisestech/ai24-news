'use client'

import { extend } from '@react-three/fiber'
import { Group, MeshStandardMaterial, AmbientLight, PointLight } from 'three'

// Only extend what we need
extend({
  Group,
  MeshStandardMaterial,
  AmbientLight,
  PointLight
}) 