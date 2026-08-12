import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Heart, Palette, Play, RotateCcw, Trophy } from 'lucide-react';

type Phase = 'idle' | 'playing' | 'gameover';
type Feedback = 'correct' | 'wrong' | 'timeout' | null;

const COLORS = [
  { id: 'green', label: 'Green', hex: '#48cfad' },
  { id: 'blue', label: 'Blue', hex: '#38bdf8' },
  { id: 'red', label: 'Red', hex: '#fb7185' },
  { id: 'yellow', label: 'Yellow', hex: '#fbbf24' },
];

const MAX_LIVES = 3;
const BEST_KEY = 'studiction-stroop-best';

interface Question {
  word: string;
  ink: string;
}

function generateQuestion(): Question {
  const word = COLORS[Math.floor(Math.random() * 4)];
  let ink = COLORS[Math.floor(Math.random() * 4)];
  // 75% of rounds: word and ink differ (the real challenge)
  if (Math.random() < 0.75) {
    while (ink.id === word.id) ink = COLORS[Math.floor(Math.random() * 4)];
  }
  return { word: word.id, ink: ink.id };
}

function loadBest(): number {
  try { return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0; } catch { return 0; }
}
function saveBest(value: number) {
  try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode */ }
}

const colorOf = (id: string) => COLORS.find((c) => c.id === id)!;

