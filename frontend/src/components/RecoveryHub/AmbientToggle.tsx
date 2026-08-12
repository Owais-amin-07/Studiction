import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, VolumeX } from 'lucide-react';
import { playSection, stopAmbient } from '../../services/ambient';
import type { AmbientSection } from '../../services/ambient';

const PREF_KEY = 'studiction-ambient-pref';

interface AmbientToggleProps {
  /** which section we're in, or null when music isn't allowed */
  section: AmbientSection | null;
}

export default function AmbientToggle({ section }: AmbientToggleProps) {
  const [on, setOn] = useState<boolean>(() => {
    try { return localStorage.getItem(PREF_KEY) === 'on'; } catch { return false; }
  });

  // play the right track per section / stop when leaving or turning off
  useEffect(() => {
    if (section && on) playSection(section);
    else stopAmbient();
  }, [section, on]);

  // always stop when leaving the hub
  useEffect(() => () => stopAmbient(), []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try { localStorage.setItem(PREF_KEY, next ? 'on' : 'off'); } catch { /* ignore */ }
    if (next && section) playSection(section);
    else stopAmbient();
  };

  if (!section) return null;

  return (
    <motion.button
      type="button"
      onClick={toggle}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      aria-label={on ? 'Turn music off' : 'Turn music on'}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-medium backdrop-blur-md"
      style={
        on
          ? {
              borderColor: 'rgba(72,207,173,0.5)',
              background: 'rgba(19,19,25,0.8)',
              color: '#48cfad',
              boxShadow: '0 0 24px rgba(72,207,173,0.25)',
            }
          : {
              borderColor: 'rgba(255,255,255,0.12)',
              background: 'rgba(19,19,25,0.8)',
              color: '#a1a1aa',
            }
      }
    >
      {on ? <Music size={14} /> : <VolumeX size={14} />}
      {on ? 'Music on' : 'Music'}
      {on && (
        <motion.span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: '#48cfad' }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}