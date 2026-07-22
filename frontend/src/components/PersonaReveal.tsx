import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { TorusKnot, MeshDistortMaterial, Environment, Float } from '@react-three/drei';
import { motion } from 'framer-motion';

interface PersonaRevealProps {
  onComplete?: () => void;
}

export default function PersonaReveal({ onComplete }: PersonaRevealProps) {
  const [distort, setDistort] = useState(1.5);
  const [speed, setSpeed] = useState(5);

  useEffect(() => {
    // Play an evolving ambient sound
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Deep evolving pad sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime); // A2
    osc.frequency.linearRampToValueAtTime(110.5, audioCtx.currentTime + 8); // Slight detune over time

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 3);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 10);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 10);

    // Visually smooth out the jagged persona form over 4 seconds into a continuous loop (Torus Knot)
    const timer = setTimeout(() => {
      setDistort(0.2); // Smooths out the knot, representing the journey from chaos to structure
      setSpeed(1.5);
    }, 4000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen bg-clinical-bg flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-100">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={2} color="#10b981" />
          <directionalLight position={[-5, -5, -5]} intensity={1} color="#6366f1" />
          <pointLight position={[0, 0, 0]} intensity={2} color="#f43f5e" />
          
          <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
            <TorusKnot args={[1.2, 0.4, 256, 64]} scale={0.9}>
              <MeshDistortMaterial 
                color="#09090b" 
                attach="material" 
                distort={distort} 
                speed={speed} 
                roughness={0.05}
                metalness={1}
                clearcoat={1}
                clearcoatRoughness={0.1}
                envMapIntensity={2}
              />
            </TorusKnot>
          </Float>
          <Environment preset="night" />
        </Canvas>
      </div>

      <div className="relative z-10 text-center mt-[40vh] pointer-events-none">
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 2 }}
          className="text-zen-emerald font-medium tracking-widest uppercase mb-4"
        >
          Diagnostic Complete
        </motion.p>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 2, duration: 2 }}
          className="text-5xl md:text-7xl font-light text-white mb-6"
        >
          The Observer
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 2 }}
          className="text-zinc-400 max-w-xl mx-auto text-lg leading-relaxed px-4"
        >
          Your mind is seeking clarity amid the noise. We begin by anchoring your awareness. 
          As you log progress securely, watch your mental architecture smooth into balance.
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 6, duration: 1 }}
          onClick={onComplete}
          className="mt-12 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 hover:border-zen-emerald/50 transition-colors pointer-events-auto backdrop-blur-md"
        >
          Enter Dashboard
        </motion.button>
      </div>
    </div>
  );
}
