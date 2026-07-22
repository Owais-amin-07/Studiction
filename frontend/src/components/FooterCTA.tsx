import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import {
  Github, Linkedin, Mail,
  ChevronRight, Heart
} from 'lucide-react';

// ─── Data ───────────────────────────────────────────────────────────────────



const socialLinks = [
  { label: 'GitHub',              href: 'https://github.com',   icon: Github   },
  { label: 'Owais — LinkedIn',    href: 'https://linkedin.com', icon: Linkedin },
  { label: 'Abdullah — LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
];




// ─── Sub-components ─────────────────────────────────────────────────────────

function FooterLink({ label, href, icon: Icon }: { label: string; href: string; icon?: any }) {
  return (
    <motion.a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="group flex items-center gap-2 text-zinc-500 text-sm w-fit"
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {Icon && (
        <Icon size={13} className="text-zinc-600 group-hover:text-[#48cfad] transition-colors duration-300" />
      )}
      <span className="relative">
        {label}
        <span
          className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
          style={{ background: 'linear-gradient(90deg, #6c63ff, #48cfad)' }}
        />
        <motion.span className="absolute inset-0 bg-gradient-to-r from-[#6c63ff] to-[#48cfad] bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {label}
        </motion.span>
      </span>
      <ChevronRight
        size={10}
        className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-[#48cfad]"
      />
    </motion.a>
  );
}

function FooterColumn({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col gap-4"
    >
      <h4
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#48cfad' }}
      >
        {title}
      </h4>
      <div className="flex flex-col gap-3">{children}</div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const CARD_OVERLAP = 110; // px the CTA card dips into the footer

export default function FooterCTA({ onInitiate }: { onInitiate: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const particles = Array.from({ length: 40 });

  // Refs
  const sectionRef  = useRef(null);
  const footerRef   = useRef(null);
  const titleRef    = useRef(null);
  const subtitleRef = useRef(null);
  const buttonRef   = useRef(null);

  // InView triggers
  const titleInView    = useInView(titleRef,    { once: true, margin: '-80px' });
  const subtitleInView = useInView(subtitleRef, { once: true, margin: '-80px' });
  const buttonInView   = useInView(buttonRef,   { once: true, margin: '-80px' });
  const footerInView   = useInView(footerRef,   { once: true, margin: '-40px' });

  // Parallax
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const bgY       = useTransform(scrollYProgress, [0, 1],           ['0%', '-15%']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.6]);

  // Letter-by-letter title
  const titleText = 'Light in the Dark';
  const letters   = titleText.split('');

  return (
    <div className="relative">

      {/* ══════════════════════════════════════════════════════
          CTA CARD — floats above the footer, overlapping it
      ══════════════════════════════════════════════════════ */}
      <div
        className="relative z-20 px-4 md:px-8"
        style={{ marginBottom: `-${CARD_OVERLAP}px` }}
      >
        {/* Card shell */}
        <div
          className="max-w-5xl mx-auto rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(150deg, rgba(14,12,35,0.98) 0%, rgba(8,8,22,0.99) 100%)',
            border: '1px solid rgba(108,99,255,0.22)',
            boxShadow: [
              '0 0 0 1px rgba(72,207,173,0.04)',
              '0 8px 32px rgba(0,0,0,0.65)',
              '0 40px 90px rgba(0,0,0,0.45)',
              '0 0 90px rgba(108,99,255,0.13)',
              'inset 0 1px 0 rgba(108,99,255,0.13)',
            ].join(', '),
          }}
        >
          <section
            ref={sectionRef}
            className="relative w-full min-h-[60vh] flex flex-col items-center justify-center overflow-hidden py-24 z-10"
          >
            {/* Parallax gradient layer */}
            <motion.div
              style={{ y: bgY, opacity: bgOpacity }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-[#0a0a1a] to-transparent" />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse, rgba(108,99,255,0.08) 0%, transparent 70%)',
                  filter: 'blur(60px)',
                }}
              />
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse, rgba(72,207,173,0.06) 0%, transparent 70%)',
                  filter: 'blur(50px)',
                }}
              />
            </motion.div>

            {/* Background logo watermark */}
            <motion.img
              src="./bglogo.webp"
              alt=""
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={titleInView ? { opacity: 0.1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] md:h-[600px] md:w-[600px] object-contain z-0 pointer-events-none"
            />

            {/* ── Title — letter by letter ── */}
            <div ref={titleRef} className="relative text-center z-10 mb-6 px-4 overflow-hidden">
              <h2 className="text-4xl md:text-6xl font-light text-white">
                {letters.map((char, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 60, rotateX: -90 }}
                    animate={titleInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                    transition={{ duration: 0.6, delay: i * 0.03, ease: [0.23, 1, 0.32, 1] }}
                    style={{ display: 'inline-block', whiteSpace: 'pre' }}
                  >
                    {char}
                  </motion.span>
                ))}
              </h2>
              {/* Animated underline */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={titleInView ? { scaleX: 1, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  height: '1px',
                  marginTop: '12px',
                  background: 'linear-gradient(90deg, transparent, #6c63ff 30%, #48cfad 70%, transparent)',
                  boxShadow: '0 0 12px rgba(108,99,255,0.5)',
                  transformOrigin: 'center',
                }}
              />
            </div>

            {/* ── Subtitle — slide + blur ── */}
            <div ref={subtitleRef} className="relative text-center z-10 mb-16 px-4">
              <motion.p
                initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                animate={subtitleInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="text-zinc-400 max-w-lg mx-auto text-lg md:text-xl font-light"
              >
                Step out of the loop. Begin your diagnostic to reveal your baseline.
              </motion.p>
            </div>

            {/* ── Button — scale + glow rise ── */}
            <div ref={buttonRef}>
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.85 }}
                animate={buttonInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
              >
                <div
                  className="relative z-10 flex items-center justify-center w-64 h-15"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {/* Swarm particles */}
                  <AnimatePresence>
                    {isHovered &&
                      particles.map((_, i) => {
                        const angle    = Math.random() * Math.PI * 2;
                        const distance = Math.random() * 100 + 50;
                        const startX   = Math.cos(angle) * distance;
                        const startY   = Math.sin(angle) * distance;
                        return (
                          <motion.div
                            key={i}
                            initial={{ x: startX, y: startY, opacity: 0, scale: 0 }}
                            animate={{
                              x: (Math.random() - 0.5) * 20,
                              y: (Math.random() - 0.5) * 20,
                              opacity: [0, 0.8, 0],
                              scale: Math.random() * 1.5 + 0.5,
                            }}
                            exit={{ opacity: 0, scale: 0, x: startX * 1.5, y: startY * 1.5 }}
                            transition={{
                              duration: Math.random() * 0.8 + 0.4,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none mix-blend-screen"
                            style={{ marginLeft: -3, marginTop: -3, background: '#48cfad' }}
                          />
                        );
                      })}
                  </AnimatePresence>

                  {/* Glowing button */}
                  <motion.button
                    onClick={onInitiate}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative px-10 py-5 bg-zinc-950 rounded-full text-white overflow-visible group transition-all duration-300"
                    style={{ border: '1px solid rgba(108,99,255,0.5)' }}
                  >
                    <span className="relative z-10 tracking-wider uppercase text-sm">
                      Initiate Protocol
                    </span>
                    <div
                      className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'rgba(108,99,255,0.1)' }}
                    />
                    <div
                      className="absolute -inset-4 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                      style={{ background: 'rgba(72,207,173,0.2)' }}
                    />
                    <div
                      className="absolute -inset-1 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
                      style={{ background: 'rgba(108,99,255,0.35)' }}
                    />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </section>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FOOTER — dark layer, card floats on top of it
      ══════════════════════════════════════════════════════ */}
      <footer
        ref={footerRef}
        className="relative w-full z-10 overflow-hidden items-center justify-center"
        style={{
          background: 'rgba(6, 6, 18, 0.98)',
          paddingTop: `${CARD_OVERLAP + 56}px`, // overlap + breathing room
        }}
      >


        

        {/* Ambient top glow (sits behind the card, subtle) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[260px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(108,99,255,0.07) 0%, transparent 70%)',
            filter: 'blur(48px)',
          }}
        />

        {/* Gradient separator line — appears right where the card ends */}
        <div
          className="absolute w-full h-px pointer-events-none"
          style={{
            top: `${CARD_OVERLAP}px`,
            background:
              'linear-gradient(90deg, transparent 0%, #6c63ff 30%, #48cfad 60%, transparent 100%)',
            opacity: 0.6,
          }}
        />

        {/* ── 4-column grid ── */}
        <div className="max-w-7xl mx-auto px-8 pt-14 pb-10 md:pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">

  {/* Brand Section */}
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={footerInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    className="flex flex-col items-center text-center md:col-span-1"
  >
    <img
      src="./ftlogo.webp"
      alt="Studiction"
      className="w-16 h-16 object-contain mb-4"
    />

    <span
      className="text-2xl font-bold tracking-tight"
      style={{
        background: 'linear-gradient(90deg, #6c63ff, #48cfad)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      Studiction
    </span>

    <p className="text-zinc-500 text-sm italic mt-2 max-w-xs">
      "Reclaim your mind. One step at a time."
    </p>
  </motion.div>

  {/* Information */}
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={footerInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
    className="flex flex-col gap-4"
  >
    <h3
      className="text-sm font-semibold tracking-[0.2em] uppercase"
      style={{ color: '#48cfad' }}
    >
      Information
    </h3>

    <div className="flex flex-col gap-2 text-zinc-500 text-sm">
      <span>KKKUK, Karak</span>
      <span>Khyber Pakhtunkhwa, Pakistan</span>
    </div>

    <motion.a
      href="mailto:studiction@kkku.edu.pk"
      className="flex items-center gap-2 text-zinc-500 text-sm group w-fit"
      whileHover={{ x: 3 }}
      transition={{ duration: 0.2 }}
    >
      <Mail
        size={14}
        className="group-hover:text-[#48cfad] transition-colors duration-300"
      />
      <span className="group-hover:text-[#48cfad] transition-colors duration-300">
        studiction@kkku.edu.pk
      </span>
    </motion.a>

    <div className="flex items-center gap-2 text-zinc-600 text-sm">
      <span>Built with</span>

      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Heart
          size={12}
          style={{ color: '#6c63ff' }}
          fill="#6c63ff"
        />
      </motion.div>

      <span>by Owais & Abdullah</span>
    </div>
  </motion.div>

  {/* Social */}
  <FooterColumn title="Social" delay={0.2}>
    {socialLinks.map(link => (
      <FooterLink
        key={link.label}
        label={link.label}
        href={link.href}
        icon={link.icon}
      />
    ))}
  </FooterColumn>

</div>

          {/* ── Bottom bar ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={footerInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-zinc-700 text-xs">© 2026 Studiction · All rights reserved</span>
            <span
              className="text-xs font-light tracking-widest uppercase"
              style={{
                background: 'linear-gradient(90deg, #6c63ff, #48cfad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              KKKUK Final Year Project · 2022 – 2026
            </span>
            <span className="text-zinc-700 text-xs">Designed for clarity. Built with empathy.</span>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}