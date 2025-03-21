import { Object3DNode } from '@react-three/fiber'
import {
  Mesh,
  BoxGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  AmbientLight,
  PointLight,
  Material
} from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: Object3DNode<Mesh, typeof Mesh>
      boxGeometry: Object3DNode<BoxGeometry, typeof BoxGeometry>
      planeGeometry: Object3DNode<PlaneGeometry, typeof PlaneGeometry>
      meshStandardMaterial: Object3DNode<MeshStandardMaterial, typeof MeshStandardMaterial>
      ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
      pointLight: Object3DNode<PointLight, typeof PointLight>
    }
  }
} 