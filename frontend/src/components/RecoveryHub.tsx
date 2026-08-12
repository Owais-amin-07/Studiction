import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AmbientToggle from "./RecoveryHub/AmbientToggle";
import { 
  Gamepad2, Video, Target, BookOpen, Wind, 
  ArrowLeft, Brain, Sparkles, Zap, Heart
} from 'lucide-react';

// Import section views
import MiniGamesView from './RecoveryHub/MiniGamesView';
import VideosView from './RecoveryHub/VideosView';
import DailyChallengesView from './RecoveryHub/DailyChallengesView';
import ResourceLibraryView from './RecoveryHub/ResourceLibraryView';
import BreathingExerciseView from './RecoveryHub/BreathingExerciseView';

type HubView = 'main' | 'games' | 'videos' | 'challenges' | 'library' | 'breathing';

interface RecoveryHubProps {
  onBack?: () => void;
}

const CARDS = [
  {
    id: 'games' as const,
    icon: Gamepad2,
    title: 'Mini Games',
    description: '3 brain-boosting games to sharpen focus and memory',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    glow: 'rgba(72, 207, 173, 0.3)',
    color: '#48cfad',
  },
  {
    id: 'videos' as const,
    icon: Video,
    title: 'Recovery Videos',
    description: '10 inspiring videos about overcoming addiction',
    gradient: 'from-purple-500/20 to-violet-500/10',
    glow: 'rgba(167, 139, 250, 0.3)',
    color: '#a78bfa',
  },
  {
    id: 'challenges' as const,
    icon: Target,
    title: 'Daily Challenges',
    description: 'Simple daily tasks to build healthier habits',
    gradient: 'from-amber-500/20 to-orange-500/10',
    glow: 'rgba(251, 191, 36, 0.3)',
    color: '#fbbf24',
  },
  {
    id: 'library' as const,
    icon: BookOpen,
    title: 'Resource Library',
    description: 'Articles and guides about addiction recovery',
    gradient: 'from-sky-500/20 to-blue-500/10',
    glow: 'rgba(56, 189, 248, 0.3)',
    color: '#38bdf8',
  },
  {
    id: 'breathing' as const,
    icon: Wind,
    title: 'Breathing Exercise',
    description: 'Guided breathing for calm and clarity',
    gradient: 'from-pink-500/20 to-rose-500/10',
    glow: 'rgba(244, 114, 182, 0.3)',
    color: '#f472b6',
  },
];

export default function RecoveryHub({ onBack }: RecoveryHubProps) {
  const [view, setView] = useState<HubView>('main');

  const handleBack = () => {
    if (view === 'main' && onBack) {
      onBack();
    } else {
      setView('main');
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'games':
        return <MiniGamesView />;
      case 'videos':
        return <VideosView />;
      case 'challenges':
        return <DailyChallengesView />;
      case 'library':
        return <ResourceLibraryView />;
      case 'breathing':
        return <BreathingExerciseView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full relative" style={{ background: '#131319' }}>
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-16">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              onClick={handleBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <ArrowLeft size={16} className="text-zinc-400" />
            </motion.button>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
                Recovery Hub
              </p>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                {view === 'main' ? 'Your Wellness Center' : CARDS.find(c => c.id === view)?.title}
              </h1>
            </div>
          </div>
          
          {view === 'main' && (
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              Take care of your mind with these curated activities. Each section is designed to support your recovery journey.
            </p>
          )}
        </motion.div>

        {/* Main View: Card Grid */}
        <AnimatePresence mode="wait">
          {view === 'main' ? (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {CARDS.map((card, idx) => (
                <motion.button
                  key={card.id}
                  onClick={() => setView(card.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative rounded-2xl border border-white/8 backdrop-blur-md p-6 text-left overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
                    boxShadow: `0 0 40px ${card.glow}20, inset 0 1px 0 rgba(255,255,255,0.10)`,
                  }}
                >
                  {/* Gradient overlay */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                  
                  {/* Glow effect */}
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"
                    style={{ background: card.color }}
                  />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ 
                        background: `${card.color}20`,
                        border: `1px solid ${card.color}40`
                      }}
                    >
                      <card.icon size={24} style={{ color: card.color }} />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {card.description}
                    </p>

                    {/* Arrow indicator */}
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium" style={{ color: card.color }}>
                      <span>Explore</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>
        <AmbientToggle
        section={view === 'games' || view === 'library' || view === 'breathing' ? view : null}
      />
      </div>
    </div>
  );
}