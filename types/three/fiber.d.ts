import { Object3DNode, MaterialNode } from '@react-three/fiber'
import { Material, Group, PointLight, AmbientLight, MeshStandardMaterial } from 'three'
import { Text3D, Center } from '@react-three/drei'

declare module '@react-three/fiber' {
  interface ThreeElements {
    group: Object3DNode<Group, typeof Group>
    meshStandardMaterial: Object3DNode<MeshStandardMaterial, typeof MeshStandardMaterial>
    ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
    pointLight: Object3DNode<PointLight, typeof PointLight>
    text3D: Object3DNode<Text3D, typeof Text3D>
    center: Object3DNode<Center, typeof Center>
  }
} 