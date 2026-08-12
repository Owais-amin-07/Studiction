import { useRef, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { HeartHandshake, Stethoscope, ArrowRight } from 'lucide-react';

interface WelcomeGateProps {
  onContinueAsPatient: () => void;
  onGoToDoctorLogin:   () => void;
}

// Same animated diagonal-line background used across Login/Signup/Account/SessionSetup.
function LineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    canvas.width  = parent?.offsetWidth  || 900;
    canvas.height = parent?.offsetHeight || 600;

    const W    = canvas.width;
    const H    = canvas.height;
    const diag = W + H;

    const lines = Array.from({ length: 18 }, (_, i) => ({
      offset: (i / 18) * diag,
      speed:  0.3 + Math.random() * 0.2,
      width:  1.0 + Math.random() * 1.0,
      phase:  Math.random() * Math.PI * 2,
      vibAmp: 2 + Math.random() * 3,
      color:  i % 2 === 0 ? '#6c63ff' : '#48cfad',
      alpha:  0.16 + Math.random() * 0.12,
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

const containerVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 16 } },
};

export default function WelcomeGate({ onContinueAsPatient, onGoToDoctorLogin }: WelcomeGateProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <LineCanvas />
      </div>

      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="relative z-10 w-full max-w-2xl text-center"
      >
        <motion.div variants={itemVariants} className="mb-10">
          <h1 className="text-white text-2xl md:text-3xl font-light tracking-wide mb-2">Welcome to Studiction</h1>
          <p className="text-zinc-500 text-sm">Tell us who you are, so we can take you to the right place</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          <motion.button
            type="button"
            variants={itemVariants}
            onClick={onContinueAsPatient}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="glass-panel rounded-3xl p-7 text-left flex flex-col gap-4 cursor-pointer border transition-all duration-200"
            style={{ borderColor: 'rgba(108,99,255,0.35)' }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(108,99,255,0.12)' }}>
              <HeartHandshake className="w-5 h-5" style={{ color: '#6c63ff' }} />
            </div>
            <div>
              <p className="text-white text-base font-semibold mb-1">Continue as a Member</p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Take an assessment, track your progress, and connect with a doctor when you're ready.
              </p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: '#6c63ff' }}>
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </motion.button>

          <motion.button
            type="button"
            variants={itemVariants}
            onClick={onGoToDoctorLogin}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="glass-panel rounded-3xl p-7 text-left flex flex-col gap-4 cursor-pointer border transition-all duration-200"
            style={{ borderColor: 'rgba(72,207,173,0.35)' }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(72,207,173,0.12)' }}>
              <Stethoscope className="w-5 h-5" style={{ color: '#48cfad' }} />
            </div>
            <div>
              <p className="text-white text-base font-semibold mb-1">Doctor Login</p>
              <p className="text-zinc-500 text-xs leading-relaxed">
                For registered practitioners only. Review requests and support members through recovery.
              </p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest"
              style={{ color: '#48cfad' }}>
              Sign in <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
