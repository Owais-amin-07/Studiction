import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, MessageSquare, Keyboard, ChevronRight } from 'lucide-react';
import * as api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id:     string;
  sender: 'ai' | 'user';
  text:   string;
}

interface AITurn {
  message: string;
  options: string[];
}

interface DiagnosticResult {
  tier:    'low' | 'moderate' | 'high';
  stage:   'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
  score:   number;
  summary: string;
  addictionType?: 'digital' | 'nicotine' | 'both';
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}

interface DiagnosticChatProps {
  onComplete: (result: DiagnosticResult) => void;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Sage — a warm recovery companion inside Studiction. You talk like a caring friend, not a doctor or a form.

STRICT RULES:
- ALWAYS respond with ONLY raw JSON — no markdown, no backticks, nothing outside JSON.
- Format: {"message": "your question", "options": ["option1", "option2", "option3", "option4"]}
- ONE question per turn. ONE question mark only. Never ask two things at once.
- EXACTLY 10 TO 12 WORDS in your question. Hard limit. Count every single word. Rewrite until it fits.
- Use simple everyday English. No big words. A 14-year-old should understand easily.
- Always acknowledge what the user just said before your next question. Show you listened.
- Your options must directly follow from what the user just answered. Never repeat options from earlier turns.
- Options are first-person, max 8 words each: "I feel...", "It makes me...", "I usually..."

STEP 1 — FIRST MESSAGE (always ask this before anything else):
Ask what's mainly been on their mind, offering both digital and physical options.
Example: {"message": "What's mainly been on your mind lately?", "options": ["My phone or screen habits", "Smoking or nicotine, honestly", "A bit of both", "Not totally sure yet"]}
Based on their answer, follow DIGITAL TRACK, NICOTINE TRACK, or touch both lightly if they say "both" (blend 2-3 questions from each instead of running one full track).

=== DIGITAL TRACK ===
WHAT TO EXPLORE naturally — follow the conversation, not this order:
Which exact app or device takes most time | How many hours a day roughly | How it affects sleep | Impact on work study or relationships | How they feel without their phone | Past attempts to stop | Physical effects like headaches or eye strain | How ready they feel to change

DIGITAL SCORING (pick one only):
DAILY TIME: Under 2h=5 | 2-3h=10 | 3-5h=18 | 5-7h=26 | 7-9h=32 | Over 9h=38
SLEEP: No problem=0 | Few nights a week=5 | Most nights delays 30+min=10 | Loses 1-2h regularly=16 | Awake past midnight most nights=22
RELATIONSHIPS/WORK: No impact=0 | Mild distraction=5 | One area affected=10 | Multiple areas suffering=16 | Serious consequences=22
FEELINGS WITHOUT PHONE: Fine=0 | Slightly restless=4 | Noticeably anxious=10 | Hard to concentrate=16 | Panic or discomfort=20
PAST QUIT ATTEMPTS: Never needed=2 | Once, week+=4 | Once, relapsed days=7 | Many, relapsed=11 | Can't last hours=15
PHYSICAL SYMPTOMS: None=0 | Occasional eye strain=2 | Regular headaches/neck pain=5

=== NICOTINE TRACK ===
Lightly informed by the Fagerström Test for Nicotine Dependence, delivered in Sage's same warm conversational style. Explore naturally:
Time from waking to first cigarette | Cigarettes smoked per day | Difficulty not smoking in restricted places | How hard it'd be to give up the first morning cigarette | Past attempts to quit or cut back

NICOTINE SCORING (pick one only):
TIME TO FIRST CIGARETTE: Within 5min=27 | 6-30min=18 | 31-60min=9 | After 60min=0
CIGARETTES PER DAY: 10 or fewer=0 | 11-20=9 | 21-30=18 | Over 30=27
DIFFICULTY IN RESTRICTED PLACES: No=0 | Yes=9
HARDEST TO GIVE UP: Any other=0 | First morning one=9
PAST QUIT ATTEMPTS: reuse DIGITAL TRACK point values above

SCORING — calculate only at the end:
Add all selected points from whichever track(s) were actually explored. If both tracks were lightly touched, average the digital total and nicotine total into one final score.
tier: low if 0 to 35 | moderate if 36 to 65 | high if 66 to 100
stage: pre-contemplation | contemplation | preparation | action | maintenance — based on how ready they said they are
summary: ONE warm sentence. Must name their specific app/situation OR specific smoking pattern. Not generic.
addictionType: "digital" | "nicotine" | "both" — whichever track(s) were actually explored

COMPLETION — MANDATORY when exchange count reaches 8 or higher:
DO NOT ask another question. Instead write a warm one-sentence closing — like a caring friend saying the journey is starting.
The closing must have NO question mark.
Use exactly this format: {"message": "your warm closing sentence here", "options": []}
Example closing: "You have taken the first step — your recovery journey starts now."
Then on a NEW LINE write exactly:
STUDICTION_RESULT:{"tier":"___","stage":"___","score":___,"summary":"___","addictionType":"___"}

Score must be the real arithmetic sum (or average, if both tracks touched). Never a guess. Never a round number like 50 or 60 unless the math actually gives that.`;

// ─── Sage Avatar ──────────────────────────────────────────────────────────────

function SageAvatar() {
  return (
    <div
      className="flex-shrink-0 mt-1"
      style={{
        width:         '32px',
        height:        '32px',
        borderRadius:  '50%',
        background:    'linear-gradient(135deg, rgba(72,207,173,0.18), rgba(108,99,255,0.18))',
        border:        '1px solid rgba(72,207,173,0.45)',
        boxShadow:     '0 0 14px rgba(72,207,173,0.2)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        flexShrink:    0,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C9.5 3 7.5 4.5 7 6.5C5.5 6.8 4 8.2 4 10C4 11.2 4.6 12.3 5.5 13C5.2 13.6 5 14.3 5 15C5 17.2 6.8 19 9 19H15C17.2 19 19 17.2 19 15C19 14.3 18.8 13.6 18.5 13C19.4 12.3 20 11.2 20 10C20 8.2 18.5 6.8 17 6.5C16.5 4.5 14.5 3 12 3Z"
          stroke="#48cfad" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 3V19M9 8C9 8 10 9 12 9S15 8 15 8M8 13C8 13 9.5 14 12 14S16 13 16 13"
          stroke="#48cfad" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiagnosticChat({ onComplete }: DiagnosticChatProps) {
  const [messages,       setMessages]      = useState<Message[]>([]);
  const [currentOptions, setOptions]       = useState<string[]>([]);
  const [isLoading,      setIsLoading]     = useState(false);
  const [exchangeCount,  setExchangeCount] = useState(0);
  const [inputMode,      setInputMode]     = useState<'options' | 'text' | 'voice'>('options');
  const [textInput,      setTextInput]     = useState('');
  const [isListening,    setIsListening]   = useState(false);
  const [isComplete,     setIsComplete]    = useState(false);
  const [pendingResult,  setPendingResult] = useState<DiagnosticResult | null>(null);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const recognitionRef  = useRef<any>(null);
  const textareaRef     = useRef<HTMLTextAreaElement>(null);
  const chatInitialized = useRef(false);

  // FIX 2: Synchronous double-click guard. React state (isLoading) is async —
  // a ref is mutable immediately and shared across all closures in the same render.
  const isSubmittingRef = useRef(false);

  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Call Groq API ──────────────────────────────────────────────────────────

  const callGroq = useCallback(async (
    currentConversation: { role: 'user' | 'assistant'; content: string }[],
    _currentExchangeCount: number,
  ): Promise<void> => {
    setIsLoading(true);

   try {
      const data = await api.callAI({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  600,
        temperature: 0.85,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...currentConversation,
        ],
      });

      if (data.error) throw new Error(data.error.message || 'API error');

      const raw = data.choices?.[0]?.message?.content || '';

      // ── Completion signal ───────────────────────────────────────────────
      if (raw.includes('STUDICTION_RESULT:')) {
        const parts     = raw.split('STUDICTION_RESULT:');
        const jsonPart  = parts[0].trim();
        const resultRaw = parts[1]?.trim() || '';

        // FIX 1: The final JSON now contains a warm closing (no question, empty options).
        // Show it as the last AI message before the synthesizing animation.
        try {
          const clean = jsonPart.replace(/```json|```/g, '').trim();
          if (clean) {
            const aiTurn: AITurn = JSON.parse(clean);
            const aiMsg: Message = { id: `ai-final-${Date.now()}`, sender: 'ai', text: aiTurn.message };
            setMessages(prev => [...prev, aiMsg]);
            setConversation(prev => [...prev, { role: 'assistant', content: raw }]);
          }
        } catch { /* no closing message in malformed response — acceptable */ }

        setOptions([]);
        // Note: setIsLoading(false) is handled by the finally block below.

        setTimeout(() => {
          setIsComplete(true);
          try {
            const result: DiagnosticResult = JSON.parse(resultRaw);
            setTimeout(() => {
              setPendingResult({ ...result, conversationHistory: currentConversation });
            }, 2500);
          } catch {
            setTimeout(() => {
              setPendingResult({
                tier:    'moderate',
                stage:   'contemplation',
                score:   50,
                summary: 'Assessment complete.',
                addictionType: 'digital',
                conversationHistory: currentConversation,
              });
            }, 2500);
          }
        }, 800);

        return; // finally block still executes — isLoading + isSubmittingRef reset there
      }

      // ── Normal turn ─────────────────────────────────────────────────────
      let aiTurn: AITurn;
      try {
        const clean = raw.replace(/```json|```/g, '').trim();
        aiTurn = JSON.parse(clean);
      } catch {
        aiTurn = {
          message: raw.replace(/[{}"\[\]]/g, '').slice(0, 200).trim()
            || "Tell me a bit more about how you're feeling.",
          options: ["I'm feeling overwhelmed", "It's affecting my sleep", "It's hard to focus", "I'm not sure yet"],
        };
      }

      const aiMsg: Message = { id: `ai-${Date.now()}`, sender: 'ai', text: aiTurn.message };
      setMessages(prev => [...prev, aiMsg]);
      setConversation(prev => [...prev, { role: 'assistant', content: raw }]);
      setOptions(aiTurn.options?.slice(0, 4) || []);

    } catch (err) {
      console.error('Groq error:', err);
      const fallback: Message = {
        id:     `err-${Date.now()}`,
        sender: 'ai',
        text:   "I'm here with you. Let's keep going when you're ready.",
      };
      setMessages(prev => [...prev, fallback]);
      setOptions(["I'm ready to continue", "Give me a moment", "Let's keep going", "I need a break"]);
    } finally {
      // FIX 2: Always reset — both on normal exit, early return, and thrown errors.
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }, [onComplete]);

  // ── Initialize with targeted opener ────────────────────────────────────────

  useEffect(() => {
  if (chatInitialized.current) return;
  chatInitialized.current = true;

  const initConversation = [{ role: 'user' as const, content: 'Begin the assessment.' }];
  setConversation(initConversation);
  callGroq(initConversation, 0);
  }, [callGroq]);

  // ── Handle answer ──────────────────────────────────────────────────────────

  const handleAnswer = useCallback((answer: string) => {
    // FIX 2: Check the ref first — it is set synchronously, unlike isLoading state.
    // This closes the timing window where two fast clicks both see isLoading: false.
    if (isSubmittingRef.current || isLoading || isComplete || !answer.trim()) return;
    isSubmittingRef.current = true; // lock immediately, before any async work

    const newCount = exchangeCount + 1;

    const messageWithCount = newCount >= 8
      ? `${answer.trim()}\n\n[Exchange count: ${newCount} — please complete the assessment now]`
      : `${answer.trim()}\n\n[Exchange count: ${newCount}]`;

    const userMsg: Message = {
      id:     `user-${Date.now()}`,
      sender: 'user',
      text:   answer.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setExchangeCount(newCount);
    setOptions([]);
    setTextInput('');

    const newConversation = [...conversation, { role: 'user' as const, content: messageWithCount }];
    setConversation(newConversation);
    callGroq(newConversation, newCount);
  }, [isLoading, isComplete, exchangeCount, conversation, callGroq]);

  // ── Voice ──────────────────────────────────────────────────────────────────

  const startVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice recognition requires Chrome or Edge.'); return; }
    const r = new SR();
    recognitionRef.current = r;
    r.lang           = 'en-US';
    r.continuous     = false;
    r.interimResults = false;
    r.onstart  = () => setIsListening(true);
    r.onend    = () => setIsListening(false);
    r.onerror  = () => setIsListening(false);
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      if (t.trim()) handleAnswer(t.trim());
    };
    r.start();
  }, [handleAnswer]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const showInputToggle = exchangeCount >= 3;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen w-full relative">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex items-center justify-between px-6 pt-20 pb-3"
      >
        {/* Left — Sage identity */}
        <div className="flex items-center gap-3">
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(72,207,173,0.2), rgba(108,99,255,0.2))',
            border: '1px solid rgba(72,207,173,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(72,207,173,0.15)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C9.5 3 7.5 4.5 7 6.5C5.5 6.8 4 8.2 4 10C4 11.2 4.6 12.3 5.5 13C5.2 13.6 5 14.3 5 15C5 17.2 6.8 19 9 19H15C17.2 19 19 17.2 19 15C19 14.3 18.8 13.6 18.5 13C19.4 12.3 20 11.2 20 10C20 8.2 18.5 6.8 17 6.5C16.5 4.5 14.5 3 12 3Z"
                stroke="#48cfad" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-xs text-zinc-300 font-semibold tracking-wide">Sage</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Recovery Companion</p>
          </div>
        </div>

        {/* Right — Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width:      i < exchangeCount ? '20px' : '6px',
                height:     '6px',
                background: i < exchangeCount
                  ? 'linear-gradient(90deg, #48cfad, #3ab595)'
                  : i === exchangeCount
                  ? 'rgba(72,207,173,0.4)'
                  : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Messages ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 md:px-8 pb-4 no-scrollbar">
        <div className="max-w-2xl mx-auto flex flex-col gap-5 pt-4">

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1,  y: 0,  scale: 1    }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* ── AI message ── */}
                {msg.sender === 'ai' && (
                  <>
                    <SageAvatar />
                    <div
                      className="ml-3 px-5 py-4 rounded-2xl rounded-tl-sm max-w-[78%] leading-relaxed text-sm"
                      style={{
                        background:     'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(12px)',
                        border:         '1px solid rgba(255,255,255,0.07)',
                        borderLeft:     '2px solid rgba(72,207,173,0.5)',
                        color:          'rgba(255,255,255,0.88)',
                        boxShadow:      '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                      }}
                    >
                      {msg.text}
                    </div>
                  </>
                )}

                {/* ── User message ── */}
                {msg.sender === 'user' && (
                  <div
                    className="px-5 py-4 rounded-2xl rounded-tr-sm max-w-[72%] leading-relaxed text-sm font-medium"
                    style={{
                      background:           'linear-gradient(135deg, rgba(72,207,173,0.72), rgba(58,181,149,0.62))',
                      backdropFilter:       'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border:               '1px solid rgba(72,207,173,0.4)',
                      color:                'rgba(255,255,255,0.95)',
                      boxShadow:            '0 4px 20px rgba(72,207,173,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
                    }}
                  >
                    {msg.text}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1,  y: 0  }}
                exit={{   opacity: 0,  y: -5  }}
                className="flex justify-start items-center gap-3"
              >
                <SageAvatar />
                <div
                  className="ml-3 px-5 py-4 rounded-2xl rounded-tl-sm backdrop-blur-md flex gap-1.5 items-center"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border:     '1px solid rgba(255,255,255,0.07)',
                    borderLeft: '2px solid rgba(72,207,173,0.4)',
                  }}
                >
                  {[0, 0.18, 0.36].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#48cfad', opacity: 0.6 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Completion state ── */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1,  scale: 1    }}
                className="flex justify-center py-8"
              >
                {!pendingResult ? (
                  /* Synthesizing animation */
                  <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-5">
                      {[0, 0.4, 0.8].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 rounded-full"
                          animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2.4, repeat: Infinity, delay, ease: 'easeInOut' }}
                          style={{ background: 'rgba(72,207,173,0.3)' }}
                        />
                      ))}
                      <div
                        className="absolute inset-0 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(72,207,173,0.12)',
                          border:     '1px solid rgba(72,207,173,0.5)',
                          boxShadow:  '0 0 20px rgba(72,207,173,0.4)',
                        }}
                      >
                        <div className="w-3 h-3 rounded-full bg-[#48cfad]" />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">
                      Synthesizing your profile...
                    </p>
                  </div>
                ) : (
                  /* View Profile button */
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1,  y: 0  }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className="text-center"
                  >
                    <motion.div
                      className="relative w-16 h-16 mx-auto mb-5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    >
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        border: '1.5px dashed rgba(72,207,173,0.3)',
                      }} />
                      <motion.div
                        className="absolute inset-0 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                          background: 'rgba(72,207,173,0.1)',
                          border:     '1px solid rgba(72,207,173,0.4)',
                          boxShadow:  '0 0 24px rgba(72,207,173,0.3)',
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17L4 12" stroke="#48cfad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    </motion.div>

                    <p className="text-white text-base font-light mb-1 tracking-wide">
                      Your profile is ready.
                    </p>
                    <p className="text-zinc-500 text-xs mb-6">
                      Take a breath — your results are waiting.
                    </p>

                    <motion.button
                      onClick={() => onComplete(pendingResult)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 mx-auto px-8 py-3.5 rounded-full text-sm font-semibold"
                      style={{
                        background: 'linear-gradient(135deg, #48cfad, #3ab595)',
                        color:      '#0a1a14',
                        boxShadow:  '0 0 30px rgba(72,207,173,0.4), 0 4px 16px rgba(0,0,0,0.3)',
                        border:     '1px solid rgba(72,207,173,0.5)',
                      }}
                    >
                      View Your Profile
                      <ChevronRight size={16} />
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input Area ── */}
      {!isComplete && (
        <div className="relative z-10 px-4 md:px-8 pb-8 pt-2">
          <div className="max-w-2xl mx-auto">

            {/* Mode toggle — appears after exchange 3 */}
            <AnimatePresence>
              {showInputToggle && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1,  y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-end mb-3 gap-1.5"
                >
                  {([
                    { mode: 'options' as const, icon: MessageSquare, label: 'Options' },
                    { mode: 'text'    as const, icon: Keyboard,      label: 'Type'    },
                    { mode: 'voice'   as const, icon: Mic,           label: 'Voice'   },
                  ]).map(({ mode, icon: Icon, label }) => (
                    <motion.button
                      key={mode}
                      onClick={() => {
                        setInputMode(mode);
                        if (mode !== 'voice' && isListening) stopVoice();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                      style={{
                        background: inputMode === mode ? 'rgba(72,207,173,0.15)' : 'rgba(255,255,255,0.04)',
                        border:     `1px solid ${inputMode === mode ? 'rgba(72,207,173,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color:      inputMode === mode ? '#48cfad' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      <Icon size={12} />
                      {label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">

              {/* ── Options mode ── */}
              {inputMode === 'options' && !isLoading && currentOptions.length > 0 && (
                <motion.div
                  key="options"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1,  y: 0  }}
                  exit={{   opacity: 0,  y: -8  }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-wrap gap-2.5 justify-center"
                >
                  {currentOptions.map((opt, i) => (
                    <motion.button
                      key={`${opt}-${i}`}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1,  y: 0,  scale: 1    }}
                      transition={{ delay: i * 0.07, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                      whileHover={{
                        scale:       1.03,
                        boxShadow:   '0 0 18px rgba(72,207,173,0.18)',
                        borderColor: 'rgba(72,207,173,0.35)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      // FIX 2: disabled prop also prevents Framer Motion hover/tap when locked
                      disabled={isSubmittingRef.current}
                      onClick={() => handleAnswer(opt)}
                      className="flex items-center px-4 py-3 rounded-2xl text-sm text-zinc-200 backdrop-blur-md text-left transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border:     '1px solid rgba(255,255,255,0.09)',
                        boxShadow:  'inset 0 1px 0 rgba(255,255,255,0.06)',
                        maxWidth:   '300px',
                      }}
                    >
                      <span style={{
                        display:        'inline-flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        width:          '17px',
                        height:         '17px',
                        borderRadius:   '5px',
                        background:     'rgba(72,207,173,0.13)',
                        color:          '#48cfad',
                        fontSize:       '9px',
                        fontWeight:     700,
                        marginRight:    '10px',
                        flexShrink:     0,
                      }}>
                        {i + 1}
                      </span>
                      {opt}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* ── Text mode ── */}
              {inputMode === 'text' && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1,  y: 0  }}
                  exit={{   opacity: 0,  y: -8  }}
                  className="flex gap-2.5 items-end"
                >
                  <textarea
                    ref={textareaRef}
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAnswer(textInput);
                      }
                    }}
                    placeholder="Type your answer..."
                    rows={2}
                    className="flex-1 px-4 py-3 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none"
                    style={{
                      background:     'rgba(255,255,255,0.05)',
                      border:         '1px solid rgba(255,255,255,0.09)',
                      backdropFilter: 'blur(8px)',
                    }}
                    onFocus={e => { e.currentTarget.style.border = '1px solid rgba(72,207,173,0.45)'; }}
                    onBlur={e  => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.09)'; }}
                  />
                  <motion.button
                    onClick={() => handleAnswer(textInput)}
                    disabled={!textInput.trim() || isLoading || isSubmittingRef.current}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 rounded-xl text-sm font-medium flex-shrink-0"
                    style={{
                      background: textInput.trim() ? 'linear-gradient(135deg, #48cfad, #3ab595)' : 'rgba(255,255,255,0.06)',
                      color:      textInput.trim() ? '#0a1a14' : 'rgba(255,255,255,0.2)',
                      border:     '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    Send
                  </motion.button>
                </motion.div>
              )}

              {/* ── Voice mode ── */}
              {inputMode === 'voice' && (
                <motion.div
                  key="voice"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1,  y: 0  }}
                  exit={{   opacity: 0,  y: -8  }}
                  className="flex flex-col items-center gap-4 py-4"
                >
                  <motion.button
                    onClick={isListening ? stopVoice : startVoice}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: isListening
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #48cfad, #3ab595)',
                      boxShadow: isListening
                        ? '0 0 30px rgba(239,68,68,0.5)'
                        : '0 0 20px rgba(72,207,173,0.4)',
                    }}
                  >
                    {isListening && (
                      <>
                        <motion.div className="absolute inset-0 rounded-full"
                          animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          style={{ background: 'rgba(239,68,68,0.3)' }}
                        />
                        <motion.div className="absolute inset-0 rounded-full"
                          animate={{ scale: [1, 2.2], opacity: [0.2, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                          style={{ background: 'rgba(239,68,68,0.2)' }}
                        />
                      </>
                    )}
                    {isListening
                      ? <MicOff size={24} className="text-white relative z-10" />
                      : <Mic    size={24} className="text-zinc-900 relative z-10" />
                    }
                  </motion.button>

                  <p className="text-xs text-zinc-500">
                    {isListening ? 'Listening... tap to stop' : 'Tap to speak your answer'}
                  </p>

                  {currentOptions.length > 0 && !isListening && (
                    <div className="flex flex-col gap-1.5 w-full max-w-sm">
                      <p className="text-[10px] text-zinc-700 text-center uppercase tracking-wider mb-1">
                        Or pick an option
                      </p>
                      {currentOptions.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleAnswer(opt)}
                          disabled={isSubmittingRef.current}
                          className="px-4 py-2 rounded-xl text-xs text-zinc-400 text-left hover:text-zinc-200 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <span className="text-[#48cfad] mr-2 opacity-50">{i + 1}</span>{opt}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      )}

    </div>
  );
}