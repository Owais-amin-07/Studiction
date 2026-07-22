import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, Calendar, Target, Fingerprint, 
  Smartphone, Pencil, Lock, ArrowLeft, RefreshCw, LogOut,
  User, AtSign
} from 'lucide-react';

type UserData = {
  name:       string;
  email:      string;
  username:   string;
  joinedDate: string;
  goal?:      string;
};

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
  userData?: UserData | null;
  onUpdateUser?: (data: any) => void;
}


function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last  = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function LineCanvas() {

// Reusing the LineCanvas logic from the Auth pages for design consistency
// (LineCanvas implementation follows)
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    canvas.width  = parent?.offsetWidth  || 520;
    canvas.height = parent?.offsetHeight || 700;

    const W = canvas.width;
    const H = canvas.height;
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

    let time = 0;
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
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.2, line.color);
        grad.addColorStop(0.8, line.color);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = line.alpha;
        ctx.lineWidth = line.width;
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

export default function AccountModal({ isOpen, onClose, onLogout, userData, onUpdateUser }: AccountModalProps) {
  const [view, setView] = useState<'profile' | 'password' | 'edit'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  if (!isOpen) return null;

  const [profileData, setProfileData] = useState({
  name:       userData?.name       ?? 'User',
  username:   userData?.username   ?? '@user',
  email:      userData?.email      ?? '',
  joined:     userData?.joinedDate ?? 'Recently',
  goal: userData?.goal || 'Not set yet',
  id:         'STD-' + (userData?.email?.slice(0,4).toUpperCase() ?? '0000'),
  journey: {
    name:  'Digital Detox',
    phase: 'Phase 1 of 4 — Awareness',
    pill:  'PHASE 1',
  }
});

useEffect(() => {
  if (userData) {
    setProfileData(prev => ({
      ...prev,
      name:     userData.name,
      username: userData.username,
      email:    userData.email,
      joined:   userData.joinedDate,
      goal:     userData.goal || prev.goal,
      id:       'STD-' + userData.email.slice(0, 4).toUpperCase(),
    }));
  }
}, [userData]);

  const [editForm, setEditForm] = useState({
    name: profileData.name,
    username: profileData.username,
    email: profileData.email,
    goal: profileData.goal
  });

  const containerVariants: any = {
    hidden: { opacity: 0, y: 20, scale: 0.98, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
      transition: { type: 'spring' as const, stiffness: 85, damping: 15, staggerChildren: 0.08, delayChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const viewVariants = {
    hidden: { opacity: 0, x: -15, filter: 'blur(4px)' },
    visible: { 
      opacity: 1, x: 0, filter: 'blur(0px)',
      transition: { 
        type: 'spring' as const, stiffness: 100, damping: 20,
        staggerChildren: 0.06, delayChildren: 0.1 
      } 
    },
    exit: { opacity: 0, x: 15, filter: 'blur(4px)', transition: { duration: 0.2 } }
  };

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

  const strength = getPasswordStrength(passwordForm.new);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      onClose();
      window.location.href = '/';
    }
  };

  const handleEditClick = () => {
    setEditForm({
      name: profileData.name,
      username: profileData.username,
      email: profileData.email,
      goal: profileData.goal
    });
    setView('edit');
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setTimeout(() => {
    const updated = { ...profileData, ...editForm };
    setProfileData(updated);
    onUpdateUser?.({
      name:       editForm.name,
      email:      editForm.email,
      username:   editForm.username,
      joinedDate: profileData.joined,
      goal:       editForm.goal,
    });
    setIsSubmitting(false);
    setView('profile');
  }, 1500);
};

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-[490px] md:max-w-[700px] bg-[#04040e]/80 [backdrop-filter:blur(36px)_saturate(220%)] border border-[rgba(255,255,255,0.07)] rounded-[24px] p-3.5 md:p-5 shadow-[0_0_85px_rgba(108,99,255,0.11),0_25px_70px_rgba(0,0,0,0.85)] z-10 overflow-hidden"
    >
      {/* ── Background Suite (Exact match for Auth Cards) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <LineCanvas />
        
        {/* Ribbons */}
        <motion.div
          animate={{ y: [-6, 8, -6], rotate: [8, 12, 8], scale: [1, 1.04, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-15%] w-[240px] h-[220px] opacity-45"
        >
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <defs>
              <linearGradient id="accGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#6c63ff" stopOpacity="0.85" />
                <stop offset="60%"  stopColor="#a78bfa" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#48cfad" stopOpacity="0" />
              </linearGradient>
              <filter id="accGlow">
                <feGaussianBlur stdDeviation="20" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d="M50,100 Q150,50 300,180 T450,250 L400,450 Q250,300, 100,380 Z" fill="url(#accGrad1)" filter="url(#accGlow)" />
            <path d="M80,120 Q180,70 320,195 T470,260" fill="none" stroke="#48cfad" strokeWidth="5" strokeOpacity="0.7" filter="url(#accGlow)" />
          </svg>
        </motion.div>

        <motion.div
          animate={{ y: [6, -8, 6], rotate: [-20, -16, -20], scale: [1, 1.06, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[-10%] right-[-14%] w-[260px] h-[240px] opacity-40"
        >
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <defs>
              <linearGradient id="accGrad2" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="#48cfad" stopOpacity="0.9" />
                <stop offset="60%"  stopColor="#6c63ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M100,400 Q200,300 350,420 T480,350 L450,100 Q300,200 150,120 Z" fill="url(#accGrad2)" filter="url(#accGlow)" />
            <path d="M120,380 Q220,280 370,405 T490,340" fill="none" stroke="#6c63ff" strokeWidth="6" strokeOpacity="0.8" filter="url(#accGlow)" />
          </svg>
        </motion.div>

        {/* Scanning line */}
        <motion.div
          animate={{ y: ['-100%', '700%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#48cfad]/20 to-transparent pointer-events-none"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(108,99,255,0.06)_0%,rgba(0,0,0,0)_70%)] blur-2xl" />
      </div>

      {/* Top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.12)] to-transparent z-10" />

      {/* Close Button */}
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

      <div className="relative z-10">
        <AnimatePresence mode="wait">
        {view === 'profile' ? (
          <motion.div 
            key="profile-view"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-3 md:space-y-3.5 w-full"
          >
            {/* BLOCK 1: USER IDENTITY */}
            <div className="flex items-center gap-4 md:gap-5">
              <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                <motion.div 
                  className="absolute inset-0 rounded-full p-[2px]"
                  style={{ background: 'conic-gradient(#6c63ff, #48cfad, #a78bfa, #6c63ff)' }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#6c63ff] to-[#48cfad] flex items-center justify-center overflow-hidden">
                      <span className="text-white font-bold font-orbitron text-lg md:text-xl select-none">
                        {getInitials(profileData.name)}
                      </span>
                  </div>
                </motion.div>
              </div>
              <div className="space-y-1">
                <h2 className="text-white text-lg font-bold tracking-tight font-orbitron">{profileData.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[#48cfad] text-sm font-medium">{profileData.username}</span>
                  
                </div>
              </div>
            </div>

            {/* BLOCK 2: INFO CARDS GRID */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {[
                { icon: Mail, label: "EMAIL", value: profileData.email, color: "#48cfad" },
                { icon: Calendar, label: "MEMBER SINCE", value: profileData.joined, color: "#6c63ff" },
                { icon: Target, label: "PERSONAL GOAL", value: profileData.goal || 'Not set yet', color: "#a78bfa" },
                { icon: Fingerprint, label: "USER ID", value: profileData.id, color: "#48cfad", mono: true },
              ].map((item) => (
              <motion.div
                  key={item.label}
                  variants={itemVariants}
                  className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-2.5 md:px-5 md:py-2.5 space-y-1 hover:bg-white/[0.06] transition-colors duration-300"
              >
                  <item.icon size={16} style={{ color: item.color }} />
                  <div className="space-y-0.5">
                    <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-[2px] font-orbitron">
                      {item.label}
                    </p>
                    <p className={`text-white text-xs truncate ${item.mono ? 'font-orbitron text-[#48cfad]' : ''}`}>
                      {item.value}
                    </p>
                  </div>
              </motion.div>
              ))}
            </div>

            {/* BLOCK 3: ACTIVE JOURNEY */}
            <motion.div 
              variants={itemVariants}
              className="relative group bg-white/[0.04] border border-white/[0.07] border-l-4 rounded-2xl p-2.5 md:px-5 md:py-2.5 flex items-center justify-between transition-all duration-300"
              style={{ borderLeftColor: '#6c63ff' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#6c63ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#6c63ff]/20 flex items-center justify-center text-[#6c63ff]">
                  <Smartphone size={20} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[#48cfad]/60 text-[9px] font-bold uppercase tracking-widest font-orbitron">Active Journey</p>
                  <h3 className="text-base font-bold font-orbitron bg-gradient-to-r from-[#6c63ff] to-[#48cfad] bg-clip-text text-transparent">
                    {profileData.journey.name}
                  </h3>
                  <p className="text-zinc-500 text-xs font-light">{profileData.journey.phase}</p>
                </div>
              </div>

              <div className="px-3 py-1 rounded-lg bg-[#48cfad]/10 border border-[#48cfad]/20 text-[#48cfad] text-[10px] font-bold font-orbitron relative z-10">
                {profileData.journey.pill}
              </div>
            </motion.div>

            {/* BLOCK 4: ACTION BUTTONS */}
            <div className="flex gap-3 relative z-20">
              <motion.button 
                onClick={handleEditClick}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl text-zinc-300 text-xs font-bold hover:bg-white/[0.07] hover:text-white transition-all duration-300"
              >
                <Pencil size={14} />
                Edit Profile
              </motion.button>
              <motion.button 
                onClick={() => setView('password')}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl text-zinc-300 text-xs font-bold hover:bg-white/[0.07] hover:text-white transition-all duration-300"
              >
                <Lock size={14} />
                Security
              </motion.button>
            </div>

            {/* BLOCK 5: LOGOUT */}
            <div className="pt-1 md:pt-2 flex justify-center">
              <button 
                onClick={handleLogout}
                className="group flex items-center gap-2 text-zinc-500 text-sm transition-all duration-300"
              >
                Want to leave? 
                <span className="text-[#ff6b6b]/80 group-hover:text-[#ff6b6b] group-hover:underline transition-all duration-300 flex items-center gap-1 font-medium">
                  Sign out of Studiction <LogOut size={13} />
                </span>
              </button>
            </div>
          </motion.div>
        ) : view === 'password' ? (
          /* PASSWORD CHANGE VIEW */
          <motion.div 
            key="password-view"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-3.5 md:space-y-4 w-full"
          >
            {/* Centered Header to exactly match Auth Page visual weight */}
            <div className="flex flex-col items-center text-center mb-2 md:mb-3 relative z-10">
              <div className="relative mb-2 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-16 h-16 rounded-full border border-dashed border-[#48cfad]/25"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-12 h-12 rounded-full border border-[#6c63ff]/20 shadow-[0_0_15px_rgba(108,99,255,0.1)]"
                />
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.05 }}
                  className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#6c63ff] to-[#48cfad] flex items-center justify-center shadow-[0_4px_25px_rgba(108,99,255,0.25)] z-10 cursor-pointer"
                  onClick={() => setView('profile')}
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              <h1 className="text-white text-xl md:text-2xl font-light tracking-wide mb-0.5">
                System Security
              </h1>
              <p className="text-zinc-500 text-xs md:text-sm">
                Update your neural access keys
              </p>
            </div>

            <form className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-5 md:gap-y-4 relative z-10" onSubmit={(e) => {
              e.preventDefault();
              setIsSubmitting(true);
              setTimeout(() => { setIsSubmitting(false); setView('profile'); setPasswordForm({ current: '', new: '', confirm: '' }); }, 2000);
            }}>
              {/* Row 1: Spans full width */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-orbitron ml-1">Current Phrase</label>
                <input 
                  type="password" 
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-[#6c63ff]/50 focus:ring-4 focus:ring-[#6c63ff]/10 transition-all"
                />
              </div>

              {/* Row 2: Grouped inputs */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-orbitron ml-1">New Neural Key</label>
                <input 
                  type="password" 
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-[#6c63ff]/50 focus:ring-4 focus:ring-[#6c63ff]/10 transition-all"
                />
              </div>

              <div className="space-y-1 md:col-span-1">
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest font-orbitron ml-1">Confirm Key</label>
                <input 
                  type="password" 
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-[#6c63ff]/50 focus:ring-4 focus:ring-[#6c63ff]/10 transition-all"
                />
              </div>

              {/* Row 3: Strength Suite (Appears when filling) */}
              <div className="md:col-span-2 mt-2 px-1">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full"
                        animate={{ 
                          width: strength.score >= i ? '100%' : '0%',
                          backgroundColor: strength.score >= i ? strength.color : 'transparent' 
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  ))}
                </div>
                <AnimatePresence>
                  {passwordForm.new.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between text-[9px] mt-1.5 font-orbitron uppercase tracking-widest overflow-hidden"
                    >
                      <span className="text-zinc-600">Password Strength</span>
                      <span style={{ color: strength.color }} className="font-bold">
                        {strength.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                disabled={isSubmitting}
                className="w-full h-11 md:col-span-2 mt-4 bg-gradient-to-r from-[#6c63ff] to-[#48cfad] rounded-xl text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Updating Matrix...
                  </>
                ) : "Update Security Phrase"}
              </button>
            </form>
          </motion.div>
        ) : (
          /* EDIT PROFILE VIEW (Mimicking Signup Card) */
          <motion.div 
            key="edit-view"
            variants={viewVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-3.5 md:space-y-4 w-full"
          >
            <div className="flex flex-col items-center text-center mb-2 md:mb-3 relative z-10">
              <div className="relative mb-2 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-16 h-16 rounded-full border border-dashed border-[#6c63ff]/25"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-12 h-12 rounded-full border border-[#48cfad]/20 shadow-[0_0_15px_rgba(72,207,173,0.1)]"
                />
                <motion.div
                  whileHover={{ rotate: -10, scale: 1.05 }}
                  className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#48cfad] to-[#6c63ff] flex items-center justify-center shadow-[0_4px_25px_rgba(72,207,173,0.25)] z-10 cursor-pointer"
                  onClick={() => setView('profile')}
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              <h1 className="text-white text-xl md:text-2xl font-light tracking-wide mb-0.5 font-orbitron">
                Identity Matrix
              </h1>
              <p className="text-zinc-500 text-xs md:text-sm">
                Reconfigure your citizen credentials
              </p>
            </div>

            <form className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-5 md:gap-y-4 relative z-10" onSubmit={handleUpdateProfile}>
              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest font-orbitron ml-1 flex items-center gap-1.5">
                  <User size={10} className="text-[#6c63ff]" /> Full Designation
                </label>
                <input 
                  type="text" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Name"
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-[#6c63ff]/50 focus:ring-4 focus:ring-[#6c63ff]/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest font-orbitron ml-1 flex items-center gap-1.5">
                  <AtSign size={10} className="text-[#48cfad]" /> Cyber Alias
                </label>
                <input 
                  type="text" 
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  placeholder="@username"
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-[#48cfad]/50 focus:ring-4 focus:ring-[#48cfad]/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest font-orbitron ml-1 flex items-center gap-1.5">
                  <Mail size={10} className="text-[#a78bfa]" /> Communication Link
                </label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Email"
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-[#a78bfa]/50 focus:ring-4 focus:ring-[#a78bfa]/10 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest font-orbitron ml-1 flex items-center gap-1.5">
                  <Target size={10} className="text-[#6c63ff]" /> Personal Goal
                </label>
                <input 
                  type="text" 
                  value={editForm.goal}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  placeholder="e.g. Reduce screen time to 2hrs/day"
                  className="w-full h-11 bg-black/40 border border-white/5 rounded-xl px-4 text-white text-sm outline-none focus:border-[#6c63ff]/50 focus:ring-4 focus:ring-[#6c63ff]/10 transition-all"
                />
              </div>

              <button 
                disabled={isSubmitting}
                className="w-full h-11 md:col-span-2 mt-4 bg-gradient-to-r from-[#48cfad] to-[#6c63ff] rounded-xl text-white font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#48cfad]/20 flex items-center justify-center gap-2 transition-all hover:brightness-110"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Syncing Identity...
                  </>
                ) : "Re-Initialize Citizen Data"}
              </button>
            </form>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#48cfad]/30 to-transparent" />
    </motion.div>
  );
}