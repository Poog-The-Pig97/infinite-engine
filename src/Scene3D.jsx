import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Sprite3D({ sprite }) {
  return (
    <mesh position={[sprite.x / 120 - 3.5, -sprite.y / 140 + 2.5, 0]}>
      <boxGeometry args={[0.75, 0.75, 0.75]} />
      <meshStandardMaterial color={sprite.color} emissive={sprite.color} emissiveIntensity={0.25} />
    </mesh>
  );
}

export default function Scene3D({ sprites }) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
      <color attach="background" args={['#050b17']} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <group>
        {sprites.map((sprite) => (
          <Sprite3D key={sprite.id} sprite={sprite} />
        ))}
      </group>
      <OrbitControls enablePan enableZoom enableRotate />
    </Canvas>
  );
}