export default function StroopFocusGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [question, setQuestion] = useState<Question>(() => generateQuestion());
  const [questionId, setQuestionId] = useState(0);
  const [questionTime, setQuestionTime] = useState(6000);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(loadBest);
  const [lives, setLives] = useState(MAX_LIVES);
  const [attempts, setAttempts] = useState(0);

  const questionRef = useRef(question);
  const answeredRef = useRef(false);
  const questionTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (questionTimer.current !== null) window.clearTimeout(questionTimer.current);
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
  }, []);

  const beginQuestion = (currentScore: number) => {
    const q = generateQuestion();
    questionRef.current = q;
    answeredRef.current = false;
    setQuestion(q);
    setQuestionId((id) => id + 1);
    setFeedback(null);
    setWrongPick(null);
    const t = Math.max(3000, 6000 - currentScore * 120); // speeds up as you score
    setQuestionTime(t);
    questionTimer.current = window.setTimeout(() => resolveAnswer(null), t);
  };

  const startGame = () => {
    if (questionTimer.current !== null) window.clearTimeout(questionTimer.current);
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    setScore(0);
    setStreak(0);
    setLives(MAX_LIVES);
    setAttempts(0);
    setPhase('playing');
    beginQuestion(0);
  };

  const resolveAnswer = (colorId: string | null) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    if (questionTimer.current !== null) window.clearTimeout(questionTimer.current);

    const correct = colorId !== null && colorId === questionRef.current.ink;
    setAttempts((a) => a + 1);

    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      setStreak((s) => s + 1);
      if (newScore > best) { setBest(newScore); saveBest(newScore); }
      setFeedback('correct');
      feedbackTimer.current = window.setTimeout(() => beginQuestion(newScore), 650);
    } else {
      setStreak(0);
      const remaining = lives - 1;
      setLives(remaining);
      setWrongPick(colorId);
      setFeedback(colorId === null ? 'timeout' : 'wrong');
      feedbackTimer.current = window.setTimeout(() => {
        if (remaining <= 0) setPhase('gameover');
        else beginQuestion(score);
      }, 900);
    }
  };

  const handlePick = (colorId: string) => {
    if (phase !== 'playing') return;
    resolveAnswer(colorId);
  };

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
  const inkHex = colorOf(question.ink).hex;

  return (
    <div className="max-w-md mx-auto">
      {/* ── Header ── */}
      <div className="text-center mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(251,113,133,0.15)', border: '1px solid rgba(251,113,133,0.3)' }}
        >
          <Palette size={26} style={{ color: '#fb7185' }} />
        </div>
        <h2 className="text-xl font-semibold text-white mb-1.5">Stroop Focus</h2>
        <p className="text-sm text-zinc-400">
          Tap the <span className="font-semibold text-white">ink color</span> — not the word you read.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Score</p>
          <p className="text-sm font-semibold text-white tabular-nums">{score}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Streak</p>
          <p className="text-sm font-semibold tabular-nums flex items-center justify-center gap-1">
            <Flame size={12} style={{ color: streak > 1 ? '#fb923c' : 'rgba(255,255,255,0.25)' }} />
            {streak}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Best</p>
          <p className="text-sm font-semibold tabular-nums" style={{ color: '#fb7185' }}>{best}</p>
        </div>
      </div>

      {/* ── Word card ── */}
      <div className="relative mb-3">
        <div className="h-36 sm:h-40 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center overflow-hidden">
          <motion.span
            key={questionId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: feedback === 'wrong' || feedback === 'timeout' ? [0, -8, 8, -5, 5, 0] : 0,
            }}
            transition={{ duration: 0.4 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-widest uppercase select-none"
            style={{ color: inkHex, textShadow: `0 0 30px ${inkHex}66` }}
          >
            {colorOf(question.word).label}
          </motion.span>
        </div>

        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-4 text-sm font-bold"
              style={{ color: '#48cfad' }}
            >
              +1
            </motion.span>
          )}
          {feedback === 'timeout' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-4 text-xs font-medium text-zinc-400"
            >
              Too slow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Timer bar ── */}
      <div className="h-1.5 mb-4 rounded-full bg-white/5 overflow-hidden">
        {phase === 'playing' && !feedback && (
          <motion.div
            key={questionId}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: questionTime / 1000, ease: 'linear' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #fb7185, #fbbf24)' }}
          />
        )}
      </div>

      {/* ── Answer buttons ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {COLORS.map((c) => {
          const isCorrectBtn = feedback !== null && c.id === question.ink;
          const isWrongBtn = feedback !== null && wrongPick === c.id;
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => handlePick(c.id)}
              whileHover={phase === 'playing' && !feedback ? { y: -2 } : undefined}
              whileTap={phase === 'playing' && !feedback ? { scale: 0.96 } : undefined}
              className="flex items-center justify-center gap-2.5 rounded-2xl border p-3.5 text-sm font-semibold text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{
                background: isCorrectBtn
                  ? `${c.hex}22`
                  : isWrongBtn ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: isCorrectBtn
                  ? `${c.hex}99`
                  : isWrongBtn ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.1)',
                boxShadow: isCorrectBtn ? `0 0 24px ${c.hex}44` : 'none',
              }}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: c.hex }} />
              {c.label}
            </motion.button>
          );
        })}
      </div>

      {/* ── Lives + hint ── */}
      <div className="flex items-center justify-between mt-5">
        <div className="flex items-center gap-1.5" aria-label={`${lives} lives remaining`}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i}
              size={16}
              style={{
                color: i < lives ? '#fb7185' : 'rgba(255,255,255,0.15)',
                fill: i < lives ? '#fb7185' : 'none',
              }}
            />
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">See the color · Forget the word</p>
      </div>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 rounded-none flex items-center justify-center backdrop-blur-md p-4"
            style={{ background: 'rgba(19,19,25,0.85)' }}
          >
            <div className="text-center px-6 max-w-sm">
              <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
              <div className="space-y-2 mb-6 text-sm text-zinc-400">
                <p>1 · A color word appears on screen</p>
                <p>2 · Tap the color of the <span className="text-white font-medium">ink</span>, not the word</p>
                <p>3 · Beat the timer — it gets faster as you score</p>
              </div>
              <motion.button
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(251,113,133,0.35)]"
                style={{ background: 'linear-gradient(135deg, #fb7185 0%, #fbbf24 100%)' }}
              >
                <Play size={16} /> Start Game
              </motion.button>
            </div>
          </motion.div>
        )}

        {phase === 'gameover' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4"
            style={{ background: 'rgba(19,19,25,0.88)' }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center px-6 max-w-sm w-full"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(135deg, #fb7185, #fbbf24)',
                  boxShadow: '0 4px 24px rgba(251,113,133,0.35)',
                }}
              >
                <Trophy size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Session complete</h3>
              <p className="text-sm text-zinc-400 mb-5">
                Resisting the word trains the same control you use to resist old habits.
              </p>

              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Score</p>
                  <p className="text-lg font-semibold text-white tabular-nums">{score}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Accuracy</p>
                  <p className="text-lg font-semibold text-white tabular-nums">{accuracy}%</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Best</p>
                  <p className="text-lg font-semibold tabular-nums" style={{ color: '#fb7185' }}>{best}</p>
                </div>
              </div>

              <motion.button
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #fb7185 0%, #fbbf24 100%)' }}
              >
                <RotateCcw size={16} /> Play Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}