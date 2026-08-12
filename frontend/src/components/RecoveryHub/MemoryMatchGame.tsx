// frontend/src/components/RecoveryHub/MemoryMatchGame.tsx
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, BookOpen, Leaf, Heart, Star, Lightbulb, 
  Target, Shield, Music, Coffee, Moon, Sun,
  Play, Pause, RotateCcw, LogOut, CheckCircle2, Clock, MousePointerClick,
  Sparkles, Check
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'playing' | 'paused' | 'completed';

interface DifficultyConfig {
  id: Difficulty;
  label: string;
  description: string;
  pairs: number;
  columns: number;
  rows: number;
}

interface CardData {
  id: string;
  iconId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface CardSymbol {
  id: string;
  label: string;
  Icon: typeof Brain;
}

interface SessionStats {
  elapsed: number;
  moves: number;
  matched: number;
  remaining: number;
  accuracy: number;
  progress: number;
  difficulty: DifficultyConfig;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CARD_SYMBOLS: CardSymbol[] = [
  { id: 'brain', label: 'Brain', Icon: Brain },
  { id: 'book', label: 'Book', Icon: BookOpen },
  { id: 'leaf', label: 'Leaf', Icon: Leaf },
  { id: 'heart', label: 'Heart', Icon: Heart },
  { id: 'star', label: 'Star', Icon: Star },
  { id: 'lightbulb', label: 'Lightbulb', Icon: Lightbulb },
  { id: 'target', label: 'Target', Icon: Target },
  { id: 'shield', label: 'Shield', Icon: Shield },
  { id: 'music', label: 'Music', Icon: Music },
  { id: 'coffee', label: 'Coffee', Icon: Coffee },
  { id: 'moon', label: 'Moon', Icon: Moon },
  { id: 'sun', label: 'Sun', Icon: Sun },
];

const DIFFICULTIES: DifficultyConfig[] = [
  { id: 'easy', label: 'Easy', description: '8 pairs • 4×4 grid', pairs: 8, columns: 4, rows: 4 },
  { id: 'medium', label: 'Medium', description: '10 pairs • 5×4 grid', pairs: 10, columns: 5, rows: 4 },
  { id: 'hard', label: 'Hard', description: '12 pairs • 6×4 grid', pairs: 12, columns: 6, rows: 4 },
];

// ─── Utilities ───────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck(config: DifficultyConfig): CardData[] {
  const symbols = CARD_SYMBOLS.slice(0, config.pairs);
  const cards = symbols.flatMap(s => [0, 1].map(c => ({
    id: `${s.id}-${c}`,
    iconId: s.id,
    isFlipped: false,
    isMatched: false,
  })));
  return shuffle(cards);
}

function formatTime(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function getAccuracy(matched: number, moves: number): number {
  if (moves === 0) return 0;
  return Math.min(100, Math.round((matched / moves) * 100));
}

// ─── Game Component ──────────────────────────────────────────────────────────
export default function MemoryMatchGame() {
  const [view, setView] = useState<'start' | 'game'>('start');
  const [config, setConfig] = useState<DifficultyConfig | null>(null);

  if (view === 'start' || !config) {
    return <StartScreen onStart={(c) => { setConfig(c); setView('game'); }} />;
  }

  return <GameScreen config={config} onExit={() => setView('start')} />;
}

// ─── Start Screen ────────────────────────────────────────────────────────────
function StartScreen({ onStart }: { onStart: (c: DifficultyConfig) => void }) {
  const [selected, setSelected] = useState<Difficulty>('easy');
  const selectedConfig = DIFFICULTIES.find(d => d.id === selected)!;

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(72,207,173,0.15)', border: '1px solid rgba(72,207,173,0.3)' }}>
          <Brain size={28} style={{ color: '#48cfad' }} />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Memory Match</h2>
        <p className="text-sm text-zinc-400">Flip cards to find matching pairs. Train your focus and memory.</p>
      </div>

      <div className="space-y-3 mb-6">
        {DIFFICULTIES.map(d => (
          <button
            key={d.id}
            onClick={() => setSelected(d.id)}
            className={`w-full rounded-2xl border backdrop-blur-md p-4 text-left transition-all ${
              selected === d.id 
                ? 'border-emerald-500/50 bg-emerald-500/5' 
                : 'border-white/8 bg-white/2 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">{d.label}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{d.description}</p>
              </div>
              {selected === d.id && (
                <Check size={18} style={{ color: '#48cfad' }} />
              )}
            </div>
          </button>
        ))}
      </div>

      <motion.button
        onClick={() => onStart(selectedConfig)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #48cfad, #38bdf8)',
          boxShadow: '0 4px 20px rgba(72,207,173,0.3)',
        }}
      >
        <Play size={16} />
        Start Game
      </motion.button>
    </div>
  );
}

// ─── Game Screen ─────────────────────────────────────────────────────────────
function GameScreen({ config, onExit }: { config: DifficultyConfig; onExit: () => void }) {
  const [cards, setCards] = useState<CardData[]>(() => createDeck(config));
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [firstPick, setFirstPick] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Completion check
  useEffect(() => {
    if (phase === 'playing' && matched === config.pairs) {
      timeoutRef.current = window.setTimeout(() => setPhase('completed'), 600);
    }
  }, [matched, phase, config.pairs]);

  const flipCard = useCallback((id: string) => {
    if (phase !== 'playing' || isLocked) return;
    
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    if (!firstPick) {
      setFirstPick(id);
      setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
      return;
    }

    // Second pick
    const first = cards.find(c => c.id === firstPick);
    setIsLocked(true);
    setMoves(m => m + 1);
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));

    if (!first) { setIsLocked(false); return; }

    const isMatch = first.iconId === card.iconId;
    const delay = isMatch ? 500 : 950;

    timeoutRef.current = window.setTimeout(() => {
      if (isMatch) {
        setCards(prev => prev.map(c => 
          c.id === id || c.id === first.id ? { ...c, isMatched: true, isFlipped: false } : c
        ));
        setMatched(m => m + 1);
      } else {
        setCards(prev => prev.map(c => 
          c.id === id || c.id === first.id ? { ...c, isFlipped: false } : c
        ));
      }
      setIsLocked(false);
      setFirstPick(null);
    }, delay);
  }, [phase, isLocked, cards, firstPick]);

  const restart = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCards(createDeck(config));
    setPhase('playing');
    setMoves(0);
    setMatched(0);
    setElapsed(0);
    setFirstPick(null);
    setIsLocked(false);
  };

  const stats: SessionStats = {
    elapsed,
    moves,
    matched,
    remaining: config.pairs - matched,
    accuracy: getAccuracy(matched, moves),
    progress: config.pairs === 0 ? 0 : matched / config.pairs,
    difficulty: config,
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCell icon={Clock} label="Time" value={formatTime(elapsed)} />
        <StatCell icon={MousePointerClick} label="Moves" value={String(moves)} />
        <StatCell icon={CheckCircle2} label="Matches" value={`${matched}/${config.pairs}`} />
      </div>

                 {/* Board */}
      <div className="flex justify-center">
        <div
          className={`grid w-full ${
            config.columns === 4 ? 'grid-cols-4 gap-2 max-w-sm' :
            config.columns === 5 ? 'grid-cols-5 gap-1.5 max-w-md' :
            'grid-cols-6 gap-1.5 max-w-lg'
          }`}
        >
          {cards.map((card, idx) => (
            <GameCard key={card.id} card={card} index={idx} interactive={phase === 'playing'} onFlip={flipCard} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <ActionButton onClick={() => setPhase(phase === 'playing' ? 'paused' : 'playing')}>
          {phase === 'playing' ? <Pause size={16} /> : <Play size={16} />}
          {phase === 'playing' ? 'Pause' : 'Resume'}
        </ActionButton>
        <ActionButton onClick={restart}>
          <RotateCcw size={16} /> Restart
        </ActionButton>
        <ActionButton onClick={onExit} variant="ghost">
          <LogOut size={16} /> Exit
        </ActionButton>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {phase === 'paused' && (
          <PauseOverlay onResume={() => setPhase('playing')} onRestart={restart} onExit={onExit} />
        )}
        {phase === 'completed' && (
          <CompletionScreen stats={stats} onPlayAgain={restart} onExit={onExit} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────────────────────────
function StatCell({ icon: Icon, label, value }: { icon: typeof Brain; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 backdrop-blur-md p-2 text-center">
      <Icon size={14} className="mx-auto mb-1" style={{ color: '#48cfad' }} />
      <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

const GameCard = memo(function GameCard({ 
  card, index, interactive, onFlip 
}: { card: CardData; index: number; interactive: boolean; onFlip: (id: string) => void }) {
  const symbol = CARD_SYMBOLS.find(s => s.id === card.iconId)!;
  const revealed = card.isFlipped || card.isMatched;

  return (
    <motion.button
      onClick={() => onFlip(card.id)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      whileHover={!revealed && interactive ? { scale: 1.05 } : undefined}
      className="aspect-square rounded-lg relative [perspective:800px] outline-none w-full"
      style={{ opacity: interactive ? 1 : 0.7 }}
    >
      <motion.div
        className="relative w-full h-full [transform-style:preserve-3d]"
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back */}
        <div className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/2 [backface-visibility:hidden] flex items-center justify-center">
          <Leaf size={16} className="text-zinc-700" />
        </div>
        {/* Front */}
        <div className={`absolute inset-0 rounded-xl border [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center ${
          card.isMatched ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'
        }`}>
          <symbol.Icon size={22} className={card.isMatched ? 'text-emerald-400' : 'text-zinc-300'} />
        </div>
      </motion.div>
    </motion.button>
  );
});

function ActionButton({ 
  children, onClick, variant = 'default' 
}: { children: React.ReactNode; onClick: () => void; variant?: 'default' | 'ghost' }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
        variant === 'ghost' 
          ? 'border border-white/10 text-zinc-400 hover:text-white'
          : 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
      }`}
      style={{ background: variant === 'ghost' ? 'rgba(255,255,255,0.02)' : 'rgba(72,207,173,0.05)' }}
    >
      {children}
    </motion.button>
  );
}

function PauseOverlay({ onResume, onRestart, onExit }: { onResume: () => void; onRestart: () => void; onExit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-white/10 bg-zinc-900/90 p-8 text-center max-w-sm"
      >
        <Pause size={32} className="mx-auto mb-3 text-zinc-400" />
        <h3 className="text-lg font-semibold text-white mb-2">Paused</h3>
        <p className="text-sm text-zinc-400 mb-5">Take a breath. The board stays hidden.</p>
        <div className="flex gap-2 justify-center">
          <ActionButton onClick={onResume}><Play size={14} /> Resume</ActionButton>
          <ActionButton onClick={onRestart}><RotateCcw size={14} /> Restart</ActionButton>
          <ActionButton onClick={onExit} variant="ghost"><LogOut size={14} /> Exit</ActionButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CompletionScreen({ stats, onPlayAgain, onExit }: { stats: SessionStats; onPlayAgain: () => void; onExit: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-emerald-500/30 bg-zinc-900/95 p-8 text-center max-w-sm w-full"
        style={{ boxShadow: '0 0 60px rgba(72,207,173,0.2)' }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #48cfad, #38bdf8)', boxShadow: '0 4px 20px rgba(72,207,173,0.3)' }}>
          <Sparkles size={28} className="text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Congratulations!</h3>
        <p className="text-sm text-zinc-400 mb-5">Great work! Every exercise strengthens your focus.</p>
        
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-zinc-500 uppercase">Time</p>
            <p className="text-sm font-semibold text-white">{formatTime(stats.elapsed)}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-zinc-500 uppercase">Moves</p>
            <p className="text-sm font-semibold text-white">{stats.moves}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-zinc-500 uppercase">Accuracy</p>
            <p className="text-sm font-semibold text-white">{stats.accuracy}%</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="text-[10px] text-zinc-500 uppercase">Difficulty</p>
            <p className="text-sm font-semibold text-white">{stats.difficulty.label}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={onPlayAgain}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #48cfad, #38bdf8)', color: 'white' }}
          >
            Play Again
          </motion.button>
          <ActionButton onClick={onExit} variant="ghost">Exit</ActionButton>
        </div>
      </motion.div>
    </motion.div>
  );
}