import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Check, Dumbbell, Flame, Smartphone, Sparkles, Target, Trophy, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type CategoryId = 'mind' | 'body' | 'focus' | 'social' | 'digital';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
}

const CATEGORIES: Record<CategoryId, { label: string; color: string; icon: LucideIcon }> = {
  mind: { label: 'Mind', color: '#a78bfa', icon: Brain },
  body: { label: 'Body', color: '#48cfad', icon: Dumbbell },
  focus: { label: 'Focus', color: '#fbbf24', icon: Target },
  social: { label: 'Social', color: '#f472b6', icon: Users },
  digital: { label: 'Digital', color: '#38bdf8', icon: Smartphone },
};

const POOL: Challenge[] = [
  { id: 'breaths', title: 'Two-Minute Breathing', description: 'Sit quietly and take 10 slow, deep breaths.', category: 'mind' },
  { id: 'gratitude', title: 'Gratitude Journal', description: 'Write down 3 things you are grateful for today.', category: 'mind' },
  { id: 'name-feeling', title: 'Name Your Feeling', description: 'Write one word for how you feel right now. Naming it tames it.', category: 'mind' },
  { id: 'no-news', title: 'No-News Morning', description: 'Skip news and feeds for the first hour after waking.', category: 'mind' },
  { id: 'walk', title: '20-Minute Walk', description: 'Walk outside — no scrolling, just notice the world.', category: 'body' },
  { id: 'water', title: '8 Glasses of Water', description: 'Hydrate through the day. Your brain is 75% water.', category: 'body' },
  { id: 'stretch', title: '5-Minute Stretch', description: 'Neck, shoulders, back. Release what the screen tightened.', category: 'body' },
  { id: 'sleep-11', title: 'Sleep by 11 PM', description: 'Protect tonight\'s sleep — a rested brain resists cravings.', category: 'body' },
  { id: 'deep-work', title: 'One Deep Work Hour', description: 'Phone in another room. One task. Sixty minutes.', category: 'focus' },
  { id: 'single-task', title: 'Single-Task Block', description: 'Do one thing at a time for 30 minutes. No tab-switching.', category: 'focus' },
  { id: 'clean-desk', title: 'Clear Your Space', description: 'Tidy your desk for 5 minutes. Clear space, clear mind.', category: 'focus' },
  { id: 'read-10', title: 'Read 10 Pages', description: 'A real book or notes — paper, not a screen.', category: 'focus' },
  { id: 'message', title: 'Check In on Someone', description: 'Message a friend or family member just to say salam.', category: 'social' },
  { id: 'compliment', title: 'Give One Compliment', description: 'Something genuine. Kindness lifts the giver too.', category: 'social' },
  { id: 'meal-together', title: 'One Phone-Free Meal', description: 'Eat with family or friends — screens face down.', category: 'social' },
  { id: 'listen', title: 'Really Listen', description: 'Ask someone "how are you?" and listen with full attention.', category: 'social' },
  { id: 'phone-free-30', title: 'First 30 Min Phone-Free', description: 'Win the morning before the feed steals it.', category: 'digital' },
  { id: 'grayscale', title: 'Go Grayscale', description: 'Turn your screen black & white for the day. Colors are hooks.', category: 'digital' },
  { id: 'off-home', title: 'Move One App', description: 'Remove your most-used app from the home screen.', category: 'digital' },
  { id: 'bedroom', title: 'Charge Phone Outside', description: 'Tonight, the bedroom is a no-phone zone.', category: 'digital' },
  { id: 'notifications', title: 'Silence Non-Human Alerts', description: 'Keep notifications from people only. Mute the rest.', category: 'digital' },
  { id: 'screen-sunset', title: 'Screen Sunset', description: 'No screens for the last hour before sleep.', category: 'digital' },
];

// ── storage helpers ──
const DONE_KEY = (date: string) => `studiction-challenges-${date}`;
const STREAK_KEY = 'studiction-challenges-streak';

interface Streak { count: number; best: number; last: string }

function loadDone(date: string): string[] {
  try { return JSON.parse(localStorage.getItem(DONE_KEY(date)) ?? '[]'); } catch { return []; }
}
function saveDone(date: string, ids: string[]) {
  try { localStorage.setItem(DONE_KEY(date), JSON.stringify(ids)); } catch { /* ignore */ }
}
function loadStreak(): Streak {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) ?? '') as Streak; } catch { return { count: 0, best: 0, last: '' }; }
}
function saveStreak(s: Streak) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

