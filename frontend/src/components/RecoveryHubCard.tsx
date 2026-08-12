import { motion } from 'framer-motion';
import {
  ArrowRight, BookOpen, Gamepad2, Plus, Sparkles, Target, Video, Wind,
} from 'lucide-react';

interface RecoveryHubCardProps {
  onOpen: () => void;
}

const TILES = [
  { icon: Gamepad2, label: 'Mini Games', color: '#48cfad' },
  { icon: Video, label: 'Videos', color: '#a78bfa' },
  { icon: Target, label: 'Challenges', color: '#fbbf24' },
  { icon: BookOpen, label: 'Library', color: '#38bdf8' },
  { icon: Wind, label: 'Breathing', color: '#f472b6' },
  { icon: Plus, label: 'More Soon', color: '#94a3b8' },
];

export default function RecoveryHubCard({ onOpen }: RecoveryHubCardProps) {
  return (
    <section className="relative py-12 md:py-20">
      <div className="max-w-5xl mx-auto px-4 md:px-6">

        {/* ── Card (only the button navigates) ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full overflow-hidden rounded-3xl border border-white/10 backdrop-blur-md"
          style={{
            background: 'linear-gradient(135deg, rgba(72,207,173,0.08), rgba(255,255,255,0.02) 55%)',
            boxShadow: '0 0 60px rgba(72,207,173,0.10), inset 0 1px 0 rgba(255,255,255,0.10)',
          }}
        >
          {/* ambient glows */}
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-15" style={{ background: '#48cfad' }} />
          <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full blur-3xl opacity-10" style={{ background: '#38bdf8' }} />

          <div className="relative flex flex-col gap-8 p-6 md:p-10 lg:flex-row lg:items-center">

            {/* ── Left: text + button ── */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-px w-8" style={{ background: 'linear-gradient(90deg, #48cfad, transparent)' }} />
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-emerald-400/90">
                  Wellness Center
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    background: 'rgba(72,207,173,0.15)',
                    color: '#48cfad',
                    border: '1px solid rgba(72,207,173,0.3)',
                  }}
                >
                  New
                </span>
              </div>

              <h2 className="mb-3 text-3xl font-semibold tracking-tight md:text-4xl">
                <span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                  Recovery{' '}
                </span>
                <span className="bg-gradient-to-r from-[#48cfad] to-[#38bdf8] bg-clip-text text-transparent">
                  Hub
                </span>
              </h2>

              <p className="max-w-xl text-sm leading-relaxed text-zinc-400 md:text-[15px]">
                A calm space to rebuild your focus — play mindful mini games, watch
                recovery videos, complete small daily challenges, explore guided
                articles and breathe with intention.
              </p>

              {/* ── Modern CTA button ── */}
              <motion.button
                type="button"
                onClick={onOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                className="group/btn relative mt-7 inline-flex items-center gap-2.5 overflow-hidden rounded-full px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_24px_rgba(72,207,173,0.35)] transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(72,207,173,0.55)]"
                style={{
                  background: 'linear-gradient(135deg, #48cfad 0%, #38bdf8 100%)',
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
                />
                <Sparkles size={16} className="relative" />
                <span className="relative">Enter Recovery Hub</span>
                <ArrowRight
                  size={16}
                  className="relative transition-transform duration-300 group-hover/btn:translate-x-1"
                />
              </motion.button>
            </div>

            {/* ── Right: informational matrix (NOT interactive) ── */}
            <div className="w-full lg:w-[360px]">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-500">
                Inside the hub
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                {TILES.map((tile, i) => (
                  <motion.div
                    key={tile.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
                    className="flex aspect-square cursor-default flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03]"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `${tile.color}14` }}
                    >
                      <tile.icon size={18} style={{ color: tile.color }} strokeWidth={1.75} />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-500">
                      {tile.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}