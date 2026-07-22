import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LiquidTransition({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
  const audio = new Audio('/sounds/chat-opening.mp3');

  audio.volume = 0.7;
  audio.play().catch(err => console.error('Audio failed:', err));

  const timer = setTimeout(() => {
    onComplete();
  }, 2500);

  return () => {
    clearTimeout(timer);
  };
}, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(30px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-clinical-bg/90 flex items-center justify-center p-8 pointer-events-none"
    >
      <motion.div 
        animate={{ 
          scale: [1, 5, 0], 
          opacity: [0, 0.5, 0],
          filter: ['blur(10px)', 'blur(30px)', 'blur(50px)']
        }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        className="absolute w-64 h-64 rounded-full bg-zen-emerald mix-blend-screen"
      />
    </motion.div>
  );
}
