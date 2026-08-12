import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CircleAlert, MousePointerClick, Timer, Trophy, Zap,
} from 'lucide-react';

type Phase = 'idle' | 'waiting' | 'go' | 'tooSoon' | 'result';

const BEST_KEY = 'studiction-reaction-best';

function loadBest(): number {
  try { return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0; } catch { return 0; }
}
function saveBest(value: number) {
  try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode */ }
}

function rating(ms: number): { label: string; color: string } {
  if (ms < 250) return { label: 'Lightning fast', color: '#48cfad' };
  if (ms < 320) return { label: 'Sharp reflexes', color: '#38bdf8' };
  if (ms < 420) return { label: 'Good pace', color: '#a78bfa' };
  if (ms < 550) return { label: 'Steady', color: '#fbbf24' };
  return { label: 'Warming up', color: '#fb923c' };
}

export default function ReactionTestGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [lastTime, setLastTime] = useState(0);
  const [best, setBest] = useState(loadBest);
  const [attempts, setAttempts] = useState<number[]>([]);

  const timeoutRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  const beginRound = () => {
    setPhase('waiting');
    const delay = 1500 + Math.random() * 3000; // 1.5s – 4.5s suspense
    timeoutRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase('go');
    }, delay);
  };

  const handleTap = () => {
    if (phase === 'idle' || phase === 'tooSoon' || phase === 'result') {
      beginRound();
      return;
    }
    if (phase === 'waiting') {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      setPhase('tooSoon');
      return;
    }
    // phase === 'go'
    const ms = Math.round(performance.now() - startRef.current);
    setLastTime(ms);
    setAttempts((prev) => [...prev, ms]);
    if (!best || ms < best) { setBest(ms); saveBest(ms); }
    setPhase('result');
  };

  const average = attempts.length
    ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
    : 0;

  // ── per-phase visuals ──
  const visuals = {
    idle: {
      bg: 'rgba(255,255,255,0.04)',
      border: 'rgba(255,255,255,0.12)',
      glow: 'none',
    },
    waiting: {
      bg: 'rgba(251,191,36,0.10)',
      border: 'rgba(251,191,36,0.35)',
      glow: '0 0 40px rgba(251,191,36,0.12)',
    },
    go: {
      bg: 'rgba(72,207,173,0.28)',
      border: '#48cfad',
      glow: '0 0 70px rgba(72,207,173,0.45)',
    },
    tooSoon: {
      bg: 'rgba(251,113,133,0.12)',
      border: 'rgba(251,113,133,0.45)',
      glow: '0 0 40px rgba(251,113,133,0.15)',
    },
    result: {
      bg: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.15)',
      glow: '0 0 40px rgba(56,189,248,0.12)',
    },
  }[phase];

  return (
    <div className="max-w-md mx-auto">
      {/* ── Header ── */}
      <div className="text-center mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}
        >
          <Zap size={26} style={{ color: '#fbbf24' }} />
        </div>
        <h2 className="text-xl font-semibold text-white mb-1.5">Reaction Test</h2>
        <p className="text-sm text-zinc-400">
          Wait for the zone to turn green, then tap as fast as you can.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Best', value: best ? `${best} ms` : '—', color: '#fbbf24' },
          { label: 'Average', value: average ? `${average} ms` : '—', color: undefined },
          { label: 'Attempts', value: String(attempts.length), color: undefined },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 text-center"
          >
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: s.color ?? '#ffffff' }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tap zone ── */}
      <motion.button
        type="button"
        onClick={handleTap}
        aria-label="Reaction test zone"
        whileTap={{ scale: 0.98 }}
        className="relative w-full h-64 sm:h-72 rounded-3xl border backdrop-blur-md overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-colors duration-200"
        style={{ background: visuals.bg, borderColor: visuals.border, boxShadow: visuals.glow }}
      >
        <motion.div
          key={phase}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center"
        >
          {phase === 'idle' && (
            <>
              <MousePointerClick size={30} style={{ color: '#fbbf24' }} />
              <p className="text-lg font-semibold text-white">Tap to start</p>
              <p className="text-sm text-zinc-400">
                When the zone turns green, tap it as fast as you can.
              </p>
            </>
          )}

          {phase === 'waiting' && (
            <>
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <Timer size={30} style={{ color: '#fbbf24' }} />
              </motion.span>
              <p className="text-lg font-semibold text-white">Wait for green…</p>
              <p className="text-sm text-zinc-400">Don't tap yet</p>
            </>
          )}

          {phase === 'go' && (
            <>
              <Zap size={34} style={{ color: '#48cfad' }} />
              <p className="text-2xl font-bold tracking-tight" style={{ color: '#48cfad' }}>
                TAP NOW!
              </p>
            </>
          )}

          {phase === 'tooSoon' && (
            <>
              <CircleAlert size={30} style={{ color: '#fb7185' }} />
              <p className="text-lg font-semibold text-white">Too soon!</p>
              <p className="text-sm text-zinc-400">Tap to try again</p>
            </>
          )}

          {phase === 'result' && (
            <>
              <p className="text-5xl font-bold tabular-nums tracking-tight text-white">
                {lastTime}
                <span className="text-xl font-medium text-zinc-400 ml-1">ms</span>
              </p>
              <p className="text-sm font-semibold" style={{ color: rating(lastTime).color }}>
                {rating(lastTime).label}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Tap to go again</p>
            </>
          )}
        </motion.div>
      </motion.button>

      {/* ── Recent attempts ── */}
      <div className="mt-4 min-h-[28px] flex items-center justify-center gap-2 flex-wrap">
        {attempts.slice(-5).map((ms, i) => (
          <motion.span
            key={`${ms}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border px-3 py-1 text-[11px] font-medium tabular-nums"
            style={{
              color: rating(ms).color,
              borderColor: `${rating(ms).color}40`,
              background: `${rating(ms).color}14`,
            }}
          >
            {ms} ms
          </motion.span>
        ))}
      </div>

      {/* ── Best badge + fun fact ── */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
        {best > 0 && (
          <span className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
            <Trophy size={12} /> Personal best: {best} ms
          </span>
        )}
        <span className="hidden sm:inline text-zinc-600">·</span>
        <span>Average human reaction time is ~273 ms</span>
      </div>
    </div>
  );
}