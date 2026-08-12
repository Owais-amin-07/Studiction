import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2, Brain, Puzzle, Zap, ArrowLeft, Palette, HeartPulse,
} from 'lucide-react';
import MemoryMatchGame from './MemoryMatchGame';
import PatternRecallGame from './PatternRecallGame';
import ReactionTestGame from './ReactionTestGame';
import StroopFocusGame from './StroopFocusGame';
import EmotionMatchGame from './EmotionMatchGame';

type GameView =
  | 'menu'
  | 'memory-match'
  | 'pattern-recall'
  | 'reaction-test'
  | 'stroop-focus'
  | 'emotion-match';

const GAMES = [
  {
    id: 'memory-match' as const,
    icon: Brain,
    title: 'Memory Match',
    description: 'Flip cards and find matching pairs. Great for concentration.',
    difficulty: 'Easy • Medium • Hard',
    color: '#48cfad',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    available: true,
  },
  {
    id: 'pattern-recall' as const,
    icon: Puzzle,
    title: 'Pattern Recall',
    description: 'Watch the tiles glow, then repeat the growing pattern.',
    difficulty: 'Endless rounds • 3 lives',
    color: '#a78bfa',
    gradient: 'from-purple-500/20 to-violet-500/10',
    available: true,
  },
  {
    id: 'reaction-test' as const,
    icon: Zap,
    title: 'Reaction Test',
    description: 'Wait for green, then tap as fast as you can.',
    difficulty: 'Best time saved • Endless attempts',
    color: '#fbbf24',
    gradient: 'from-amber-500/20 to-orange-500/10',
    available: true,
  },
  {
    id: 'stroop-focus' as const,
    icon: Palette,
    title: 'Stroop Focus',
    description: 'Tap the ink color, not the word. A classic test of self-control.',
    difficulty: 'Speeds up as you score • 3 lives',
    color: '#fb7185',
    gradient: 'from-rose-500/20 to-pink-500/10',
    available: true,
  },
  {
    id: 'emotion-match' as const,
    icon: HeartPulse,
    title: 'Emotion Match',
    description: 'Read faces and real-life moments — name the emotion.',
    difficulty: 'Faces + scenarios • 3 lives',
    color: '#f472b6',
    gradient: 'from-pink-500/20 to-rose-500/10',
    available: true,
  },
];

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
    >
      <ArrowLeft size={16} /> <span>Back to Games</span>
    </motion.button>
  );
}

export default function MiniGamesView() {
  const [view, setView] = useState<GameView>('menu');

  if (view === 'memory-match') {
    return (
      <div>
        <BackButton onClick={() => setView('menu')} />
        <MemoryMatchGame />
      </div>
    );
  }

  if (view === 'pattern-recall') {
    return (
      <div>
        <BackButton onClick={() => setView('menu')} />
        <PatternRecallGame />
      </div>
    );
  }

  if (view === 'reaction-test') {
    return (
      <div>
        <BackButton onClick={() => setView('menu')} />
        <ReactionTestGame />
      </div>
    );
  }

  if (view === 'stroop-focus') {
    return (
      <div>
        <BackButton onClick={() => setView('menu')} />
        <StroopFocusGame />
      </div>
    );
  }

  if (view === 'emotion-match') {
    return (
      <div>
        <BackButton onClick={() => setView('menu')} />
        <EmotionMatchGame />
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(72,207,173,0.15)', border: '1px solid rgba(72,207,173,0.3)' }}
          >
            <Gamepad2 size={20} style={{ color: '#48cfad' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Mini Games</h2>
            <p className="text-xs text-zinc-500">5 games to boost your cognitive skills</p>
          </div>
        </div>
      </motion.div>

      {/* Games list */}
      <div className="grid gap-4">
        {GAMES.map((game, idx) => (
          <motion.button
            key={game.id}
            onClick={() => game.available && setView(game.id)}
            disabled={!game.available}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={game.available ? { y: -2 } : undefined}
            whileTap={game.available ? { scale: 0.98 } : undefined}
            className="relative rounded-2xl border border-white/10 backdrop-blur-md p-5 text-left overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              boxShadow: `0 0 30px ${game.color}15, inset 0 1px 0 rgba(255,255,255,0.08)`,
              opacity: game.available ? 1 : 0.55,
              cursor: game.available ? 'pointer' : 'not-allowed',
            }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />
            <div className="relative flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${game.color}20`, border: `1px solid ${game.color}40` }}
              >
                <game.icon size={28} style={{ color: game.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-white">{game.title}</h3>
                  {game.available && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: `${game.color}20`, color: game.color }}
                    >
                      Play Now
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-2">{game.description}</p>
                <p className="text-xs text-zinc-500">{game.difficulty}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}