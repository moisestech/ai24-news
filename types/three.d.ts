import { Object3DNode, MaterialNode, ExtendedColors, Overwrite, NodeProps } from '@react-three/fiber'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { Group, PointLight, AmbientLight, MeshStandardMaterial, MeshStandardMaterialParameters } from 'three'

declare module '@react-three/fiber' {
  interface ThreeElements {
    textGeometry: Object3DNode<TextGeometry, typeof TextGeometry>
    group: Object3DNode<Group, typeof Group>
    pointLight: Object3DNode<PointLight, typeof PointLight>
    ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
    meshStandardMaterial: ExtendedColors<Overwrite<
      Partial<MeshStandardMaterial>,
      NodeProps<MeshStandardMaterial, [MeshStandardMaterialParameters]>
    >>
  }
} 