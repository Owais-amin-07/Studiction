import { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

const SPLIT_IMAGE_URL = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560';

// Embedded flip sound — plays for both flip and reflip
const FLIP_SOUND = '/sounds/flip.mp3';

const features = [
  {
    id: '1', title: 'JITAI Engine',
    subtitle:  'Context-aware interventions triggered at your highest behavioral risk moments.',
    detail:    'Continuous usage pattern analysis identifies personalized risk windows and delivers targeted micro-interventions before compulsive urges escalate.',
    stats:     [{ label: 'Monitoring', value: 'Live' }, { label: 'Delivery', value: 'Adaptive' }, { label: 'Engine', value: 'AI' }],
    glowColor: '#6c63ff', borderColor: 'rgba(108,99,255,0.6)', tag: 'AI Powered',
  },
  {
    id: '2', title: 'Cognitive Resilience',
    subtitle:  'CBT and ACT-based micro-sessions designed to disrupt compulsive usage cycles.',
    detail:    'Structured daily exercises build trigger awareness and introduce evidence-based behavioral alternatives — shifting responses from reactive habit to deliberate choice.',
    stats:     [{ label: 'Framework', value: 'CBT' }, { label: 'Method', value: 'ACT' }, { label: 'Cadence', value: 'Daily' }],
    glowColor: '#48cfad', borderColor: 'rgba(72,207,173,0.6)', tag: 'Neuroscience',
  },
  {
    id: '3', title: 'Clinical Privacy',
    subtitle:  'Your behavioral data is protected by architecture — not just by policy.',
    detail:    'End-to-end encryption keeps all session and usage data exclusively yours. HIPAA-aligned infrastructure ensures no third-party access, tracking, or data resale.',
    stats:     [{ label: 'Encryption', value: 'E2E' }, { label: 'Standard', value: 'HIPAA' }, { label: 'Sharing', value: 'None' }],
    glowColor: '#a78bfa', borderColor: 'rgba(167,139,250,0.6)', tag: 'HIPAA Compliant',
  },
  {
    id: '4', title: 'Somatic Grounding',
    subtitle:  'Physiologically-grounded techniques that interrupt compulsion at its root.',
    detail:    'Guided breathwork, progressive relaxation, and movement prompts regulate the nervous system responses underlying compulsive digital behavior.',
    stats:     [{ label: 'Target', value: 'CNS' }, { label: 'Delivery', value: 'Guided' }, { label: 'Basis', value: 'Somatic' }],
    glowColor: '#f59e0b', borderColor: 'rgba(245,158,11,0.6)', tag: 'Holistic',
  },
];

const CARD_WIDTH  = 280;
const CARD_HEIGHT = 400;

const faceStyle: React.CSSProperties = {
  position:                   'absolute',
  inset:                      0,
  backfaceVisibility:         'hidden',
  WebkitBackfaceVisibility:   'hidden' as any,
  borderRadius:               '22px',
};

// ─────────────────────────────────────────────────────────────────────────────
// GlassCard
// ─────────────────────────────────────────────────────────────────────────────
function GlassCard({ feature, index, isSpread, isActive, isDimmed, onToggle, scrollGlow, isMobile }: {
  feature:    typeof features[0];
  index:      number;
  isSpread:   boolean;
  isActive:   boolean;
  isDimmed:   boolean;
  onToggle:   () => void;
  scrollGlow: number;
  isMobile:   boolean;
}) {
  const total = features.length;

  // ── Mouse tilt (front face only, not while flipped) ──────────────────────
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 200, damping: 20 });
  const smy = useSpring(my, { stiffness: 200, damping: 20 });
  const tiltX = useTransform(smy, [-0.5, 0.5], [10, -10]);
  const tiltY = useTransform(smx, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSpread || isActive) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left)  / CARD_WIDTH  - 0.5);
    my.set((e.clientY - r.top)   / CARD_HEIGHT - 0.5);
  };
  const handleMouseLeave = () => { mx.set(0); my.set(0); };

  // ── Click sound — same clip for flip and reflip ───────────────────────────
  const playSound = () => {
  try {
    const audio = new Audio(FLIP_SOUND);
    audio.volume = 0.2;
    audio.play();

    // Fade out and stop before the scratchy tail
    setTimeout(() => {
      const fade = setInterval(() => {
        if (audio.volume > 0.02) {
          audio.volume = Math.max(0, audio.volume - 0.02);
        } else {
          audio.pause();
          clearInterval(fade);
        }
      }, 30);
    }, 100);

  } catch {}
};

  // ── Stack / spread positions ─────────────────────────────────────────────
  const stackIndex  = total - 1 - index;
  const stackOffset = stackIndex * 5;
  const stackRotate = (index - (total - 1) / 2) * 2;
  const stackScale  = 1 - stackIndex * 0.03;
  const stackY      = stackIndex * 5;

  const spreadX = isMobile ? 0 : (index - (total - 1) / 2) * 285;
  const spreadY = isMobile ? (index - (total - 1) / 2) * 430 : 0;
  const glowOpacity = 0.3 + scrollGlow * 0.7;

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => { playSound(); onToggle(); }}
      animate={{
        x:       isSpread ? spreadX   : stackOffset,
        y:       isSpread ? (spreadY + (isActive ? -18 : 0)) : stackY,
        rotate:  isSpread ? 0         : stackRotate,
        scale:   isDimmed ? 0.88      : isSpread ? 1 : stackScale,
        zIndex:  isActive ? 10        : isSpread ? 1 : (total - stackIndex),
        opacity: isDimmed ? 0.38      : 1,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      style={{
        position:       'absolute',
        width:          CARD_WIDTH,
        height:         CARD_HEIGHT,
        transformStyle: 'preserve-3d',
        cursor:         'pointer',
        perspective:    '1200px',
      }}
    >

      {/* ── Flip container — rotateX = upward flip ── */}
      <motion.div
        animate={{ rotateX: isActive ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 28 }}
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', position: 'relative' }}
      >

        {/* ════════════════════════════════════════════
            FRONT FACE
        ════════════════════════════════════════════ */}
        <motion.div
          style={{
            ...faceStyle,
            rotateX: isActive ? 0 : tiltX,
            rotateY: isActive ? 0 : tiltY,
            zIndex: 2,
          }}
        >
          {/* Scroll glow border */}
          <motion.div
            animate={{ opacity: glowOpacity }}
            style={{
              position: 'absolute', inset: '-1.5px', borderRadius: '22px',
              background: `linear-gradient(135deg, ${feature.glowColor}, transparent 50%, ${feature.glowColor}66)`,
              zIndex: 0, filter: 'blur(1px)',
            }}
          />
          {/* Glass body */}
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            borderRadius: '22px', background: 'rgba(8,8,20,0.88)',
            backdropFilter: 'blur(24px)',
            border: `1px solid rgba(255,255,255,${0.05 + scrollGlow * 0.1})`,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', padding: '22px',
            boxShadow: `0 0 ${20 + scrollGlow * 30}px ${feature.glowColor}${Math.round(scrollGlow * 40).toString(16).padStart(2,'0')}, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}>
            {/* Background Image */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage:    `url(${SPLIT_IMAGE_URL})`,
              backgroundSize:     `${total * 100}% 100%`,
              backgroundPosition: `${(index / (total - 1)) * 100}% center`,
              backgroundRepeat:   'no-repeat',
              mixBlendMode:       'luminosity',
              opacity:            0.35 + scrollGlow * 0.25,
            }} />
            {/* Bottom gradient */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(4,4,12,0.98) 0%, rgba(4,4,12,0.6) 45%, transparent 100%)',
            }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ width:'36px', height:'2.5px', borderRadius:'2px', background:feature.glowColor, boxShadow:`0 0 8px ${feature.glowColor}`, marginBottom:'12px' }} />
              <h3 style={{ fontWeight:700, color:'#fff', marginBottom:'8px', fontSize:'1.15rem' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize:'0.76rem', color:'rgba(255,255,255,0.55)', lineHeight:1.6, margin:0 }}>
                {feature.subtitle}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ════════════════════════════════════════════
            BACK FACE
        ════════════════════════════════════════════ */}
        <div style={{ ...faceStyle, transform: 'rotateX(180deg)', zIndex: 1 }}>
          {/* Glow border */}
          <div style={{
            position: 'absolute', inset: '-1.5px', borderRadius: '22px',
            background: `linear-gradient(135deg, ${feature.glowColor}, transparent 50%, ${feature.glowColor}66)`,
            zIndex: 0,
          }} />
          {/* Body */}
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            borderRadius: '22px', background: 'rgba(6,6,18,0.97)',
            backdropFilter: 'blur(32px)',
            border: `1px solid ${feature.borderColor}`,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', padding: '20px',
            overflow: 'hidden',
            boxShadow: `0 0 50px ${feature.glowColor}30, inset 0 1px 0 rgba(255,255,255,0.07)`,
          }}>
            {/* Top shimmer */}
            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px', background:`linear-gradient(90deg, transparent, ${feature.glowColor}cc, transparent)` }} />
            {/* Radial glow bg */}
            <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 0%, ${feature.glowColor}15 0%, transparent 65%)`, pointerEvents:'none' }} />

            {/* Tag badge */}
            <div style={{ alignSelf:'flex-start' }}>
              <span style={{
                display:'inline-block', padding:'4px 10px', borderRadius:'20px',
                background:`${feature.glowColor}18`, border:`1px solid ${feature.glowColor}40`,
                fontSize:'9px', letterSpacing:'0.15em', color:feature.glowColor,
                textTransform:'uppercase', fontWeight:700,
              }}>
                {feature.tag}
              </span>
            </div>

            {/* Title + detail */}
            <div>
              <div style={{ width:'36px', height:'2px', borderRadius:'2px', background:feature.glowColor, boxShadow:`0 0 8px ${feature.glowColor}`, marginBottom:'10px' }} />
              <h3 style={{ fontWeight:700, color:'#fff', fontSize:'1.15rem', marginBottom:'8px', textShadow:`0 0 20px ${feature.glowColor}55` }}>
                {feature.title}
              </h3>
              <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.62)', lineHeight:1.75, margin:0 }}>
                {feature.detail}
              </p>
            </div>

            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'6px' }}>
              {feature.stats.map(stat => (
                <div key={stat.label} style={{
                  textAlign:'center', padding:'8px 4px', borderRadius:'10px',
                  background:'rgba(255,255,255,0.04)',
                  border:`1px solid ${feature.glowColor}22`,
                }}>
                  <div style={{ fontSize:'1rem', fontWeight:700, color:feature.glowColor, fontFamily:'monospace', lineHeight:1.2 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize:'7px', color:'rgba(255,255,255,0.35)', letterSpacing:'0.06em', marginTop:'3px', textTransform:'uppercase' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FeatureSlider
// ─────────────────────────────────────────────────────────────────────────────
export default function FeatureSlider() {
  const [isSpread,   setIsSpread]   = useState(false);
  const [activeIdx,  setActiveIdx]  = useState<number | null>(null);
  const [scrollGlow, setScrollGlow] = useState(0);
  const [isMobile,   setIsMobile]   = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Proper reactive isMobile — updates on resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Spread cards when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsSpread(true);
        else { setIsSpread(false); setActiveIdx(null); setScrollGlow(0); }
      },
      { threshold: isMobile ? 0.3 : 0.5 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  // Scroll glow progress
 useEffect(() => {
  let ticking = false;
  const handle = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      if (sectionRef.current) {
        const rect     = sectionRef.current.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, 1 - rect.top / window.innerHeight));
        setScrollGlow(progress);
      }
      ticking = false;
    });
  };
  window.addEventListener('scroll', handle, { passive: true });
  return () => window.removeEventListener('scroll', handle);
}, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      style={{
        scrollMarginTop: '-2px',
        position:       'relative',
        minHeight:      '110vh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         10,
        padding:        isMobile ? '60px 20px 80px' : '60px 40px 80px',
      }}
    >

      {/* ══════════════════════════════════════════════════════
          DESKTOP TITLE — large, blurred, floats above cards
      ══════════════════════════════════════════════════════ */}
      {!isMobile && (
        <div
          style={{
            textAlign:     'center',
            width:         '100%',
            maxWidth:      '1200px',
            marginBottom:  '-28px',
            pointerEvents: 'none',
            userSelect:    'none',
            zIndex:        5,
          }}
        >
          {/* Main blurred title */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ y: 0, transition: { duration: 0.8, ease: 'easeOut' } }}
            viewport={{ once: true, amount: 0.5 }}
            animate={{ opacity: activeIdx !== null ? 0.03 : 0.4 }}
            transition={{ duration: 0.5 }}
            style={{
              fontSize:      'clamp(3.5rem, 6.5vw, 7.5rem)',
              fontWeight:    350,
              color:         'white',
              filter:        'blur(0.8px)',
              letterSpacing: '-0.025em',
              lineHeight:    1,
              margin:        '0 0 -20px',
            }}
          >
            Core Modalities
          </motion.h2>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MOBILE TITLE — normal, readable, no blur
      ══════════════════════════════════════════════════════ */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ textAlign: 'center', marginBottom: '36px', padding: '0 8px' }}
        >
          <p style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.35)', marginBottom: '12px', textTransform: 'uppercase',
          }}>
            Recovery Architecture
          </p>
          <h2 style={{
            fontSize: 'clamp(3rem, 8vw, 2.8rem)', fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.68)',filter:        'blur(1px)', marginBottom: '-16px', letterSpacing: '-0.01em',
          }}>
            Core Modalities
          </h2>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════
          CARDS
      ══════════════════════════════════════════════════════ */}
      <div
        className="h-[1720px] md:h-[500px]"
        style={{
          position:       'relative',
          width:          '100%',
          maxWidth:       '1200px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          perspective:    '1200px',
        }}
      >
        {features.map((feature, index) => (
          <GlassCard
            key={feature.id}
            feature={feature}
            index={index}
            isSpread={isSpread}
            isActive={activeIdx === index}
            isDimmed={activeIdx !== null && activeIdx !== index}
            onToggle={() => setActiveIdx(activeIdx === index ? null : index)}
            scrollGlow={scrollGlow}
            isMobile={isMobile}
          />
        ))}
      </div>

    </section>
  );
}