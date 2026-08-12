import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Play, Video, X } from 'lucide-react';
import { VIDEO_CATEGORIES } from './videoData';
import type { HubVideo } from './videoData';

export default function VideosView() {
  const [activeCat, setActiveCat] = useState(VIDEO_CATEGORIES[0].id);
  const [selected, setSelected] = useState<HubVideo | null>(null);
  const [embedFailed, setEmbedFailed] = useState(false);

  const category = VIDEO_CATEGORIES.find((c) => c.id === activeCat)!;

  // reset embed status per video
  useEffect(() => {
    setEmbedFailed(false);
  }, [selected]);

  // lock scroll while player is open
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // YouTube IFrame API posts onError when a video is dead or blocks embedding
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      if (!event.origin.includes('youtube.com')) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'onError') setEmbedFailed(true);
      } catch {
        /* not a player message */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div>
      {/* ── Header ─ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}
          >
            <Video size={20} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Recovery Videos</h2>
            <p className="text-xs text-zinc-500">
              Top-ranked talks in English & Urdu — watch again and again
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Category chips ─ */}
        <div className="flex flex-wrap gap-2 mb-6">
        {VIDEO_CATEGORIES.map((cat) => {
          const active = cat.id === activeCat;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              className="flex-shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={
                active
                  ? { background: `${cat.color}20`, borderColor: `${cat.color}60`, color: cat.color }
                  : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: '#a1a1aa' }
              }
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Video cards ─ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {category.videos.map((video, idx) => (
          <motion.button
            key={`${category.id}-${video.id}`}
            type="button"
            onClick={() => setSelected(video)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="group relative rounded-2xl border border-white/10 backdrop-blur-md overflow-hidden text-left"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* thumbnail */}
            <div
              className="relative aspect-video overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${category.color}2e, rgba(19,19,25,0.4))` }}
            >
              <category.icon
                size={90}
                strokeWidth={1}
                className="absolute -bottom-4 -right-4 opacity-15"
                style={{ color: category.color }}
              />

              <span
                className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                style={{ background: 'rgba(0,0,0,0.5)', color: category.color, backdropFilter: 'blur(6px)' }}
              >
                {video.language === 'ur' ? 'اردو' : 'EN'}
              </span>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Play size={18} className="text-white ml-0.5" fill="white" />
                </div>
              </div>
            </div>

            {/* info */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-1">{video.title}</h3>
              <p className="text-[10px] text-zinc-600 mb-1">{video.speaker}</p>
              <p className="text-xs text-zinc-500 leading-relaxed italic">"{video.note}"</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Player modal ─ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />

            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/95 overflow-hidden"
              style={{ boxShadow: '0 20px 80px rgba(0,0,0,0.6)' }}
            >
              {/* player area */}
              <div className="aspect-video bg-black">
                {selected.youtubeId && !embedFailed ? (
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${selected.youtubeId}?rel=0&enablejsapi=1`}
                    title={selected.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `${category.color}20`, border: `1px solid ${category.color}50` }}
                    >
                      <Play size={20} style={{ color: category.color }} />
                    </div>
                    <p className="text-sm text-zinc-400 max-w-xs">
                      {embedFailed
                        ? 'This video can\'t be played inside the app right now. Watch it on YouTube instead:'
                        : 'This video\'s link is being added soon. Meanwhile, watch it on YouTube:'}
                    </p>
                    <a
                      href={`https://www.youtube.com/watch?v=${selected.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}aa)` }}
                    >
                      Watch on YouTube <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </div>

              {/* info bar */}
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `${category.color}20`, color: category.color }}
                    >
                      {selected.language === 'ur' ? 'اردو' : 'EN'}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                      {category.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{selected.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 italic">"{selected.note}"</p>
                  <p className="text-[10px] text-zinc-600 mt-1.5">{selected.speaker}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close player"
                  className="flex-shrink-0 w-9 h-9 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-zinc-400" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}