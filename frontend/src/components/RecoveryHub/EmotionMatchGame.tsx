import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Angry, Flame, Frown, Heart, HeartPulse, Laugh, Meh, Play, RotateCcw, Smile, SmilePlus, Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Phase = 'idle' | 'playing' | 'gameover';
type Feedback = 'correct' | 'wrong' | 'timeout' | null;

interface Emotion {
  id: string;
  label: string;
  Icon: LucideIcon;
  hex: string;
}

const EMOTIONS: Emotion[] = [
  { id: 'happy', label: 'Happy', Icon: Smile, hex: '#fbbf24' },
  { id: 'excited', label: 'Excited', Icon: Laugh, hex: '#fb923c' },
  { id: 'grateful', label: 'Grateful', Icon: SmilePlus, hex: '#48cfad' },
  { id: 'sad', label: 'Sad', Icon: Frown, hex: '#38bdf8' },
  { id: 'angry', label: 'Angry', Icon: Angry, hex: '#fb7185' },
  { id: 'numb', label: 'Numb', Icon: Meh, hex: '#94a3b8' },
];

const SCENARIOS: { text: string; emotion: string }[] = [
  { text: 'You passed a test you studied hard for.', emotion: 'happy' },
  { text: 'Your favorite song plays at just the right moment.', emotion: 'happy' },
  { text: 'You finally fixed something that bothered you all day.', emotion: 'happy' },
  { text: 'A best friend is visiting this weekend after a long time.', emotion: 'excited' },
  { text: 'You just got tickets to your first concert.', emotion: 'excited' },
  { text: 'The results you waited for arrive tomorrow morning.', emotion: 'excited' },
  { text: 'Someone stays late to help you, even though they didn\'t have to.', emotion: 'grateful' },
  { text: 'Your family makes your favorite meal after a hard day.', emotion: 'grateful' },
  { text: 'A stranger returns the wallet you lost — with everything inside.', emotion: 'grateful' },
  { text: 'A close friend is moving to another city.', emotion: 'sad' },
  { text: 'You missed the last call from someone you love.', emotion: 'sad' },
  { text: 'A place you cherished is being closed down.', emotion: 'sad' },
  { text: 'Someone takes credit for work you did.', emotion: 'angry' },
  { text: 'You waited an hour, and someone cuts the line.', emotion: 'angry' },
  { text: 'A promise made to you is broken again.', emotion: 'angry' },
  { text: 'You scroll your phone for three hours and feel… nothing.', emotion: 'numb' },
  { text: 'After too much screen time, even good news feels flat.', emotion: 'numb' },
  { text: 'A funny video plays, but you don\'t feel like laughing.', emotion: 'numb' },
];

interface Round {
  kind: 'face' | 'scenario';
  emotion: string;
  text?: string;
  options: string[];
}

const MAX_LIVES = 3;
const BEST_KEY = 'studiction-emotion-best';

const emotionOf = (id: string) => EMOTIONS.find((e) => e.id === id)!;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRound(score: number): Round {
  const kind: 'face' | 'scenario' =
    score < 2 ? 'face' : Math.random() < 0.45 ? 'face' : 'scenario';

  let emotion: string;
  let text: string | undefined;

  if (kind === 'scenario') {
    const item = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    emotion = item.emotion;
    text = item.text;
  } else {
    emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)].id;
  }

  const distractors = shuffle(EMOTIONS.map((e) => e.id).filter((id) => id !== emotion)).slice(0, 3);
  return { kind, emotion, text, options: shuffle([emotion, ...distractors]) };
}

function loadBest(): number {
  try { return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0; } catch { return 0; }
}
function saveBest(value: number) {
  try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode */ }
}

