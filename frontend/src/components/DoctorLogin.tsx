import React, { useState, useRef, useEffect } from 'react';
import { Stethoscope, Eye, EyeOff, Mail, Lock, RefreshCw, ArrowLeft } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import * as doctorApi from '../services/doctorApi';
import type { DoctorData } from '../services/doctorApi';

interface DoctorLoginProps {
  onLogin: (doctor: DoctorData) => void;
  onBack:  () => void;
}

// Same animated diagonal-line background used across the other entry screens.
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
      color:  i % 2 === 0 ? '#48cfad' : '#6c63ff',
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

const containerVariants: Variants = {
  hidden:  { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 85, damping: 15, staggerChildren: 0.08, delayChildren: 0.1 },
  },
};
const itemVariants: Variants = {
  hidden:  { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 14 } },
};

export default function DoctorLogin({ onLogin, onBack }: DoctorLoginProps) {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const newErrors: typeof errors = {};
    if (!email)                            newErrors.email    = 'Email address required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email    = 'Please use a valid email address';
    if (!password)                         newErrors.password = 'Password required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const doctor = await doctorApi.doctorLogin({ email, password });
      onLogin(doctor);
    } catch (err: any) {
      setServerError(err.message || 'Login failed — please try again');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4">
      <motion.button
        type="button" onClick={onBack}
        whileHover={{ x: -2 }}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </motion.button>

      <motion.div
        variants={containerVariants} initial="hidden" animate="visible"
        className="relative w-full max-w-[420px] bg-[#04040e]/60 [backdrop-filter:blur(18px)_saturate(220%)] border border-[rgba(255,255,255,0.07)] rounded-[24px] p-6 shadow-[0_0_85px_rgba(72,207,173,0.10),0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <LineCanvas />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center mb-5">
          <motion.div variants={itemVariants}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#48cfad] to-[#6c63ff] flex items-center justify-center shadow-[0_4px_25px_rgba(72,207,173,0.25)] mb-3">
            <Stethoscope className="w-5.5 h-5.5 text-white" />
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-white text-xl md:text-2xl font-light tracking-wide mb-0.5">
            Doctor Portal
          </motion.h1>
          <motion.p variants={itemVariants} className="text-zinc-500 text-xs md:text-sm">
            Registered practitioners only
          </motion.p>
        </div>

        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mb-3 px-4 py-3 rounded-xl text-sm text-rose-300 border border-rose-500/30"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            {serverError}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-3.5">
          <motion.div variants={itemVariants} className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">Email Address</label>
              {errors.email && <span className="text-rose-400 text-[11px] font-medium">{errors.email}</span>}
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#48cfad] transition-colors duration-200">
                <Mail className="w-4 h-4" />
              </div>
              <input type="text" placeholder="doctor@studiction.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#48cfad]/80 rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-4 focus:ring-[#48cfad]/10 outline-none transition-all duration-300" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">Password</label>
              {errors.password && <span className="text-rose-400 text-[11px] font-medium">{errors.password}</span>}
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#48cfad] transition-colors duration-200">
                <Lock className="w-4 h-4" />
              </div>
              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pl-10 pr-11 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#48cfad]/80 rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-4 focus:ring-[#48cfad]/10 outline-none transition-all duration-300" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors duration-200">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="pt-1">
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isSubmitting}
              className="w-full h-11 bg-gradient-to-r from-[#48cfad] to-[#6c63ff] rounded-xl text-white font-semibold tracking-wider uppercase text-[13px] shadow-[0_0_25px_rgba(72,207,173,0.22)] hover:shadow-[0_0_35px_rgba(72,207,173,0.45)] transition-all cursor-pointer flex items-center justify-center">
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="animate-spin h-5 w-5 text-white" />
                  <span className="tracking-widest">VERIFYING...</span>
                </div>
              ) : 'SIGN IN'}
            </motion.button>
          </motion.div>
        </form>

        <motion.p variants={itemVariants} className="relative z-10 text-center text-zinc-600 text-[11px] mt-4">
          Doctor accounts are created by the Studiction team — there's no self-signup here.
        </motion.p>
      </motion.div>
    </div>
  );
}
