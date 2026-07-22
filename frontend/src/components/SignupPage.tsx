// src/components/SignupPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Eye, EyeOff, User, Mail, Lock, Shield, Cpu, RefreshCw, X } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';

interface SignupPageProps {
  onSignup:     (data: { name: string; email: string; password: string }) => Promise<void>;
  onGoogleAuth: (data: { token: string; user: any }) => void;
  onGoToLogin:  () => void;
  onClose:      () => void;
}

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

export default function SignupPage({ onSignup, onGoogleAuth, onGoToLogin, onClose }: SignupPageProps) {
  const [name,                setName]                = useState('');
  const [email,               setEmail]               = useState('');
  const [password,            setPassword]            = useState('');
  const [confirmPassword,     setConfirmPassword]     = useState('');
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting,        setIsSubmitting]        = useState(false);
  const [serverError,         setServerError]         = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string; confirmPassword?: string;
  }>({});

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length > 6)           score++;
    if (/[A-Z]/.test(pass))        score++;
    if (/[0-9]/.test(pass))        score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    const map: Record<number, { label: string; color: string }> = {
      1: { label: 'Weak',   color: '#ef4444' },
      2: { label: 'Fair',   color: '#f97316' },
      3: { label: 'Good',   color: '#eab308' },
      4: { label: 'Strong', color: '#48cfad' },
    };
    return { score, ...(map[score] ?? { label: '', color: '' }) };
  };

  const strength = getPasswordStrength(password);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const newErrors: typeof errors = {};
    if (!name.trim())                      newErrors.name = 'Full name is required';
    if (!email)                            newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email address';
    if (!password)                         newErrors.password = 'Password is required';
    else if (password.length < 6)         newErrors.password = 'Must be at least 6 characters';
    if (!confirmPassword)                  newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await onSignup({ name, email, password });
    } catch (err: any) {
      setServerError(err.message || 'Sign up failed — please try again');
      setIsSubmitting(false);
    }
  };

  // ── Framer Motion variants — typed as Variants to satisfy strict TS ──────────
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

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onGoogleAuth(data);
      } catch (err: any) {
        setServerError(err.message || 'Google sign-in failed');
      }
    },
    onError: () => setServerError('Google sign-in was cancelled'),
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-[490px] md:max-w-[700px] bg-[#04040e]/80 [backdrop-filter:blur(36px)_saturate(220%)] border border-[rgba(255,255,255,0.07)] rounded-[24px] p-4 md:p-6 shadow-[0_0_85px_rgba(108,99,255,0.11),0_25px_70px_rgba(0,0,0,0.85)] z-10 overflow-hidden"
    >
      {/* X Close */}
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%', width: '32px', height: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#71717a', zIndex: 20,
        }}
      >
        <X size={14} />
      </motion.button>

      {/* Ribbons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <LineCanvas />
        <motion.div
          animate={{ y: [-6, 8, -6], rotate: [8, 12, 8], scale: [1, 1.04, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-15%] w-[240px] h-[220px] opacity-45"
        >
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <defs>
              <linearGradient id="signupGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#6c63ff" stopOpacity="0.85" />
                <stop offset="60%"  stopColor="#a78bfa" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#48cfad" stopOpacity="0" />
              </linearGradient>
              <filter id="signupGlow">
                <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d="M50,100 Q150,50 300,180 T450,250 L400,450 Q250,300, 100,380 Z" fill="url(#signupGrad1)" filter="url(#signupGlow)" />
            <path d="M80,120 Q180,70 320,195 T470,260" fill="none" stroke="#48cfad" strokeWidth="5" strokeOpacity="0.7" filter="url(#signupGlow)" />
          </svg>
        </motion.div>
        <motion.div
          animate={{ y: [6, -8, 6], rotate: [-20, -16, -20], scale: [1, 1.06, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[-10%] right-[-14%] w-[260px] h-[240px] opacity-40"
        >
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <defs>
              <linearGradient id="signupGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="#48cfad" stopOpacity="0.9" />
                <stop offset="60%"  stopColor="#6c63ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M100,400 Q200,300 350,420 T480,350 L450,100 Q300,200 150,120 Z" fill="url(#signupGrad2)" filter="url(#signupGlow)" />
            <path d="M120,380 Q220,280 370,405 T490,340" fill="none" stroke="#6c63ff" strokeWidth="6" strokeOpacity="0.8" filter="url(#signupGlow)" />
          </svg>
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.06)_0%,rgba(0,0,0,0)_70%)] blur-2xl pointer-events-none" />
      </div>

      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.12)] to-transparent" />

      {/* Header */}
      <div className="flex flex-col items-center text-center mb-2 md:mb-3 relative z-10">
        <div className="relative mb-2 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute w-16 h-16 rounded-full border border-dashed border-[#48cfad]/25" />
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-12 h-12 rounded-full border border-[#6c63ff]/20 shadow-[0_0_15px_rgba(108,99,255,0.1)]" />
          <motion.div variants={itemVariants} whileHover={{ rotate: 10, scale: 1.05 }}
            className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#48cfad] flex items-center justify-center shadow-[0_4px_25px_rgba(108,99,255,0.25)] z-10 cursor-pointer">
            <Brain className="w-5.5 h-5.5 text-white" />
          </motion.div>
        </div>
        <motion.h1 variants={itemVariants} className="text-white text-xl md:text-2xl font-light tracking-wide mb-0.5">
          Reclaim Your Mind
        </motion.h1>
        <motion.p variants={itemVariants} className="text-zinc-500 text-xs md:text-sm">
          Begin your path to digital freedom
        </motion.p>
      </div>

      {/* Server error banner */}
      {serverError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-3 px-4 py-3 rounded-xl text-sm text-rose-300 border border-rose-500/30"
          style={{ background: 'rgba(239,68,68,0.08)' }}
        >
          {serverError}
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleFormSubmit} className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-5 md:gap-y-3 relative z-10">

        {/* Full Name */}
        <motion.div variants={itemVariants} className="space-y-1">
          <div className="flex justify-between items-center px-1">
            <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">Full Name</label>
            {errors.name && <span className="text-rose-400 text-[11px] font-medium">{errors.name}</span>}
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#6c63ff] transition-colors duration-200">
              <User className="w-4 h-4" />
            </div>
            <input type="text" placeholder="Marcus Aurelius" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#6c63ff]/80 rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-4 focus:ring-[#6c63ff]/10 outline-none transition-all duration-300" />
          </div>
        </motion.div>

        {/* Email */}
        <motion.div variants={itemVariants} className="space-y-1">
          <div className="flex justify-between items-center px-1">
            <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">Email Address</label>
            {errors.email && <span className="text-rose-400 text-[11px] font-medium">{errors.email}</span>}
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#6c63ff] transition-colors duration-200">
              <Mail className="w-4 h-4" />
            </div>
            <input type="email" placeholder="reclaim@studiction.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#6c63ff]/80 rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-4 focus:ring-[#6c63ff]/10 outline-none transition-all duration-300" />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div variants={itemVariants} className="space-y-1">
          <div className="flex justify-between items-center px-1">
            <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">Password</label>
            {errors.password && <span className="text-rose-400 text-[11px] font-medium">{errors.password}</span>}
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#6c63ff] transition-colors duration-200">
              <Lock className="w-4 h-4" />
            </div>
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 pl-10 pr-11 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#6c63ff]/80 rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-4 focus:ring-[#6c63ff]/10 outline-none transition-all duration-300" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors duration-200">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Strength bar */}
          <div className="mt-2">
            <div className="flex gap-1.5 h-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 bg-[#02020a] rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    animate={{ width: strength.score >= i ? '100%' : '0%', backgroundColor: strength.score >= i ? strength.color : 'transparent' }}
                    transition={{ duration: 0.3 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] mt-1.5">
              <span className="text-zinc-600 font-medium">Password Strength</span>
              {password && <span style={{ color: strength.color }} className="font-bold uppercase tracking-wider">{strength.label}</span>}
            </div>
          </div>
        </motion.div>

        {/* Confirm Password */}
        <motion.div variants={itemVariants} className="space-y-1">
          <div className="flex justify-between items-center px-1">
            <label className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest">Confirm Password</label>
            {errors.confirmPassword && <span className="text-rose-400 text-[11px] font-medium">{errors.confirmPassword}</span>}
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#6c63ff] transition-colors duration-200">
              <Lock className="w-4 h-4" />
            </div>
            <input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 pl-10 pr-11 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#6c63ff]/80 rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-4 focus:ring-[#6c63ff]/10 outline-none transition-all duration-300" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors duration-200">
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div variants={itemVariants} className="pt-1 md:col-span-2">
          <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isSubmitting}
            className="w-full h-11 bg-gradient-to-r from-[#6c63ff] to-[#48cfad] rounded-xl text-white font-semibold tracking-wider uppercase text-[13px] shadow-[0_0_25px_rgba(108,99,255,0.22)] hover:shadow-[0_0_35px_rgba(108,99,255,0.45)] transition-all cursor-pointer flex items-center justify-center">
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="animate-spin h-5 w-5 text-white" />
                <span>PREPARING PORTAL...</span>
              </div>
            ) : 'BEGIN YOUR JOURNEY →'}
          </motion.button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div variants={itemVariants} className="relative flex py-3 items-center">
        <div className="flex-grow border-t border-[rgba(255,255,255,0.06)]" />
        <span className="flex-shrink mx-4 text-zinc-600 text-xs tracking-wider uppercase font-semibold">or continue with</span>
        <div className="flex-grow border-t border-[rgba(255,255,255,0.06)]" />
      </motion.div>

      {/* Social buttons */}
      <motion.div variants={itemVariants} className="flex justify-center gap-3 mb-3 relative z-10">

        {/* Google — functional */}
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="button"
          onClick={() => handleGoogleLogin()}
          className="h-10 flex items-center justify-center space-x-4 px-30 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[#0a0a1f]/90 rounded-xl transition-all duration-200 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" fill="#EA4335"/>
          </svg>
          <span className="text-[16px] font-bold text-zinc-300">Google</span>
        </motion.button>

        {/* Apple — not yet implemented */}
       {/* <motion.button
          whileHover={{ scale: 1.01 }} type="button" disabled
          className="h-10 flex items-center justify-center space-x-2 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] rounded-xl transition-all duration-200 opacity-40 cursor-not-allowed"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-300">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.11.09 2.24-.55 2.94-1.39z"/>
          </svg>
          <span className="text-[11px] font-bold text-zinc-300">Apple</span>
        </motion.button>*/}
      </motion.div>

      {/* Trust Badges */}
      <motion.div variants={itemVariants} className="flex justify-between items-center border-t border-[rgba(255,255,255,0.06)] mt-1 pt-2 md:mt-2 md:pt-3 relative z-10">
        {[
          { icon: Lock,   label: 'Free Forever' },
          { icon: Shield, label: '100% Private'  },
          { icon: Cpu,    label: 'AI Powered'    },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center space-x-1.5">
            <Icon className="w-3.5 h-3.5 text-[#48cfad]" />
            <span className="text-zinc-500 text-[11px] font-medium">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Switch to login */}
      <motion.div variants={itemVariants} className="text-center text-sm mt-3 relative z-10">
        <span className="text-zinc-500">Already on your path? </span>
        <button type="button" onClick={onGoToLogin}
          className="text-[#6c63ff] hover:text-[#8079ff] font-semibold hover:underline transition-all cursor-pointer ml-1">
          Login →
        </button>
      </motion.div>
    </motion.div>
  );
}