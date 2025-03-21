import { Object3DNode, MaterialNode, extend } from '@react-three/fiber'
import { Material, Group, PointLight, AmbientLight } from 'three'
import { Text3D, Center } from '@react-three/drei'

// Extend Three.js with Drei components
extend({ Text3D, Center })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: Object3DNode<Group, typeof Group>
      meshStandardMaterial: MaterialNode<Material, typeof Material>
      ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
      pointLight: Object3DNode<PointLight, typeof PointLight>
      text3D: Object3DNode<Text3D, typeof Text3D>
      center: Object3DNode<Center, typeof Center>
    }
  }
} 