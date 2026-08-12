import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, RotateCcw, Wind } from 'lucide-react';

interface BreathPhase {
  label: 'Inhale' | 'Hold' | 'Exhale';
  seconds: number;
  scale: number;
}

interface BreathPattern {
  id: string;
  name: string;
  ratio: string;
  benefit: string;
  phases: BreathPhase[];
}

const PATTERNS: BreathPattern[] = [
  {
    id: 'box', name: 'Box', ratio: '4·4·4·4', benefit: 'Focus',
    phases: [
      { label: 'Inhale', seconds: 4, scale: 1.4 },
      { label: 'Hold', seconds: 4, scale: 1.4 },
      { label: 'Exhale', seconds: 4, scale: 1 },
      { label: 'Hold', seconds: 4, scale: 1 },
    ],
  },
  {
    id: '478', name: '4-7-8', ratio: '4·7·8', benefit: 'Sleep',
    phases: [
      { label: 'Inhale', seconds: 4, scale: 1.4 },
      { label: 'Hold', seconds: 7, scale: 1.4 },
      { label: 'Exhale', seconds: 8, scale: 1 },
    ],
  },
  {
    id: 'coherent', name: 'Coherent', ratio: '5·5', benefit: 'Balance',
    phases: [
      { label: 'Inhale', seconds: 5, scale: 1.4 },
      { label: 'Exhale', seconds: 5, scale: 1 },
    ],
  },
];

const GUIDES: Record<string, string> = {
  Inhale: 'Breathe in slowly through your nose…',
  Hold: 'Hold softly — no strain…',
  Exhale: 'Let it go, slowly through your mouth…',
};

const AFFIRMATIONS = [
  'You are safe in this moment.',
  'Each slow breath tells your brain: we are okay.',
  'Slow breath out — slow mind down.',
  'Nothing to chase right now. Just this breath.',
  'With every exhale, release a little weight.',
];

