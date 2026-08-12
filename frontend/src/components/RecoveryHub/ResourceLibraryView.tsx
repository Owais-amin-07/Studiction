import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { RESOURCE_CATEGORIES } from './resourceData';
import type { Article } from './resourceData';

export default function ResourceLibraryView() {
  const [activeCat, setActiveCat] = useState(RESOURCE_CATEGORIES[0].id);
  const [article, setArticle] = useState<Article | null>(null);

  const category = RESOURCE_CATEGORIES.find((c) => c.id === activeCat)!;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [article, activeCat]);

  // ── Reader view ──
  if (article) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.button
          onClick={() => setArticle(null)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> <span>All articles</span>
        </motion.button>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* meta */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: `${category.color}20`, color: category.color }}
            >
              {category.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Clock size={11} /> {article.minutes} min read
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
            {article.title}
          </h2>
          <p className="text-[11px] text-zinc-600 mb-5">Evidence base: {article.source}</p>

          <p className="text-sm text-zinc-300 leading-relaxed mb-6">{article.intro}</p>

          {/* sections */}
          <div className="space-y-5">
            {article.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h3 className="text-base font-semibold text-white mb-2">{section.heading}</h3>
                )}
                {section.text && (
                  <p className="text-sm text-zinc-400 leading-relaxed">{section.text}</p>
                )}
                {section.bullets && (
                  <ul className="space-y-2">
                    {section.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-400 leading-relaxed">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
                          style={{ background: category.color }}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* action box */}
          <div
            className="mt-7 rounded-2xl border p-4 flex items-start gap-3"
            style={{
              borderColor: `${category.color}40`,
              background: `${category.color}12`,
            }}
          >
            <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" style={{ color: category.color }} />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: category.color }}>
                Try today
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{article.action}</p>
            </div>
          </div>

          <motion.button
            onClick={() => setArticle(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-zinc-300 hover:bg-white/10 transition-colors"
          >
            Back to all articles
          </motion.button>
        </motion.article>
      </div>
    );
  }

  // ── List view ──
  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)' }}
          >
            <BookOpen size={20} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Resource Library</h2>
            <p className="text-xs text-zinc-500">Short, practical reads — 2 to 5 minutes each</p>
          </div>
        </div>
      </motion.div>

      {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
        {RESOURCE_CATEGORIES.map((cat) => {
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

      {/* Article cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {category.articles.map((a, idx) => (
          <motion.button
            key={`${category.id}-${a.id}`}
            type="button"
            onClick={() => setArticle(a)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="group relative rounded-2xl border border-white/10 backdrop-blur-md p-5 text-left overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `linear-gradient(135deg, ${category.color}14, transparent)` }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <Clock size={11} /> {a.minutes} min
                </span>
                <span className="text-[10px] text-zinc-600 truncate">· {a.source}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5 group-hover:underline underline-offset-4">
                {a.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">{a.excerpt}</p>
              <span className="text-xs font-medium" style={{ color: category.color }}>
                Read article →
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}