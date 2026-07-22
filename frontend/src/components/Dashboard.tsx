import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle2, Circle, ChevronRight, Flame, Brain, Shield, AlertTriangle, Zap } from 'lucide-react';
import * as api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier  = 'low' | 'moderate' | 'high';
type Stage = 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';

interface AIProfile {
  tier:          Tier;
  stage:         Stage;
  score:         number;
  summary:       string;
  recoverySteps: string[];
  todaysTask:    string;
  thirtyDayPlan: string;
  triggers:      string[];
  riskApps:      string[];
  riskTimes:     string[];
}

interface DashboardProps {
  tier:                Tier;
  stage:               Stage;
  score:               number;
  summary:             string;
  addictionType?:      'digital' | 'nicotine' | 'both';
  hasResult?:          boolean;
  onBeginAssessment?:  () => void;
  conversationHistory?: { role: string; content: string }[];
  userName?:           string;
  userEmail?:          string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<Tier, {
  label:       string;
  color:       string;
  glow:        string;
  bg:          string;
  icon:        typeof Shield;
  description: string;
}> = {
  low:      { label: 'Low Risk',      color: '#48cfad', glow: 'rgba(72,207,173,0.3)',  bg: 'rgba(72,207,173,0.08)',  icon: Shield,        description: 'You are in a maintenance phase. Awareness is your strongest tool.' },
  moderate: { label: 'Moderate Risk', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.08)',  icon: AlertTriangle, description: 'Active intervention will significantly improve your digital wellbeing.' },
  high:     { label: 'High Risk',     color: '#ef4444', glow: 'rgba(239,68,68,0.3)',   bg: 'rgba(239,68,68,0.08)',   icon: Zap,           description: 'Your patterns need immediate attention. You are ready to change.' },
};

const STAGE_LABELS: Record<Stage, string> = {
  'pre-contemplation': 'Pre-Contemplation',
  'contemplation':     'Contemplation',
  'preparation':       'Preparation',
  'action':            'Action',
  'maintenance':       'Maintenance',
};

const STAGE_DESC: Record<Stage, string> = {
  'pre-contemplation': 'Not yet aware of the full impact',
  'contemplation':     'Recognizing the problem exists',
  'preparation':       'Getting ready to make changes',
  'action':            'Actively working on recovery',
  'maintenance':       'Sustaining healthy digital habits',
};

const ADDICTION_TYPE_CONFIG: Record<'digital' | 'nicotine' | 'both', { label: string; color: string; bg: string }> = {
  digital:  { label: 'Digital Recovery',    color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
  nicotine: { label: 'Nicotine Recovery',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  both:     { label: 'Dual-Track Recovery', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};


// const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

// ─── Severity Ring ────────────────────────────────────────────────────────────

function SeverityRing({ score, tier }: { score: number; tier: Tier }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const cfg    = TIER_CONFIG[tier];
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (animatedScore / 100) * circ;

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = () => {
        start += 1.5;
        if (start >= score) { setAnimatedScore(score); return; }
        setAnimatedScore(Math.round(start));
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 600);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Glow pulse */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)` }}
        />

        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
          {/* Track */}
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          {/* Progress */}
          <motion.circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={cfg.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${cfg.color})`, transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>

        {/* Center score */}
        <div className="relative z-10 text-center">
          <p className="text-3xl font-bold font-mono" style={{ color: cfg.color }}>{animatedScore}</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest">severity</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-zinc-500">Score reflects addiction intensity</p>
        <p className="text-[10px] text-zinc-700 mt-0.5">0 = none · 100 = severe</p>
      </div>
    </div>
  );
}

// ─── TTM Stage Strip ──────────────────────────────────────────────────────────

function StageStrip({ stage }: { stage: Stage }) {
  const stages: Stage[] = ['pre-contemplation', 'contemplation', 'preparation', 'action', 'maintenance'];
  const idx = stages.indexOf(stage);

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-3">
        <Brain size={14} className="text-zinc-500" />
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Recovery Stage</p>
      </div>
      <div className="flex items-center">
        {stages.map((s, i) => {
          const isPast    = i < idx;
          const isCurrent = i === idx;
          return (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 300 }}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background:  isPast ? '#48cfad' : isCurrent ? '#48cfad' : 'rgba(255,255,255,0.1)',
                    boxShadow:   isCurrent ? '0 0 12px rgba(72,207,173,0.9)' : 'none',
                    transform:   isCurrent ? 'scale(1.4)' : 'scale(1)',
                    transition:  'all 0.3s',
                  }}
                />
                <p className="text-[8px] text-center leading-tight"
                  style={{ color: isCurrent ? '#48cfad' : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', fontWeight: isCurrent ? 600 : 400 }}>
                  {STAGE_LABELS[s].split('-').join('\n')}
                </p>
              </div>
              {i < stages.length - 1 && (
                <div className="h-px flex-1 mb-4 mx-1"
                  style={{ background: i < idx ? 'linear-gradient(90deg, #48cfad, #48cfad80)' : 'rgba(255,255,255,0.06)' }} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-zinc-400 mt-3 text-center">{STAGE_DESC[stage]}</p>
    </div>
  );
}

// ─── Trigger Pattern Card ─────────────────────────────────────────────────────

function TriggerCard({ triggers, riskApps, riskTimes, tier, addictionType }: {
  triggers:  string[];
  riskApps:  string[];
  riskTimes: string[];
  tier:      Tier;
  addictionType?: 'digital' | 'nicotine' | 'both';
}) {
  const cfg = TIER_CONFIG[tier];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border border-white/8 backdrop-blur-md p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        boxShadow:  `0 0 30px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-5 rounded-full" style={{ background: `linear-gradient(180deg, ${cfg.color}, ${cfg.color}40)` }} />
        <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Your Trigger Patterns</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Emotional triggers */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">Emotions</p>
          <div className="flex flex-col gap-1">
            {triggers.slice(0, 3).map((t, i) => (
              <span key={i} className="text-xs text-zinc-300 flex items-center gap-1">
                <span style={{ color: cfg.color }}>·</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Risk apps */}
       <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">{addictionType === 'nicotine' ? 'Risk Situations' : 'Risk Apps'}</p>
          <div className="flex flex-col gap-1">
            {riskApps.slice(0, 3).map((a, i) => (
              <span key={i} className="text-xs text-zinc-300 flex items-center gap-1">
                <span style={{ color: cfg.color }}>·</span> {a}
              </span>
            ))}
          </div>
        </div>

        {/* Risk times */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">Risk Times</p>
          <div className="flex flex-col gap-1">
            {riskTimes.slice(0, 3).map((t, i) => (
              <span key={i} className="text-xs text-zinc-300 flex items-center gap-1">
                <span style={{ color: cfg.color }}>·</span> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Today's Task Card ────────────────────────────────────────────────────────

function TaskCard({ task, tier }: { task: string; tier: Tier }) {
  const [done, setDone] = useState(false);
  const cfg = TIER_CONFIG[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border border-white/8 backdrop-blur-md overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        boxShadow:  `0 0 40px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 rounded-full" style={{ background: `linear-gradient(180deg, ${cfg.color}, ${cfg.color}40)` }} />
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Today's First Task</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">AI-generated · CBT intervention</p>
          </div>
        </div>
        <Flame size={16} className="text-orange-400" />
      </div>

      <div className="px-5 pb-5">
        <p className="text-zinc-200 text-sm leading-relaxed border-l-2 pl-4 py-1 mb-4"
          style={{ borderColor: `${cfg.color}50` }}>
          {task}
        </p>

        <motion.button
          onClick={() => setDone(d => !d)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300"
          style={{
            background: done ? `${cfg.color}15` : 'rgba(255,255,255,0.04)',
            border:     `1px solid ${done ? cfg.color + '40' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <AnimatePresence mode="wait">
            {done
              ? <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <CheckCircle2 size={16} style={{ color: cfg.color }} />
                </motion.div>
              : <motion.div key="undone" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Circle size={16} className="text-zinc-600" />
                </motion.div>
            }
          </AnimatePresence>
          <span className="text-sm" style={{ color: done ? cfg.color : 'rgba(255,255,255,0.35)' }}>
            {done ? 'Task completed — excellent start.' : 'Mark as done'}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Recovery Steps ───────────────────────────────────────────────────────────

function RecoverySteps({ steps, tier }: { steps: string[]; tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border border-white/8 backdrop-blur-md p-5"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">Your 3-Step Recovery Path</p>
      </div>
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="flex gap-3 items-start"
          >
            <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono mt-0.5"
              style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
              {i + 1}
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{step}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── 30-Day Plan ──────────────────────────────────────────────────────────────

function ThirtyDayPlan({ plan, tier }: { plan: string; tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border border-white/8 backdrop-blur-md p-5"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-400 uppercase tracking-widest font-medium">What to Expect in 30 Days</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
          AI Projection
        </span>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{plan}</p>
      <div className="mt-4 h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}40, transparent)` }} />
      <p className="text-[10px] text-zinc-600 mt-3 text-center">Reassess in 30 days to track your real progress</p>
    </motion.div>
  );
}

// ─── PDF Download ─────────────────────────────────────────────────────────────

async function downloadPDF(profile: AIProfile, userName?: string, userEmail?: string) {
  // Dynamic import jsPDF
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const margin = 20;
  let y = 20;

  // Helper: add text with word wrap
  const addText = (text: string, x: number, yPos: number, size: number, color: [number,number,number], maxWidth = W - margin * 2) => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPos);
    return yPos + (lines.length * size * 0.4) + 3;
  };

  // Background
  doc.setFillColor(10, 12, 18);
  doc.rect(0, 0, W, 297, 'F');

  // Header bar
  doc.setFillColor(30, 35, 45);
  doc.rect(0, 0, W, 35, 'F');

  // Title
  doc.setFontSize(20);
  doc.setTextColor(72, 207, 173);
  doc.text('STUDICTION', margin, 15);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 140);
  doc.text('Digital Addiction Recovery Profile', margin, 22);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 28);

  // Identity block — right side of header bar
  if (userName || userEmail) {
    doc.setFontSize(10);
    doc.setTextColor(220, 220, 240);
    if (userName) doc.text(userName, W - margin, 15, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    if (userEmail) doc.text(userEmail, W - margin, 21, { align: 'right' });
  }

  y = 50;

  // Tier badge
  const tierColors: Record<Tier, [number,number,number]> = {
    low:      [72, 207, 173],
    moderate: [245, 158, 11],
    high:     [239, 68, 68],
  };
  const tc = tierColors[profile.tier];
  doc.setFillColor(...tc);
  doc.setFillColor(tc[0], tc[1], tc[2]);
  doc.roundedRect(margin, y, 60, 12, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(10, 12, 18);
  doc.text(TIER_CONFIG[profile.tier].label.toUpperCase(), margin + 5, y + 8);

  doc.setFontSize(10);
  doc.setTextColor(180, 180, 200);
  doc.text(`Severity Score: ${profile.score}/100`, margin + 70, y + 8);
  doc.text(`Stage: ${STAGE_LABELS[profile.stage]}`, margin + 130, y + 8);

  y += 22;

  // Summary
  doc.setFillColor(20, 24, 34);
  doc.roundedRect(margin, y, W - margin * 2, 20, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 220);
  const summaryLines = doc.splitTextToSize(profile.summary, W - margin * 2 - 10);
  doc.text(summaryLines, margin + 5, y + 8);
  y += 28;

  // Trigger patterns
  y = addText('TRIGGER PATTERNS', margin, y, 8, [72, 207, 173]);
  doc.setDrawColor(72, 207, 173);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 180);
  doc.text('Emotional Triggers:', margin, y);
  doc.text('Risk Apps:', margin + 60, y);
  doc.text('Risk Times:', margin + 120, y);
  y += 5;

  const maxRows = Math.max(profile.triggers.length, profile.riskApps.length, profile.riskTimes.length);
  for (let i = 0; i < Math.min(maxRows, 3); i++) {
    doc.setTextColor(220, 220, 240);
    if (profile.triggers[i])  doc.text(`• ${profile.triggers[i]}`,  margin,      y);
    if (profile.riskApps[i])  doc.text(`• ${profile.riskApps[i]}`,  margin + 60, y);
    if (profile.riskTimes[i]) doc.text(`• ${profile.riskTimes[i]}`, margin + 120, y);
    y += 5;
  }
  y += 5;

  // Recovery steps
  y = addText('3-STEP RECOVERY PATH', margin, y, 8, [72, 207, 173]);
  doc.line(margin, y, W - margin, y);
  y += 5;

  profile.recoverySteps.forEach((step, i) => {
    doc.setFillColor(30, 35, 50);
    const stepLines = doc.splitTextToSize(`${i + 1}. ${step}`, W - margin * 2 - 10);
    const stepH = stepLines.length * 4 + 6;
    doc.roundedRect(margin, y, W - margin * 2, stepH, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 240);
    doc.text(stepLines, margin + 5, y + 5);
    y += stepH + 3;
  });
  y += 4;

  // Today's task
  y = addText("TODAY'S FIRST TASK", margin, y, 8, [72, 207, 173]);
  doc.line(margin, y, W - margin, y);
  y += 5;

  doc.setFillColor(20, 30, 25);
  const taskLines = doc.splitTextToSize(profile.todaysTask, W - margin * 2 - 10);
  const taskH = taskLines.length * 4 + 8;
  doc.roundedRect(margin, y, W - margin * 2, taskH, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(72, 207, 173);
  doc.text(taskLines, margin + 5, y + 6);
  y += taskH + 8;

  // 30-day plan
  y = addText('30-DAY PROJECTION', margin, y, 8, [72, 207, 173]);
  doc.line(margin, y, W - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 220);
  const planLines = doc.splitTextToSize(profile.thirtyDayPlan, W - margin * 2);
  doc.text(planLines, margin, y);
  y += planLines.length * 4 + 10;

  // Footer
  doc.setFillColor(20, 24, 34);
  doc.rect(0, 280, W, 17, 'F');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 100);
  doc.text('This report is generated by Studiction AI and is for personal recovery guidance only. Not a clinical diagnosis.', margin, 289);

  doc.save('studiction-recovery-profile.pdf');
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard({
  tier                = 'moderate',
  stage               = 'action',
  score               = 0,
  summary             = '',
  addictionType       = 'digital',
  hasResult           = false,
  onBeginAssessment,
  conversationHistory = [],
  userName,
  userEmail,
}: DashboardProps) {
  const [profile,    setProfile]    = useState<AIProfile | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const generated = useRef(false);

  // ── Generate full profile via Groq ─────────────────────────────────────────

  useEffect(() => {
    if (generated.current) return;
    generated.current = true;

    const generate = async () => {
      setIsLoading(true);

      // Build a readable transcript from the actual conversation
  const transcript = conversationHistory
    .filter(m => !m.content.startsWith('{')) // skip raw JSON assistant turns
    .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.replace(/\[Exchange count:.*?\]/g, '').trim()}`)
    .join('\n');

  const isNicotine = addictionType === 'nicotine';
  const domainLabel = addictionType === 'both' ? 'digital and nicotine addiction' : isNicotine ? 'nicotine addiction' : 'digital addiction';
  const riskFieldInstruction = isNicotine
    ? '"riskApps": ["specific smoking situation/trigger they mentioned, e.g. after meals, morning coffee, social settings — NOT app names"]'
    : addictionType === 'both'
    ? '"riskApps": ["app OR smoking situation they specifically mentioned, whichever applies", "second one", "third one"]'
    : '"riskApps": ["app they specifically mentioned", "second app", "third app"]';

  const prompt = `You are analyzing a real ${domainLabel} assessment conversation.
ACTUAL CONVERSATION TRANSCRIPT:
${transcript || 'No conversation available.'}
ASSESSMENT RESULT:

Risk Level: ${TIER_CONFIG[tier].label}
Recovery Stage: ${STAGE_LABELS[stage]}
Severity Score: ${score}/100
Summary: ${summary}

Based on what the user ACTUALLY said in the conversation above, generate a deeply personalized recovery profile.
Extract the specific triggers, emotions, times, and situations they mentioned — do NOT use generic placeholders.
${isNicotine ? 'This is a nicotine-focused conversation — do NOT invent app names. Use real smoking triggers/situations instead.' : 'If they mentioned Instagram, use Instagram. If they mentioned stress before bed, use that exactly.'}
Return ONLY raw JSON, no markdown, no backticks:
{
"recoverySteps": [
"Step 1 — specific to what this user shared (1-2 sentences)",
"Step 2 — references their actual situation",
"Step 3 — actionable for their exact stage"
],
"todaysTask": "One very specific CBT task directly tied to what they shared (2-3 sentences)",
"thirtyDayPlan": "Warm, realistic paragraph referencing their specific challenges (3-4 sentences)",
"triggers": ["exact emotion they mentioned", "another trigger from conversation", "third trigger"],
${riskFieldInstruction},
"riskTimes": ["exact time pattern they mentioned", "second pattern", "third pattern"]
}
CRITICAL: Every field must reflect what THIS user actually said. No generic content.`;

     try {
        const data = await api.callAI({
          model:       'llama-3.3-70b-versatile',
          max_tokens:  1000,
          messages: [
            { role: 'system', content: 'You are a clinical AI. Return only valid JSON, no markdown, no backticks.' },
            { role: 'user',   content: prompt },
          ],
        });

        const raw  = data.choices?.[0]?.message?.content || '';
        const clean = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(clean);

        setProfile({
          tier, stage, score, summary,
          recoverySteps: parsed.recoverySteps || [],
          todaysTask:    parsed.todaysTask    || '',
          thirtyDayPlan: parsed.thirtyDayPlan || '',
          triggers:      parsed.triggers      || [],
          riskApps:      parsed.riskApps      || [],
          riskTimes:     parsed.riskTimes     || [],
        });
      } catch {
        // Fallback profile — branches by addiction type so a nicotine-track user
        // never sees "Instagram/TikTok" as a fallback trigger.
        setProfile(isNicotine ? {
          tier, stage, score, summary,
          recoverySteps: [
            'Delay your first cigarette of the day by 15 minutes, and track how it feels using a simple note.',
            'Practice the 90-second pause rule — before lighting up, wait 90 seconds and notice what triggered the urge.',
            'Replace one habitual smoking moment (e.g., after a meal) with a short walk or a drink of water.',
          ],
          todaysTask:    'Before your next cigarette today, write one sentence about what triggered the urge. If you cannot answer, wait 5 minutes and do something else first.',
          thirtyDayPlan: 'In 30 days of consistent practice, you can expect a noticeable reduction in automatic, trigger-driven smoking. Physical cravings typically ease as your body adjusts. You will begin to notice your specific triggers more clearly. The urges will still come, but you will have tools to respond rather than react.',
          triggers:      ['Stress', 'Habit after meals', 'Social settings'],
          riskApps:      ['After meals', 'Morning coffee', 'Social gatherings'],
          riskTimes:     ['Early morning', 'After meals', 'Late evening'],
        } : {
          tier, stage, score, summary,
          recoverySteps: [
            'Set a daily screen time limit of 2 hours for social media apps using your phone settings.',
            'Practice the 90-second pause rule — before opening any app, wait 90 seconds and notice what emotion triggered the urge.',
            'Replace the first 30 minutes of your morning with a non-digital activity to reset your baseline.',
          ],
          todaysTask:    'Before opening any social media app today, write one sentence about why you want to open it. If you cannot answer, close the app and do something physical for 5 minutes.',
          thirtyDayPlan: 'In 30 days of consistent practice, you can expect to notice a significant reduction in compulsive checking behavior. Your sleep quality will likely improve as late-night scrolling decreases. You will begin to feel more present in conversations and activities. The urges will still come, but you will have tools to respond rather than react.',
          triggers:      ['Stress', 'Boredom', 'Loneliness'],
          riskApps:      ['Instagram', 'TikTok', 'YouTube'],
          riskTimes:     ['Late night', 'After meals', 'Morning wake-up'],
        });
      }

      setIsLoading(false);
    };

    generate();
  }, [tier, stage, score, summary]);

  const cfg = TIER_CONFIG[tier];
  const TierIcon = cfg.icon;

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-4 h-4 rounded-full bg-[#48cfad]"
          style={{ boxShadow: '0 0 24px rgba(72,207,173,0.8)' }}
        />
        <div className="text-center">
          <p className="text-sm text-zinc-300 font-medium">Synthesizing your recovery profile</p>
          <p className="text-xs text-zinc-600 mt-1">AI is personalizing your results...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Inside the component, right after the loading check:
if (!isLoading && !hasResult) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-md w-full text-center"
      >
        {/* Pulsing orb */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{
            background: 'rgba(72,207,173,0.1)',
            border: '1px solid rgba(72,207,173,0.3)',
            boxShadow: '0 0 40px rgba(72,207,173,0.2)',
          }}
        >
          <Brain size={28} style={{ color: '#48cfad' }} />
        </motion.div>

        <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium mb-3">
          No Profile Found
        </p>
        <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">
          Your profile isn't ready yet.
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          Complete your AI diagnostic assessment first. It takes about 5 minutes and unlocks your personalized recovery profile.
        </p>

        <motion.button
          onClick={onBeginAssessment}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-semibold text-zinc-900"
          style={{
            background: 'linear-gradient(135deg, #48cfad, #3ab595)',
            boxShadow: '0 0 30px rgba(72,207,173,0.35)',
          }}
        >
          Begin Your Assessment
          <ChevronRight size={16} />
        </motion.button>

        <p className="text-[10px] text-zinc-700 mt-5">
          Free · Private · AI Powered
        </p>
      </motion.div>
    </div>
  );
}

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full relative">
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-24 pb-16">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium mb-1">Assessment Complete</p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Your Recovery Profile</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-3"
            style={{
              background: ADDICTION_TYPE_CONFIG[addictionType].bg,
              border:     `1px solid ${ADDICTION_TYPE_CONFIG[addictionType].color}40`,
              color:      ADDICTION_TYPE_CONFIG[addictionType].color,
            }}
          >
            {ADDICTION_TYPE_CONFIG[addictionType].label}
          </div>
        </motion.div>

        {/* ── Hero card — Tier + Ring + Stage ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-2xl border border-white/8 backdrop-blur-md p-6 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
            boxShadow:  `0 0 60px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
          }}
        >
          {/* Top row — tier badge + ring */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              {/* Tier */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.color}40` }}>
                  <TierIcon size={18} style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Current Status</p>
                  <p className="text-lg font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                </div>
              </div>

              {/* Summary */}
              <p className="text-sm text-zinc-400 leading-relaxed">{summary}</p>
            </div>

            {/* Severity ring */}
            <SeverityRing score={score} tier={tier} />
          </div>

          {/* Stage strip */}
          <div className="pt-5 border-t border-white/5">
            <StageStrip stage={stage} />
          </div>
        </motion.div>

        {/* ── Trigger Pattern Card ── */}
        <div className="mb-4">
          <TriggerCard
            triggers={profile.triggers}
            riskApps={profile.riskApps}
            riskTimes={profile.riskTimes}
            tier={tier}
            addictionType={addictionType}
          />
        </div>

        {/* ── Today's Task ── */}
        <div className="mb-4">
          <TaskCard task={profile.todaysTask} tier={tier} />
        </div>

        {/* ── Recovery Steps ── */}
        <div className="mb-4">
          <RecoverySteps steps={profile.recoverySteps} tier={tier} />
        </div>

        {/* ── 30-Day Plan ── */}
        <div className="mb-6">
          <ThirtyDayPlan plan={profile.thirtyDayPlan} tier={tier} />
        </div>

        {/* ── PDF Download button ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          <motion.button
           onClick={async () => {
                setPdfLoading(true);
                await downloadPDF(profile, userName, userEmail);
                setPdfLoading(false);
              }}
            disabled={pdfLoading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300"
            style={{
              background: pdfLoading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, rgba(72,207,173,0.15), rgba(72,207,173,0.08))',
              border:     `1px solid ${pdfLoading ? 'rgba(255,255,255,0.08)' : 'rgba(72,207,173,0.4)'}`,
              color:      pdfLoading ? 'rgba(255,255,255,0.3)' : '#48cfad',
              boxShadow:  pdfLoading ? 'none' : '0 0 20px rgba(72,207,173,0.15)',
            }}
          >
            {pdfLoading
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 rounded-full border border-zinc-600 border-t-zinc-300" />
              : <Download size={15} />
            }
            {pdfLoading ? 'Generating PDF...' : 'Download Your Report'}
          </motion.button>

          <div className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-zinc-700" />
            <p className="text-[10px] text-zinc-700">Reassess in 30 days to track your real progress</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
