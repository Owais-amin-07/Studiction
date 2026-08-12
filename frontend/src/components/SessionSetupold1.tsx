import { useState, useRef, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Clock, Zap, Compass, Layers, Cpu, Stethoscope, Lock, ChevronRight } from 'lucide-react';

// Animated diagonal streak lines, top-left → bottom-right — same effect used
// in Login/Signup/Account. Kept as a local copy to match how those files do it.
function LineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    canvas.width  = parent?.offsetWidth  || 420;
    canvas.height = parent?.offsetHeight || 600;

    const W    = canvas.width;
    const H    = canvas.height;
    const diag = W + H;

    const lines = Array.from({ length: 14 }, (_, i) => ({
      offset: (i / 14) * diag,
      speed:  0.3 + Math.random() * 0.2,
      width:  1.0 + Math.random() * 1.0,
      phase:  Math.random() * Math.PI * 2,
      vibAmp: 2 + Math.random() * 3,
      color:  i % 2 === 0 ? '#6c63ff' : '#48cfad',
      alpha:  0.20 + Math.random() * 0.15,
    }));

    let time   = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      time += 0.008;
      lines.forEach(line => {
        line.offset += line.speed;
        if (line.offset > diag) line.offset = 0;
        const vib = Math.sin(time + line.phase) * line.vibAmp;
        const x1 = line.offset - H + vib;
        const y1 = H;
        const x2 = line.offset + vib;
        const y2 = 0;
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0,   'transparent');
        grad.addColorStop(0.2, line.color);
        grad.addColorStop(0.8, line.color);
        grad.addColorStop(1,   'transparent');
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = line.alpha;
        ctx.lineWidth   = line.width;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

export interface SessionConfig {
  durationMinutes: number;
  mood: 'robotic'; // 'doctor' (Real Doctor) will join this union once it ships
}

interface SessionSetupProps {
  onStart: (config: SessionConfig) => void;
}

const DURATIONS = [
  { minutes: 5,  label: 'Quick Check',   icon: Zap },
  { minutes: 10, label: 'Standard',      icon: Clock },
  { minutes: 15, label: 'Deep Dive',     icon: Compass },
  { minutes: 20, label: 'Comprehensive', icon: Layers },
] as const;

const containerVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring' as const, stiffness: 90, damping: 15, staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
};

export default function SessionSetup({ onStart }: SessionSetupProps) {
  // Standard (10 min) is pre-selected — a sensible default so Start is usable
  // immediately, without forcing an extra click for someone in a hurry.
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(108,99,255,0.08)' }}
      >
        {/* Diagonal lines — same background treatment as Login/Signup/Account */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <LineCanvas />
        </div>

        <motion.div variants={itemVariants} className="text-center mb-7">
          <h1 className="text-white text-xl md:text-2xl font-light tracking-wide mb-1">Set up your session</h1>
          <p className="text-zinc-500 text-xs md:text-sm">A couple of quick choices before we begin</p>
        </motion.div>

        {/* ── Duration ── */}
        <motion.div variants={itemVariants} className="mb-6">
          <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest px-1 mb-2 block">
            How much time do you have?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {DURATIONS.map(({ minutes, label, icon: Icon }) => {
              const isSelected = selectedMinutes === minutes;
              return (
                <motion.button
                  key={minutes}
                  type="button"
                  onClick={() => setSelectedMinutes(minutes)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer"
                  style={{
                    borderColor: isSelected ? 'rgba(108,99,255,0.6)' : 'rgba(255,255,255,0.06)',
                    background:  isSelected ? 'rgba(108,99,255,0.08)' : 'rgba(6,6,17,0.6)',
                    boxShadow:   isSelected ? '0 0 20px rgba(108,99,255,0.15)' : 'none',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: isSelected ? '#6c63ff' : '#71717a' }} />
                  <div>
                    <p className="text-white text-sm font-semibold">{minutes} min</p>
                    <p className="text-zinc-500 text-[11px]">{label}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Mood ── */}
        <motion.div variants={itemVariants} className="mb-7">
          <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest px-1 mb-2 block">
            Who would you like to talk to?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* AI mode — selectable, and currently the only option */}
            <div
              className="relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left cursor-default"
              style={{
                borderColor: 'rgba(72,207,173,0.5)',
                background:  'rgba(72,207,173,0.06)',
                boxShadow:   '0 0 20px rgba(72,207,173,0.12)',
              }}
            >
              <Cpu className="w-4 h-4" style={{ color: '#48cfad' }} />
              <div>
                <p className="text-white text-sm font-semibold">AI Mode</p>
                <p className="text-zinc-500 text-[11px]">Structured &amp; efficient</p>
              </div>
              <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                style={{ color: '#48cfad', background: 'rgba(72,207,173,0.12)' }}>
                Selected
              </span>
            </div>

            {/* Real Doctor — locked */}
            <div
              className="relative flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left opacity-50 cursor-not-allowed"
              style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(6,6,17,0.6)' }}
              title="Real Doctor mode is coming soon"
            >
              <Stethoscope className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-white text-sm font-semibold">Real Doctor</p>
                <p className="text-zinc-500 text-[11px]">Coming soon</p>
              </div>
              <span className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full text-zinc-400"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <Lock className="w-2.5 h-2.5" /> Premium
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Start ── */}
        <motion.div variants={itemVariants}>
          <motion.button
            type="button"
            onClick={() => onStart({ durationMinutes: selectedMinutes, mood: 'robotic' })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-11 bg-gradient-to-r from-[#6c63ff] to-[#48cfad] rounded-xl text-white font-semibold tracking-wider uppercase text-[13px] shadow-[0_0_25px_rgba(108,99,255,0.22)] hover:shadow-[0_0_35px_rgba(108,99,255,0.45)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            Begin Session <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}