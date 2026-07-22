import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function getStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const cx = 32, cy = 32;

  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.quadraticCurveTo(cx, cy, 64, cy);
  ctx.quadraticCurveTo(cx, cy, cx, 64);
  ctx.quadraticCurveTo(cx, cy, 0, cy);
  ctx.quadraticCurveTo(cx, cy, cx, 0);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function Stars() {
  const ref   = useRef<THREE.Points>(null);
  const count = 900;
  const starTex = useMemo(() => getStarTexture(), []);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        map={starTex}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function TextRing({ opacity }: { opacity: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const TEXT     = "HEAL • RECOVER • GROW • BREATHE • RISE • ";
  const chars    = TEXT.split('');
  const RADIUS   = 1.6;

  const strandPoints = useMemo(() =>
    chars.map((_, i) => {
      const t     = (i / chars.length) * Math.PI * 2 + 0.2;
      const wave  = Math.sin(t * 2) * 0.2;
      return { x: Math.cos(t) * RADIUS, y: wave, z: Math.sin(t) * RADIUS };
    }), []
  );

  const textures = useMemo(() => {
    return chars.map(char => {
      const SIZE   = 128;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      const ctx    = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, SIZE, SIZE);

      ctx.font         = 'bold 175px "Courier New"';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur   = 0;
      ctx.fillStyle    = '#fff8dca7';
      ctx.fillText(char, SIZE / 2, SIZE / 2);

      const tex       = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    });
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    groupRef.current.traverse(child => {
      if ((child as THREE.Sprite).isSprite) {
        const mat = (child as THREE.Sprite).material as THREE.SpriteMaterial;
        if (mat) mat.opacity = Math.max(0, Math.min(1, opacity.current * 0.75));
      }
    });
  });

  return (
    <group ref={groupRef} renderOrder={-1}>
      {chars.map((_, i) => {
        const p = strandPoints[i];
        return (
          <sprite key={i} position={[p.x, p.y, p.z]} scale={[0.16, 0.2, 0.16]} renderOrder={-1}>
            <spriteMaterial map={textures[i]} transparent opacity={0} depthWrite={false} depthTest={false} />
          </sprite>
        );
      })}
    </group>
  );
}

function DNAFish({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const ref     = useRef<THREE.Group>(null);
  const opacity = useRef(0);

  const SECTION_START = 950;
  const SECTION_END   = 1800;

  const points = useMemo(() => {
    const strand1: THREE.Vector3[] = [];
    const strand2: THREE.Vector3[] = [];
    const rungs:   { p1: THREE.Vector3; p2: THREE.Vector3 }[] = [];

    for (let i = 0; i < 36; i++) {
      const t  = (i / 36) * Math.PI * 5;
      const y  = (i / 36) * 8 - 4;
      const r  = 0.25;
      const p1 = new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
      const p2 = new THREE.Vector3(Math.cos(t + Math.PI) * r, y, Math.sin(t + Math.PI) * r);
      strand1.push(p1);
      strand2.push(p2);
      if (i % 6 === 0) rungs.push({ p1, p2 });
    }
    return { strand1, strand2, rungs };
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const scroll   = scrollRef.current;
    const progress = Math.max(0, Math.min(1, (scroll - SECTION_START) / (SECTION_END - SECTION_START)));
    opacity.current = Math.sin(progress * Math.PI);

    ref.current.position.x = -14 + progress * 28;
    ref.current.position.y =   6 - progress * 12;
    ref.current.rotation.y = progress * Math.PI * 1.5;
    ref.current.rotation.z = Math.sin(progress * Math.PI * 4) * 0.1;
    ref.current.rotation.x = Math.cos(progress * Math.PI * 2) * 0.05;

    ref.current.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) mat.opacity = Math.max(0, Math.min(1, opacity.current * 0.5));
      }
    });
  });

  return (
    <group ref={ref} position={[-14, 6, -1]}>
      <TextRing opacity={opacity} />
      {points.strand1.map((p, i) =>
        i < points.strand1.length - 1 ? (
          <mesh key={`s1-${i}`}
            position={[(p.x + points.strand1[i+1].x)/2, (p.y + points.strand1[i+1].y)/2, (p.z + points.strand1[i+1].z)/2]}
            rotation={[i * 0.5, i * 0.8, i * 0.3]} renderOrder={1}>
            <dodecahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.8} roughness={0.85} metalness={0.2} transparent opacity={0} depthWrite={true} />
          </mesh>
        ) : null
      )}
      {points.strand2.map((p, i) =>
        i < points.strand2.length - 1 ? (
          <mesh key={`s2-${i}`}
            position={[(p.x + points.strand2[i+1].x)/2, (p.y + points.strand2[i+1].y)/2, (p.z + points.strand2[i+1].z)/2]}
            rotation={[i * 0.3, i * 0.6, i * 0.9]} renderOrder={1}>
            <dodecahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={1.8} roughness={0.85} metalness={0.2} transparent opacity={0} depthWrite={true} />
          </mesh>
        ) : null
      )}
      {points.rungs.map((rung, i) => (
        <mesh key={`rung-${i}`}
          position={[(rung.p1.x + rung.p2.x)/2, (rung.p1.y + rung.p2.y)/2, (rung.p1.z + rung.p2.z)/2]}
          rotation={[i * 0.7, i * 0.4, i * 0.2]} renderOrder={1}>
          <tetrahedronGeometry args={[0.04, 0]} />
          <meshStandardMaterial color="#fcd34d" emissive="#fcd34d" emissiveIntensity={2.0} roughness={0.7} transparent opacity={0} depthWrite={true} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  return (
    <>
      <ambientLight intensity={0.05} />
      <pointLight position={[5, 5, 5]}    color="#f59e0b" intensity={2.0} />
      <pointLight position={[-5, -5, -5]} color="#ea580c" intensity={1.5} />
      <pointLight position={[0, 8, 0]}    color="#ffffff"  intensity={0.5} />
      <Stars />
      <DNAFish scrollRef={scrollRef} />
    </>
  );
}

export default function SpaceBackground() {
  const scrollRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 2, 14], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Scene scrollRef={scrollRef} />
      </Canvas>
    </div>
  );
}