export default function EmotionMatchGame() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState<Round>(() => generateRound(0));
  const [roundId, setRoundId] = useState(0);
  const [roundTime, setRoundTime] = useState(8000);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(loadBest);
  const [lives, setLives] = useState(MAX_LIVES);
  const [attempts, setAttempts] = useState(0);

  const roundRef = useRef(round);
  const answeredRef = useRef(false);
  const roundTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (roundTimer.current !== null) window.clearTimeout(roundTimer.current);
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
  }, []);

  const beginRound = (currentScore: number) => {
    const r = generateRound(currentScore);
    roundRef.current = r;
    answeredRef.current = false;
    setRound(r);
    setRoundId((id) => id + 1);
    setFeedback(null);
    setWrongPick(null);
    const t = Math.max(5000, 8000 - currentScore * 150);
    setRoundTime(t);
    roundTimer.current = window.setTimeout(() => resolveAnswer(null), t);
  };

  const startGame = () => {
    if (roundTimer.current !== null) window.clearTimeout(roundTimer.current);
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    setScore(0);
    setStreak(0);
    setLives(MAX_LIVES);
    setAttempts(0);
    setPhase('playing');
    beginRound(0);
  };

  const resolveAnswer = (pick: string | null) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    if (roundTimer.current !== null) window.clearTimeout(roundTimer.current);

    const correct = pick !== null && pick === roundRef.current.emotion;
    setAttempts((a) => a + 1);

    if (correct) {
      const newScore = score + 1;
      setScore(newScore);
      setStreak((s) => s + 1);
      if (newScore > best) { setBest(newScore); saveBest(newScore); }
      setFeedback('correct');
      feedbackTimer.current = window.setTimeout(() => beginRound(newScore), 700);
    } else {
      setStreak(0);
      const remaining = lives - 1;
      setLives(remaining);
      setWrongPick(pick);
      setFeedback(pick === null ? 'timeout' : 'wrong');
      feedbackTimer.current = window.setTimeout(() => {
        if (remaining <= 0) setPhase('gameover');
        else beginRound(score);
      }, 1000);
    }
  };

  const handlePick = (id: string) => {
    if (phase !== 'playing') return;
    resolveAnswer(id);
  };

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
  const currentEmotion = emotionOf(round.emotion);

  return (
    <div className="max-w-md mx-auto">
      {/* ── Header ── */}
      <div className="text-center mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)' }}
        >
          <HeartPulse size={26} style={{ color: '#f472b6' }} />
        </div>
        <h2 className="text-xl font-semibold text-white mb-1.5">Emotion Match</h2>
        <p className="text-sm text-zinc-400">
          Name the emotion — in faces and in real-life moments.
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
          <p className="text-sm font-semibold tabular-nums" style={{ color: '#f472b6' }}>{best}</p>
        </div>
      </div>

      {/* ── Round card ── */}
      <div className="relative mb-3">
        <div className="min-h-[10rem] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-6 text-center overflow-hidden">
          <motion.div
            key={roundId}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: feedback === 'wrong' || feedback === 'timeout' ? [0, -8, 8, -5, 5, 0] : 0,
            }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-3"
          >
            {round.kind === 'face' ? (
              <>
                <currentEmotion.Icon
                  size={56}
                  strokeWidth={1.75}
                  style={{ color: currentEmotion.hex, filter: `drop-shadow(0 0 20px ${currentEmotion.hex}66)` }}
                />
                <p className="text-xs text-zinc-500 uppercase tracking-widest">
          Which emotion is this?
                </p>
              </>
            ) : (
              <>
                <p className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed">
                  "{round.text}"
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">
                  What would you probably feel?
                </p>
              </>
            )}
          </motion.div>
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
            key={roundId}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: roundTime / 1000, ease: 'linear' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #f472b6, #a78bfa)' }}
          />
        )}
      </div>

      {/* ── Answer buttons ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {round.options.map((id) => {
          const emo = emotionOf(id);
          const isCorrectBtn = feedback !== null && id === round.emotion;
          const isWrongBtn = feedback !== null && wrongPick === id;
          return (
            <motion.button
              key={`${roundId}-${id}`}
              type="button"
              onClick={() => handlePick(id)}
              whileHover={phase === 'playing' && !feedback ? { y: -2 } : undefined}
              whileTap={phase === 'playing' && !feedback ? { scale: 0.96 } : undefined}
              className="flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-sm font-semibold text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{
                background: isCorrectBtn
                  ? `${emo.hex}22`
                  : isWrongBtn ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: isCorrectBtn
                  ? `${emo.hex}99`
                  : isWrongBtn ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.1)',
                boxShadow: isCorrectBtn ? `0 0 24px ${emo.hex}44` : 'none',
              }}
            >
              <emo.Icon size={16} style={{ color: emo.hex }} />
              {emo.label}
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
                color: i < lives ? '#f472b6' : 'rgba(255,255,255,0.15)',
                fill: i < lives ? '#f472b6' : 'none',
              }}
            />
          ))}
        </div>
        <p className="text-[11px] text-zinc-500">Name it to tame it</p>
      </div>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4"
            style={{ background: 'rgba(19,19,25,0.85)' }}
          >
            <div className="text-center px-6 max-w-sm">
              <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
              <div className="space-y-2 mb-6 text-sm text-zinc-400">
                <p>1 · See a face or a real-life moment</p>
                <p>2 · Choose the emotion that fits</p>
                <p>3 · Build your emotional awareness</p>
              </div>
              <motion.button
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(244,114,182,0.35)]"
                style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)' }}
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
                  background: 'linear-gradient(135deg, #f472b6, #a78bfa)',
                  boxShadow: '0 4px 24px rgba(244,114,182,0.35)',
                }}
              >
                <Trophy size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">Session complete</h3>
              <p className="text-sm text-zinc-400 mb-5">
                Naming an emotion calms the brain's stress center. Every round builds
                your emotional awareness.
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
                  <p className="text-lg font-semibold tabular-nums" style={{ color: '#f472b6' }}>{best}</p>
                </div>
              </div>

              <motion.button
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)' }}
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