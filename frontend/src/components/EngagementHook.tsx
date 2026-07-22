import { useState, useRef, useEffect, useMemo, memo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BrainScene from '../components/Brain/BrainScene';

const orbData = [
  { id: 'overwhelmed', label: 'Overwhelmed', color: 'from-blue-900 to-indigo-600',    hex: '#4f46e5', quote: "Focus on the next smallest step. The mountain is climbed one stone at a time." },
  { id: 'numb',        label: 'Numb',        color: 'from-slate-700 to-zinc-600',     hex: '#71717a', quote: "Awareness is the first light in the dark. You are feeling this space right now." },
  { id: 'distracted',  label: 'Distracted',  color: 'from-emerald-800 to-teal-500',  hex: '#14b8a6', quote: "Your attention is your most valuable asset. Bring it back, gently." },
  { id: 'anxious',     label: 'Anxious',     color: 'from-amber-900 to-orange-600',  hex: '#ea580c', quote: "Breathe into the tension. It is just energy waiting to be released." },
  { id: 'hopeful',     label: 'Hopeful',     color: 'from-purple-900 to-purple-500', hex: '#a855f7', quote: "Hope is the first step. You are already on your way." },
  { id: 'tired',       label: 'Tired',       color: 'from-gray-800 to-gray-600',     hex: '#6b7280', quote: "Rest is not giving up. It is gathering strength for what comes next." },
];

const SIZE   = 520;
const CX     = SIZE / 2;
const CY     = SIZE / 2;
const RADIUS = 200;

// Static — computed once at module load, never recalculated
const bubblePositions = orbData.map((_, i) => {
  const angle = (i / orbData.length) * 2 * Math.PI - Math.PI / 2;
  return { x: CX + RADIUS * Math.cos(angle), y: CY + RADIUS * Math.sin(angle) };
});

const RING_SCALE_STYLE = `
  :root { --ring-scale: 0.52; }
  @media (min-width: 480px)  { :root { --ring-scale: 0.65; } }
  @media (min-width: 640px)  { :root { --ring-scale: 0.78; } }
  @media (min-width: 768px)  { :root { --ring-scale: 0.88; } }
  @media (min-width: 1024px) { :root { --ring-scale: 1.00; } }
`;

// ──────────────────────────────────────────────────────────────
// Memoized orb button — only this orb re-renders when its own
// isActive prop flips, not all 6 whenever activeId changes.
// ──────────────────────────────────────────────────────────────
type Orb = typeof orbData[0];

const OrbButton = memo(function OrbButton({
  orb, pos, isActive, size, fontSize, bounceHeight, bounceDuration, onClick,
}: {
  orb: Orb;
  pos: { x: number; y: number };
  isActive: boolean;
  size: number;
  fontSize: number;
  bounceHeight: number;
  bounceDuration: number;
  onClick: () => void;
}) {
  return (
    <div style={{ position: 'absolute', left: `${pos.x}px`, top: `${pos.y}px`, transform: 'translate(-50%, -50%)', zIndex: 3 }}>
      <motion.button
        onClick={onClick}
        animate={{ y: [0, bounceHeight, 0] }}
        transition={{ duration: bounceDuration, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.93 }}
        style={{ outline: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <motion.div
          animate={{
            boxShadow: isActive ? `0 0 0 2px ${orb.hex}99, 0 0 28px ${orb.hex}66` : '0 0 0 0px transparent',
            scale:     isActive ? 1.1 : 1,
          }}
          transition={{ duration: 0.35 }}
          className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${orb.color}`}
          style={{
            width: `${size}px`, height: `${size}px`,
            border: isActive ? `1.5px solid ${orb.hex}` : '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ background: `radial-gradient(circle, ${orb.hex}55 0%, transparent 70%)` }}
            />
          )}
          <span
            className="text-white font-semibold text-center relative z-10 leading-tight"
            style={{ fontSize: `${fontSize}px`, padding: '0 4px' }}
          >
            {orb.label}
          </span>
        </motion.div>
      </motion.button>
    </div>
  );
});

export default function EngagementHook() {
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [isMobile, setIsMobile]     = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [mobileScale, setMobileScale] = useState(0.52);
  const soundRef = useRef<HTMLAudioElement | null>(null);

  // Single resize listener drives both isMobile and mobileScale
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      if      (w >= 1024) setMobileScale(1.00);
      else if (w >= 768)  setMobileScale(0.88);
      else if (w >= 640)  setMobileScale(0.78);
      else if (w >= 480)  setMobileScale(0.65);
      else                setMobileScale(0.52);
    };
    compute();
    window.addEventListener('resize', compute, { passive: true });
    return () => window.removeEventListener('resize', compute);
  }, []);

  useEffect(() => {
    soundRef.current = new Audio('/sounds/brain-chime.mp3');
    soundRef.current.volume = 0.45;
    return () => {
      soundRef.current?.pause();
      soundRef.current = null;
    };
  }, []);



  const [brainReady, setBrainReady] = useState(false);

useEffect(() => {
  const id = 'requestIdleCallback' in window
    ? requestIdleCallback(() => setBrainReady(true))
    : setTimeout(() => setBrainReady(true), 200);
  return () => {
    if ('cancelIdleCallback' in window) cancelIdleCallback(id as number);
    else clearTimeout(id as unknown as number);
  };
}, []);




  const playBubbleSound = () => {``
    if (!soundRef.current) return;
    soundRef.current.currentTime = 0;
    soundRef.current.play().catch(() => {});
  };

  const handleOrbClick = (orb: Orb) => {
    if (activeId === orb.id) { setActiveId(null); return; }
    playBubbleSound();
    setActiveId(orb.id);
  };

  const activeOrb = orbData.find(o => o.id === activeId);

  // Only recalculates when mobileScale actually changes
  const { mViz, mCX, mCY, mOrbSize, mBrainSize, mobileBubblePositions } = useMemo(() => {
    const mViz     = SIZE * mobileScale;
    const mCX      = mViz / 2;
    const mCY      = mViz / 2;
    const mRadius  = RADIUS * mobileScale;
    const mOrbSize = Math.round(110 * mobileScale);
    const mBrainSize = Math.round(264 * mobileScale);
    const mobileBubblePositions = orbData.map((_, i) => {
      const angle = (i / orbData.length) * 2 * Math.PI - Math.PI / 2;
      return { x: mCX + mRadius * Math.cos(angle), y: mCY + mRadius * Math.sin(angle) };
    });
    return { mViz, mCX, mCY, mOrbSize, mBrainSize, mobileBubblePositions };
  }, [mobileScale]);

  return (
    <section
      id="mind"
      className="relative w-full md:min-h-screen flex flex-col items-center md:justify-center justify-start pt-8 overflow-hidden z-10"
      style={{ scrollMarginTop: '25px' }}
    >
      <style>{RING_SCALE_STYLE}</style>

      {isMobile ? (
        <>
          {/* ══════════════ MOBILE TITLE ══════════════ */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="text-center mb-6 px-6"
          >
            <div className="flex flex-col items-center gap-1">
              <motion.span
                animate={{ opacity: [0.26, 0.34, 0.26] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'block', fontSize: 'clamp(1.9rem, 7vw, 3rem)', fontWeight: 500, color: 'rgba(255,255,255,0.81)', filter: 'blur(1.5px)', letterSpacing: '0.08em', lineHeight: 1.1 }}
              >
                How are you
              </motion.span>
              <motion.span
                animate={{ opacity: [0.44, 0.56, 0.44] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'block', fontSize: 'clamp(2rem, 7vw, 2.4rem)', fontWeight: 350, color: 'rgba(255,255,255,0.95)', filter: 'blur(0.6px)', letterSpacing: '0.04em', lineHeight: 1.1 }}
              >
                Feeling right now?
              </motion.span>
            </div>
            <motion.p
              animate={{ opacity: activeId ? 0 : 1 }}
              transition={{ duration: 0.3 }}
              className="mt-2 text-zinc-500 text-sm italic"
            >
              Click an orb to receive your reflection
            </motion.p>
          </motion.div>

          {/* ══════════════ MOBILE BRAIN ══════════════ */}
          <div className="w-full flex justify-center">
            <div style={{ position: 'relative', width: `${mViz}px`, height: `${mViz}px` }}>

              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                <AnimatePresence>
                  {activeId && (() => {
                    const idx = orbData.findIndex(o => o.id === activeId);
                    const pos = mobileBubblePositions[idx];
                    const orb = orbData[idx];
                    return (
                      <motion.line
                        key={activeId + '-beam-m'}
                        x1={mCX} y1={mCY} x2={pos.x} y2={pos.y}
                        stroke={orb.hex} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 6"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    );
                  })()}
                </AnimatePresence>
              </svg>

              <div style={{ position: 'absolute', width: `${mBrainSize}px`, height: `${mBrainSize}px`, top: `${mCY}px`, left: `${mCX}px`, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                <motion.div
                  animate={{ opacity: activeOrb ? 0.38 : 1, scale: activeOrb ? 1.05 : 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                  {brainReady && (
                      <Suspense fallback={null}>
                        <BrainScene />
                      </Suspense>
                  )}
                </motion.div>

                <AnimatePresence mode="wait">
                  {activeOrb && (
                    <motion.div
                      key={activeOrb.id + '-m'}
                      initial={{ opacity: 0, scale: 0.9, filter: 'blur(16px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.9, filter: 'blur(16px)' }}
                      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                      onClick={() => setActiveId(null)}
                      style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        cursor: 'pointer', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '14px', textAlign: 'center',
                        background: 'rgba(255,255,255,0)',
                        backdropFilter: 'blur(5px) saturate(200%) brightness(1.15)',
                        WebkitBackdropFilter: 'blur(10px) saturate(200%) brightness(1.15)',
                        border: '1px solid rgba(255,255,255,0.22)',
                        boxShadow: `inset 0 2px 4px rgba(255,255,255,0.18), 0 0 50px ${activeOrb.hex}35, 0 20px 60px rgba(0,0,0,0.6)`,
                      }}
                    >
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '8px', color: activeOrb.hex, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '6px' }}>
                          {activeOrb.label}
                        </span>
                        <div style={{ width: '20px', height: '1px', background: `linear-gradient(90deg, transparent, ${activeOrb.hex}, transparent)`, marginBottom: '6px' }} />
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 500, margin: 0 }}>
                          "{activeOrb.quote}"
                        </p>
                        <span style={{ marginTop: '8px', fontSize: '7px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                          tap to dismiss
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {orbData.map((orb, index) => (
                <OrbButton
                  key={orb.id + '-m'}
                  orb={orb}
                  pos={mobileBubblePositions[index]}
                  isActive={activeId === orb.id}
                  size={mOrbSize}
                  fontSize={Math.max(8, Math.round(11 * mobileScale))}
                  bounceHeight={-6}
                  bounceDuration={3 + index * 0.4}
                  onClick={() => handleOrbClick(orb)}
                />
              ))}

            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center w-full max-w-[1400px] px-8 lg:px-20 gap-0 ml-30">

          {/* ── LEFT: stacked two-line depth text ── */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 flex flex-col items-start justify-center gap-2 pr-4"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
              animate={{ opacity: [0.26, 0.34, 0.26] }}
              style={{ display: 'block', fontSize: 'clamp(2rem, 3.8vw, 4.2rem)', fontWeight: 350, color: 'rgba(255, 255, 255, 0.81)', filter: 'blur(2.8px)', letterSpacing: '0.08em', lineHeight: 1.1, textAlign: 'left' }}
            >
              How are you
            </motion.span>

            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
              animate={{ opacity: [0.44, 0.56, 0.44] }}
              style={{ display: 'block', fontSize: 'clamp(2.4rem, 4.1vw, 5rem)', fontWeight: 350, color: 'rgba(255, 255, 255, 0.95)', filter: 'blur(0.6px)', letterSpacing: '0.04em', lineHeight: 1.1, textAlign: 'left' }}
            >
              Feeling right now?
            </motion.span>

            <motion.span
              animate={{ opacity: activeId ? 0 : 0.35 }}
              transition={{ duration: 0.4 }}
              style={{ display: 'block', marginTop: '16px', fontSize: '0.7rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', filter: 'blur(0px)' }}
            >
              Click an orb to receive your reflection
            </motion.span>
          </motion.div>

          {/* ── RIGHT: Brain + Orbs ── */}
          <div className="flex-shrink-0 flex flex-col items-center mr-25">
            <div
              className="flex items-center justify-center overflow-visible"
              style={{ width: `${SIZE}px`, height: `${SIZE}px`, transform: 'scale(var(--ring-scale, 1))', transformOrigin: 'center center' }}
            >
              <div style={{ position: 'relative', width: `${SIZE}px`, height: `${SIZE}px`, flexShrink: 0 }}>

                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                  <AnimatePresence>
                    {activeId && (() => {
                      const idx = orbData.findIndex(o => o.id === activeId);
                      const pos = bubblePositions[idx];
                      const orb = orbData[idx];
                      return (
                        <motion.line
                          key={activeId + '-beam'}
                          x1={CX} y1={CY} x2={pos.x} y2={pos.y}
                          stroke={orb.hex} strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 6"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                        />
                      );
                    })()}
                  </AnimatePresence>
                </svg>

                <div style={{ position: 'absolute', width: '264px', height: '264px', top: `${CY}px`, left: `${CX}px`, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
                  <motion.div
                      animate={{ opacity: activeOrb ? 0.38 : 1, scale: activeOrb ? 1.05 : 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                    >
                      {brainReady && (
                        <Suspense fallback={null}>
                          <BrainScene />
                        </Suspense>
                      )}
                    </motion.div>

                  <AnimatePresence mode="wait">
                    {activeOrb && (
                      <motion.div
                        key={activeOrb.id}
                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(16px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(16px)' }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        onClick={() => setActiveId(null)}
                        style={{
                          position: 'absolute', inset: 0, borderRadius: '50%',
                          cursor: 'pointer', overflow: 'hidden',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          padding: '32px', textAlign: 'center',
                          background: 'rgba(255,255,255,0)',
                          backdropFilter: 'blur(5px) saturate(200%) brightness(1.15)',
                          WebkitBackdropFilter: 'blur(10px) saturate(200%) brightness(1.15)',
                          border: '1px solid rgba(255,255,255,0.22)',
                          boxShadow: `
                            inset 0 2px 4px rgba(255,255,255,0.18),
                            inset 0 -1px 2px rgba(255,255,255,0.06),
                            inset 2px 0 4px rgba(255,255,255,0.08),
                            inset -2px 0 4px rgba(0,0,0,0.12),
                            0 0 0 1px ${activeOrb.hex}30,
                            0 0 50px ${activeOrb.hex}35,
                            0 0 100px ${activeOrb.hex}18,
                            0 20px 60px rgba(0,0,0,0.6)
                          `,
                        }}
                      >
                        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '65%', height: '45%', borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)', transform: 'rotate(-20deg)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: '12%', left: '18%', width: '18%', height: '10%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.21) 0%, transparent 70%)', filter: 'blur(2px)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: '14%', left: '24%', width: '6%', height: '4%', borderRadius: '50%', background: 'rgba(255,255,255,0.39)', filter: 'blur(1px)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', bottom: '-8%', right: '-8%', width: '50%', height: '40%', borderRadius: '50%', background: `radial-gradient(ellipse, ${activeOrb.hex}20 0%, rgba(255,255,255,0.04) 40%, transparent 70%)`, transform: 'rotate(15deg)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: '20%', left: 0, width: '6px', height: '45%', borderRadius: '0 4px 4px 0', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.25), transparent)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: '25%', right: 0, width: '5px', height: '35%', borderRadius: '4px 0 0 4px', background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.2), transparent)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', inset: '5px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', inset: '20%', borderRadius: '50%', background: `radial-gradient(circle, ${activeOrb.hex}15 0%, transparent 70%)`, pointerEvents: 'none' }} />

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                            <motion.div
                              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              style={{ width: '5px', height: '5px', borderRadius: '50%', background: activeOrb.hex, boxShadow: `0 0 8px ${activeOrb.hex}, 0 0 16px ${activeOrb.hex}80` }}
                            />
                            <span style={{ fontSize: '9px', color: activeOrb.hex, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', textShadow: `0 0 12px ${activeOrb.hex}` }}>
                              {activeOrb.label}
                            </span>
                          </div>
                          <div style={{ width: '28px', height: '1px', background: `linear-gradient(90deg, transparent, ${activeOrb.hex}, transparent)`, boxShadow: `0 0 10px ${activeOrb.hex}, 0 0 20px ${activeOrb.hex}80`, marginBottom: '10px' }} />
                          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.75, fontStyle: 'italic', fontWeight: 500, margin: 0, textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                            "{activeOrb.quote}"
                          </p>
                          <span style={{ marginTop: '12px', fontSize: '8px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                            tap to dismiss
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {orbData.map((orb, index) => (
                  <OrbButton
                    key={orb.id}
                    orb={orb}
                    pos={bubblePositions[index]}
                    isActive={activeId === orb.id}
                    size={80}
                    fontSize={11}
                    bounceHeight={-8}
                    bounceDuration={3 + index * 0.4}
                    onClick={() => handleOrbClick(orb)}
                  />
                ))}

              </div>
            </div>
          </div>

        </div>
      )}
    </section>
  );
}