function formatTime(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function BreathingExerciseView() {
  const [patternId, setPatternId] = useState('box');
  const pattern = useMemo(() => PATTERNS.find((p) => p.id === patternId)!, [patternId]);

  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PATTERNS[0].phases[0].seconds);
  const [cycles, setCycles] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  const phase = pattern.phases[phaseIndex];

  useEffect(() => {
    if (!isActive) return;
    const t = window.setInterval(() => {
      setSecondsLeft((s) => s - 1);
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || secondsLeft > 0) return;
    const next = (phaseIndex + 1) % pattern.phases.length;
    if (next === 0) setCycles((c) => c + 1);
    setPhaseIndex(next);
    setSecondsLeft(pattern.phases[next].seconds);
  }, [secondsLeft, isActive, phaseIndex, pattern]);

  const selectPattern = (id: string) => {
    const p = PATTERNS.find((x) => x.id === id)!;
    setPatternId(id);
    setIsActive(false);
    setPhaseIndex(0);
    setSecondsLeft(p.phases[0].seconds);
    setCycles(0);
    setSessionSeconds(0);
  };

  const reset = () => {
    setIsActive(false);
    setPhaseIndex(0);
    setSecondsLeft(pattern.phases[0].seconds);
    setCycles(0);
    setSessionSeconds(0);
  };

  return (
    <div>
      {/* ── Header + pattern chips (one row) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)' }}
          >
            <Wind size={18} style={{ color: '#f472b6' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Breathing Exercise</h2>
            <p className="text-[11px] text-zinc-500">A few calm minutes, wherever you are</p>
          </div>
        </div>

        {/* compact pattern chips */}
        <div className="flex gap-2 flex-wrap">
          {PATTERNS.map((p) => {
            const active = p.id === patternId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPattern(p.id)}
                className="rounded-full border px-3.5 py-1.5 text-[11px] font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={
                  active
                    ? { background: 'rgba(244,114,182,0.15)', borderColor: 'rgba(244,114,182,0.6)', color: '#f9a8d4' }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: '#a1a1aa' }
                }
              >
                {p.name} <span className="opacity-70">{p.ratio}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main card (compact) ── */}
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 backdrop-blur-md p-5 sm:p-6"
        style={{
          background: 'linear-gradient(160deg, rgba(244,114,182,0.07), rgba(167,139,250,0.04) 45%, rgba(255,255,255,0.02))',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* floating particles */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute rounded-full"
            style={{
              width: 4, height: 4,
              background: 'rgba(244,114,182,0.35)',
              left: `${12 + i * 19}%`,
              top: `${14 + (i % 3) * 30}%`,
            }}
            animate={{ y: [0, -12, 0], opacity: [0.15, 0.5, 0.15] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
          />
        ))}

        {/* phase pills */}
        <div className="relative flex items-center justify-center gap-1.5 flex-wrap mb-4">
          {pattern.phases.map((ph, i) => (
            <span
              key={i}
              className="rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-all duration-300"
              style={
                i === phaseIndex && isActive
                  ? { background: 'rgba(244,114,182,0.2)', borderColor: 'rgba(244,114,182,0.6)', color: '#f9a8d4' }
                  : { borderColor: 'rgba(255,255,255,0.1)', color: '#71717a' }
              }
            >
              {ph.label} {ph.seconds}s
            </span>
          ))}
        </div>

        {/* ── Orb (smaller) ── */}
        <div className="relative mx-auto h-44 w-44 sm:h-52 sm:w-52 flex items-center justify-center">
          {isActive && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: 'rgba(244,114,182,0.3)' }}
                animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: 'rgba(167,139,250,0.3)' }}
                animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeOut', delay: 2 }}
              />
            </>
          )}

          {isActive && (
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <span
                className="absolute left-1/2 top-0 -ml-1 h-1.5 w-1.5 rounded-full"
                style={{ background: '#f472b6', boxShadow: '0 0 10px #f472b6' }}
              />
            </motion.div>
          )}

          <motion.div
            className="absolute inset-4 rounded-full flex items-center justify-center"
            animate={{ scale: isActive ? phase.scale : 1 }}
            transition={{ duration: isActive ? phase.seconds : 0.6, ease: 'easeInOut' }}
            style={{
              background:
                'radial-gradient(circle at 35% 30%, rgba(244,114,182,0.45), rgba(167,139,250,0.25) 55%, rgba(19,19,25,0.2))',
              border: '1px solid rgba(244,114,182,0.4)',
              boxShadow: '0 0 50px rgba(244,114,182,0.25), inset 0 0 30px rgba(244,114,182,0.15)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={isActive ? `ph-${phaseIndex}` : 'idle'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-base font-semibold text-white"
                >
                  {isActive ? phase.label : 'Ready'}
                </motion.p>
              </AnimatePresence>
              {isActive && (
                <p className="text-2xl font-bold text-white/90 tabular-nums">
                  {Math.max(secondsLeft, 0)}
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* guide + affirmation */}
        <p className="relative mt-4 h-4 text-center text-xs text-zinc-400">
          {isActive ? GUIDES[phase.label] : 'Choose a pattern, press begin, and follow the orb.'}
        </p>
        <div className="relative mt-1 h-4 text-center">
          <AnimatePresence mode="wait">
            {cycles > 0 && (
              <motion.p
                key={cycles}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-[11px] italic text-zinc-500"
              >
                "{AFFIRMATIONS[cycles % AFFIRMATIONS.length]}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* stats + controls in ONE row */}
        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Cycles</p>
              <p className="text-xs font-semibold text-white tabular-nums">{cycles}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Time</p>
              <p className="text-xs font-semibold text-white tabular-nums">{formatTime(sessionSeconds)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-center">
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Pattern</p>
              <p className="text-xs font-semibold tabular-nums" style={{ color: '#f9a8d4' }}>{pattern.ratio}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => setIsActive((a) => !a)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold text-white shadow-[0_4px_20px_rgba(244,114,182,0.35)]"
              style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)' }}
            >
              {isActive ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              {isActive ? 'Pause' : 'Begin'}
            </motion.button>

            {(sessionSeconds > 0 || cycles > 0) && (
              <motion.button
                type="button"
                onClick={reset}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition-colors"
                aria-label="Reset session"
              >
                <RotateCcw size={14} />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-zinc-600">
        Slow breathing calms the nervous system in minutes — use it before sleep, exams, or cravings.
      </p>
    </div>
  );
}