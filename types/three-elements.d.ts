import { Object3DNode, BufferGeometryNode, MaterialNode } from '@react-three/fiber'
import { Mesh, BoxGeometry, PlaneGeometry, MeshStandardMaterial, AmbientLight, PointLight } from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: Object3DNode<Mesh, typeof Mesh>
      boxGeometry: BufferGeometryNode<BoxGeometry, typeof BoxGeometry>
      planeGeometry: BufferGeometryNode<PlaneGeometry, typeof PlaneGeometry>
      meshStandardMaterial: MaterialNode<MeshStandardMaterial, typeof MeshStandardMaterial>
      ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
      pointLight: Object3DNode<PointLight, typeof PointLight>
    }
  }
} 