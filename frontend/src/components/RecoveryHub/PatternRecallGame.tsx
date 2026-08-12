import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Heart, MousePointerClick, Play, Puzzle, RotateCcw, Trophy,
} from 'lucide-react';

type Phase = 'idle' | 'watch' | 'repeat' | 'gameover';

const TILE_COLORS = [
  '#48cfad', '#a78bfa', '#fbbf24',
  '#38bdf8', '#f472b6', '#34d399',
  '#818cf8', '#fb923c', '#22d3ee',
];

const MAX_LIVES = 3;
const BEST_KEY = 'studiction-pattern-recall-best';

/** Round 1 → 3 tiles, Round 2 → 4 tiles, and so on (always growing). */
const seqLengthForRound = (round: number) => round + 2;

/** Builds a brand-new random pattern (no confusing double-flashes in a row). */
function buildSequence(length: number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    let next = Math.floor(Math.random() * 9);
    while (i > 0 && next === seq[i - 1]) {
      next = Math.floor(Math.random() * 9);
    }
    seq.push(next);
  }
  return seq;
}

function loadBest(): number {
  try { return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0; } catch { return 0; }
}
function saveBest(value: number) {
  try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode */ }
}

export default function PatternRecallGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(loadBest);
  const [lives, setLives] = useState(MAX_LIVES);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const timersRef = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  };
  useEffect(() => clearTimers, []);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    later(() => setNotice(null), 1400);
  };

  const playSequence = (seq: number[]) => {
    setPhase('watch');
    setInputIndex(0);
    const onTime = Math.max(340, 620 - seq.length * 25);
    const gap = onTime + 200;
    const start = 600;
    seq.forEach((tile, i) => {
      later(() => setActiveTile(tile), start + i * gap);
      later(() => setActiveTile(null), start + i * gap + onTime);
    });
    later(() => setPhase('repeat'), start + seq.length * gap);
  };

  const startGame = () => {
    clearTimers();
    const first = buildSequence(seqLengthForRound(1));
    setSequence(first);
    setRound(1);
    setScore(0);
    setLives(MAX_LIVES);
    setWrongTile(null);
    setActiveTile(null);
    setNotice(null);
    playSequence(first);
  };

  const handleTile = (i: number) => {
    if (phase !== 'repeat' || wrongTile !== null) return;

    // tap feedback
    setActiveTile(i);
    later(() => setActiveTile((t) => (t === i ? null : t)), 260);

    // ── correct tap ──
    if (sequence[inputIndex] === i) {
      const nextIndex = inputIndex + 1;
      if (nextIndex < sequence.length) {
        setInputIndex(nextIndex);
        return;
      }

      // round complete → NEW, LONGER pattern next
      const newScore = score + 1;
      const nextRound = round + 1;
      setScore(newScore);
      if (newScore > best) { setBest(newScore); saveBest(newScore); }
      setRound(nextRound);
      flashNotice(`Round complete — next: ${seqLengthForRound(nextRound)} tiles`);
      const nextSeq = buildSequence(seqLengthForRound(nextRound));
      setSequence(nextSeq);
      setPhase('watch');
      later(() => playSequence(nextSeq), 1000);
      return;
    }

    // ── wrong tap ──
    setWrongTile(i);
    later(() => setWrongTile(null), 550);
    const remaining = lives - 1;
    setLives(remaining);

    if (remaining <= 0) {
      later(() => setPhase('gameover'), 600);
      return;
    }

    // same round again: a fresh pattern of the same length
    flashNotice('Not quite — watch again');
    const retrySeq = buildSequence(seqLengthForRound(round));
    setSequence(retrySeq);
    setPhase('watch');
    later(() => playSequence(retrySeq), 900);
  };

  return (
    <div className="max-w-md mx-auto">
      {/* ── Header ── */}
      <div className="text-center mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
        >
          <Puzzle size={26} style={{ color: '#a78bfa' }} />
        </div>
        <h2 className="text-xl font-semibold text-white mb-1.5">Pattern Recall</h2>
        <p className="text-sm text-zinc-400">
          Every round shows a brand-new pattern with more steps. Watch carefully, then repeat it.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Round', value: String(round) },
          { label: 'Score', value: String(score) },
          { label: 'Best', value: String(best) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 text-center"
          >
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-semibold text-white tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Status bar ── */}
      <div className="h-9 mb-3 flex items-center justify-center gap-2">
        {notice ? (
          <span className="text-sm font-medium" style={{ color: '#48cfad' }}>{notice}</span>
        ) : phase === 'watch' ? (
          <>
            <Eye size={15} style={{ color: '#a78bfa' }} />
            <span className="text-sm text-zinc-400">
              Watch the pattern — {sequence.length} tiles
            </span>
          </>
        ) : phase === 'repeat' ? (
          <>
            <MousePointerClick size={15} style={{ color: '#48cfad' }} />
            <span className="text-sm text-zinc-400">Your turn — repeat the pattern</span>
            <span className="flex items-center gap-1 ml-2">
              {sequence.map((_, idx) => (
                <span
                  key={idx}
                  className="h-1.5 w-1.5 rounded-full transition-colors duration-200"
                  style={{ background: idx < inputIndex ? '#48cfad' : 'rgba(255,255,255,0.15)' }}
                />
              ))}
            </span>
          </>
        ) : (
          <span className="text-sm text-zinc-500">A calm exercise for working memory</span>
        )}
      </div>

      {/* ── Grid + overlays ── */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {TILE_COLORS.map((color, i) => {
            const isActive = activeTile === i;
            const isWrong = wrongTile === i;
            return (
              <motion.button
                key={i}
                type="button"
                aria-label={`Tile ${i + 1}`}
                onClick={() => handleTile(i)}
                animate={
                  isWrong
                    ? { x: [0, -6, 6, -4, 4, 0] }
                    : { scale: isActive ? 1.06 : 1 }
                }
                transition={{ duration: isWrong ? 0.45 : 0.18 }}
                className="aspect-square rounded-2xl border outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{
                  background: isWrong
                    ? 'rgba(248,113,113,0.25)'
                    : isActive ? `${color}38` : `${color}0d`,
                  borderColor: isWrong
                    ? 'rgba(248,113,113,0.6)'
                    : isActive ? `${color}99` : `${color}26`,
                  boxShadow: isActive ? `0 0 30px ${color}55` : 'none',
                  cursor: phase === 'repeat' ? 'pointer' : 'default',
                }}
              />
            );
          })}
        </div>

        <AnimatePresence>
          {/* ── Idle overlay ── */}
          {phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-3xl flex items-center justify-center backdrop-blur-md"
              style={{ background: 'rgba(19,19,25,0.85)' }}
            >
              <div className="text-center px-6">
                <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
                <div className="space-y-2 mb-6 text-sm text-zinc-400">
                  <p>1 · Watch a new pattern light up</p>
                  <p>2 · Tap the tiles in the same order</p>
                  <p>3 · Each round = new pattern + one more step</p>
                </div>
                <motion.button
                  onClick={startGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(167,139,250,0.35)]"
                  style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)' }}
                >
                  <Play size={16} /> Start Game
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Game over overlay ── */}
          {phase === 'gameover' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-3xl flex items-center justify-center backdrop-blur-md"
              style={{ background: 'rgba(19,19,25,0.88)' }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center px-6"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #38bdf8)',
                    boxShadow: '0 4px 24px rgba(167,139,250,0.35)',
                  }}
                >
                  <Trophy size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">Session complete</h3>
                <p className="text-sm text-zinc-400 mb-5">
                  Every round you remember strengthens your working memory.
                </p>

                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Score</p>
                    <p className="text-lg font-semibold text-white tabular-nums">{score}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Best</p>
                    <p className="text-lg font-semibold tabular-nums" style={{ color: '#a78bfa' }}>{best}</p>
                  </div>
                </div>

                <motion.button
                  onClick={startGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)' }}
                >
                  <RotateCcw size={16} /> Play Again
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Lives + restart ── */}
      <div className="flex items-center justify-between mt-5">
        <div className="flex items-center gap-1.5" aria-label={`${lives} lives remaining`}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i}
              size={16}
              style={{
                color: i < lives ? '#f472b6' : 'rgba(255,255,255,0.15)',
                fill: i < lives ? '#f472b6' : 'none',
              }}
            />
          ))}
        </div>

        {phase !== 'idle' && (
          <motion.button
            onClick={startGame}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <RotateCcw size={13} /> Restart
          </motion.button>
        )}
      </div>
    </div>
  );
}