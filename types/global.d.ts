// Allow any JSX elements in global namespace
declare namespace JSX {
  interface IntrinsicElements {
    mesh: any;
    boxGeometry: any;
    planeGeometry: any;
    meshStandardMaterial: any;
    ambientLight: any;
    pointLight: any;
    gridHelper: any;
    directionalLight: any;
    group: any;
    sphereGeometry: any;
    axesHelper: any;
    // Add any other Three.js elements you might use
  }
} 