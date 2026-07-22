import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ── Interior Particles ───────────────────────────────────────────
function InteriorParticles() {
  const ref = useRef<THREE.Points>(null);

  // useMemo: compute once per mount, never again
  const { positions, colors } = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 0.5 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta) * 2;
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 2;
      positions[i * 3 + 2] = r * Math.cos(phi) * 2;

      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.3; colors[i * 3 + 2] = 1.0;
      } else if (colorChoice < 0.7) {
        colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.9;
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
      }
    }
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

// ── Glass Brain ──────────────────────────────────────────────────
function GlassBrain() {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/Brain.glb');

  // Clone once per mount instead of mutating the shared cached scene,
  // and only build materials/bounds once via useMemo
  const { clonedScene, offset } = useMemo(() => {
    const clonedScene = scene.clone(true);

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#a0c4ff'),
          metalness: 0.1,
          roughness: 0.05,
          transmission: 0.95,
          thickness: 0.5,
          transparent: true,
          opacity: 0.7,
          ior: 1.5,
          reflectivity: 1,
          envMapIntensity: 2,
          side: THREE.DoubleSide,
        });
      }
    });

    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());

    return {
      clonedScene,
      offset: [-center.x * 0.007, -center.y * 0.007, -center.z * 0.007] as [number, number, number],
    };
  }, [scene]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.06;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={clonedScene} scale={[0.007, 0.007, 0.007]} position={offset} />
      <InteriorParticles />
      <pointLight color="#0d00ff" intensity={2}   distance={2}   position={[0.2, 0.2, 0]} />
      <pointLight color="#f2ff00" intensity={1.5} distance={1.5} position={[-0.2, -0.1, 0.2]} />
    </group>
  );
}

// ── Main Scene — memoized so it NEVER re-renders ─────────────────
const BrainScene = memo(function BrainScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.5,
      }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]}    color="#6c63ff" intensity={2} />
      <pointLight position={[-5, -3, -3]} color="#48cfad" intensity={1.5} />
      <spotLight
        position={[0, 5, 3]}
        angle={0.4}
        penumbra={1}
        intensity={3}
        color="#ffffff"
      />

      <GlassBrain />

      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
});

export default BrainScene;

// Preload model
useGLTF.preload('/Brain.glb');