const todayKey = () => new Date().toDateString();

/** Deterministic daily pick — same 6 all day, fresh tomorrow. */
function getTodaysChallenges(): Challenge[] {
  const dayNumber = Math.floor(Date.now() / 86400000);
  const start = (dayNumber * 7) % POOL.length;
  const picks: Challenge[] = [];
  for (let i = 0; i < 6; i++) picks.push(POOL[(start + i * 3) % POOL.length]);
  return picks;
}

function bumpStreak(): Streak {
  const today = todayKey();
  const stored = loadStreak();
  if (stored.last === today) return stored;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const count = stored.last === yesterday ? stored.count + 1 : 1;
  const next = { count, best: Math.max(stored.best, count), last: today };
  saveStreak(next);
  return next;
}

export default function DailyChallengesView() {
  const challenges = useMemo(getTodaysChallenges, []);
  const [done, setDone] = useState<string[]>(() => loadDone(todayKey()));
  const [streak, setStreak] = useState<Streak>(() => loadStreak());

  const toggle = (id: string) => {
    const isDone = done.includes(id);
    const next = isDone ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    saveDone(todayKey(), next);
    if (!isDone) setStreak(bumpStreak());
  };

  const hoursLeft = useMemo(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const ms = midnight.getTime() - now.getTime();
    return Math.max(1, Math.round(ms / 3600000));
  }, []);

  const allDone = done.length >= challenges.length;

  return (
    <div>
      {/* ── Header  */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}
          >
            <Target size={20} style={{ color: '#fbbf24' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Daily Challenges</h2>
            <p className="text-xs text-zinc-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {' · '}new challenges in ~{hoursLeft}h
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Stats ─ */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Streak</p>
          <p className="text-sm font-semibold tabular-nums flex items-center justify-center gap-1">
            <Flame size={12} style={{ color: streak.count > 0 ? '#fb923c' : 'rgba(255,255,255,0.25)' }} />
            <span className="text-white">{streak.count}d</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Today</p>
          <p className="text-sm font-semibold text-white tabular-nums">{done.length}/{challenges.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 text-center">
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Best</p>
          <p className="text-sm font-semibold tabular-nums" style={{ color: '#fbbf24' }}>{streak.best}d</p>
        </div>
      </div>

      {/* ── Progress bar ─ */}
      <div className="h-2 mb-5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #fbbf24, #fb923c)' }}
          initial={false}
          animate={{ width: `${(done.length / challenges.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* ── Challenge list ─ */}
      <div className="grid gap-3">
        {challenges.map((challenge, idx) => {
          const cat = CATEGORIES[challenge.category];
          const isDone = done.includes(challenge.id);
          return (
            <motion.button
              key={challenge.id}
              type="button"
              onClick={() => toggle(challenge.id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={isDone}
              className="rounded-2xl border border-white/10 backdrop-blur-md p-4 text-left group"
              style={{
                background: isDone
                  ? 'linear-gradient(135deg, rgba(251,191,36,0.10), rgba(251,191,36,0.02))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-start gap-3">
                {/* check circle */}
                <div
                  className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200"
                  style={{
                    borderColor: isDone ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                    background: isDone ? '#fbbf24' : 'transparent',
                  }}
                >
                  {isDone && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                      <Check size={14} strokeWidth={3} className="text-black" />
                    </motion.span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`text-sm font-semibold ${isDone ? 'text-zinc-400 line-through' : 'text-white'}`}>
                      {challenge.title}
                    </h3>
                    <span
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
                      style={{ background: `${cat.color}18`, color: cat.color }}
                    >
                      <cat.icon size={9} /> {cat.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{challenge.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── All done celebration ─ */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 rounded-2xl border border-amber-500/30 p-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))' }}
        >
          <Sparkles size={30} style={{ color: '#fbbf24' }} className="mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-1">All done — amazing work!</h3>
          <p className="text-sm text-zinc-400">
            Small steps every day rewire the brain. Your streak is now{' '}
            <span className="font-semibold" style={{ color: '#fb923c' }}>{streak.count} day{streak.count > 1 ? 's' : ''}</span>. 🔥
          </p>
        </motion.div>
      )}

      {/* ── Footer note ─ */}
      <p className="mt-5 text-center text-[11px] text-zinc-600 flex items-center justify-center gap-1.5">
        <Trophy size={11} /> Complete at least one challenge daily to keep your streak alive.
      </p>
    </div>
  );
}