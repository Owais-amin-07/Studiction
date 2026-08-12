import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, PlusCircle, PhoneOff, Sparkles, RefreshCw, Stethoscope, User as UserIcon, FileCheck2 } from 'lucide-react';
import * as chatApi from '../services/chatApi';
import type { ChatMessageRecord, ChatRoomInfo } from '../services/chatApi';
import { subscribeToRequest, unsubscribeFromRequest } from '../services/pusherClient';

interface LiveChatProps {
  requestId: string;
  role: 'patient' | 'doctor';
  token: string;
  onExit: () => void; // called when the user leaves — either by choice or because the session ended
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00';
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LiveChat({ requestId, role, token, onExit }: LiveChatProps) {
  const [room, setRoom]           = useState<ChatRoomInfo | null>(null);
  const [messages, setMessages]   = useState<ChatMessageRecord[]>([]);
  const [draft, setDraft]         = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [tip, setTip]             = useState<string | null>(null);
  const [isFetchingTip, setIsFetchingTip] = useState(false);
  const [isEnding, setIsEnding]   = useState(false);
  const [recDraft, setRecDraft]         = useState('');
  const [isDraftingRec, setIsDraftingRec] = useState(false);
  const [isSendingRec, setIsSendingRec]   = useState(false);
  const [recError, setRecError]         = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDoctor = role === 'doctor';

  // ── Load room + message history, then subscribe for real-time updates ──
  useEffect(() => {
    let cancelled = false;

    chatApi.getChatRoom(requestId, token)
      .then((data) => {
        if (cancelled) return;
        setRoom(data);
        setMessages(data.messages);
        setSessionEnded(data.sessionEnded);
        if (data.request.sessionEndsAt) {
          setSecondsLeft(Math.max(0, Math.floor((new Date(data.request.sessionEndsAt).getTime() - Date.now()) / 1000)));
        }
      })
      .catch((err) => setError(err.message || 'Could not load this session'))
      .finally(() => setIsLoading(false));

    const channel = subscribeToRequest(requestId);
    channel.bind('new-message', (payload: ChatMessageRecord) => {
      setMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
    });
    channel.bind('session-extended', (payload: { sessionEndsAt: string }) => {
      setSecondsLeft(Math.max(0, Math.floor((new Date(payload.sessionEndsAt).getTime() - Date.now()) / 1000)));
    });
    channel.bind('session-ended', () => setSessionEnded(true));

    return () => {
      cancelled = true;
      unsubscribeFromRequest(requestId);
    };
  }, [requestId, token]);

  // ── Reconciliation poll — Pusher gives instant delivery when it's working,
  // but nothing here should hard-depend on it. Every few seconds, quietly
  // re-fetch the room and merge in anything Pusher might have missed
  // (messages, session-ended, and — after the session ends — the doctor's
  // recommendation once it's sent). Deliberately does NOT stop on
  // sessionEnded: a patient waiting on this screen needs to keep hearing
  // about the recommendation without refreshing.
  useEffect(() => {
    const id = setInterval(() => {
      chatApi.getChatRoom(requestId, token)
        .then((data) => {
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const fresh = data.messages.filter((m) => !known.has(m.id));
            return fresh.length ? [...prev, ...fresh] : prev;
          });
          if (data.sessionEnded) setSessionEnded(true);
          if (data.request.recommendation) setRoom((prev) => prev ? { ...prev, request: { ...prev.request, recommendation: data.request.recommendation } } : prev);
          if (data.request.sessionEndsAt) {
            setSecondsLeft(Math.max(0, Math.floor((new Date(data.request.sessionEndsAt).getTime() - Date.now()) / 1000)));
          }
        })
        .catch(() => { /* transient — next tick will retry */ });
    }, 5000);
    return () => clearInterval(id);
  }, [requestId, token]);

  // ── Countdown ticker ──
  useEffect(() => {
    if (sessionEnded) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [sessionEnded]);

  // ── Auto-scroll ──
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!draft.trim() || isSending || sessionEnded) return;
    const content = draft.trim();
    setDraft('');
    setIsSending(true);
    try {
      const message = await chatApi.sendChatMessage(requestId, token, content);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    } catch (err: any) {
      setError(err.message || 'Message failed to send');
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, sessionEnded, requestId, token]);

  const handleExtend = async () => {
    try {
      const { sessionEndsAt } = await chatApi.extendSession(requestId, token);
      setSecondsLeft(Math.max(0, Math.floor((new Date(sessionEndsAt).getTime() - Date.now()) / 1000)));
    } catch (err: any) {
      setError(err.message || 'Could not extend the session');
    }
  };

  const handleEnd = async () => {
    setIsEnding(true);
    try {
      await chatApi.endSession(requestId, token);
      setSessionEnded(true);
    } catch (err: any) {
      setError(err.message || 'Could not end the session');
    } finally {
      setIsEnding(false);
    }
  };

  const handleGetTip = async () => {
    setIsFetchingTip(true);
    try {
      setTip(await chatApi.getAiTip(requestId, token));
    } catch (err: any) {
      setTip(err.message || 'Could not get a tip right now');
    } finally {
      setIsFetchingTip(false);
    }
  };

  const handleDraftRecommendation = async () => {
    setIsDraftingRec(true);
    setRecError(null);
    try {
      setRecDraft(await chatApi.draftRecommendation(requestId, token));
    } catch (err: any) {
      setRecError(err.message || 'Could not generate a draft right now');
    } finally {
      setIsDraftingRec(false);
    }
  };

  const handleSendRecommendation = async () => {
    if (!recDraft.trim()) return;
    setIsSendingRec(true);
    setRecError(null);
    try {
      await chatApi.sendRecommendation(requestId, token, recDraft.trim());
      setRoom((prev) => prev
        ? { ...prev, request: { ...prev.request, recommendation: { content: recDraft.trim(), sentAt: new Date().toISOString() } } }
        : prev);
    } catch (err: any) {
      setRecError(err.message || 'Could not send this recommendation');
    } finally {
      setIsSendingRec(false);
    }
  };

  const otherPartyLabel = isDoctor
    ? room?.request.patientName || 'Member'
    : room?.request.doctor?.name || 'Your doctor';
  const otherPartySubtitle = isDoctor
    ? room?.request.report?.mainConcern
    : room?.request.doctor?.specialization;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="animate-spin w-6 h-6 text-zinc-500" /></div>;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row">
      {/* ── Chat column ── */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between glass-panel rounded-2xl px-4 py-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}>
              {isDoctor ? <UserIcon className="w-4 h-4 text-white" /> : <Stethoscope className="w-4 h-4 text-white" />}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{otherPartyLabel}</p>
              {otherPartySubtitle && <p className="text-zinc-500 text-[11px]">{otherPartySubtitle}</p>}
            </div>
          </div>
          {!sessionEnded && (
            <div className="flex items-center gap-1.5 text-xs font-medium tabular-nums"
              style={{ color: secondsLeft < 60 ? '#ef4444' : '#f0b429' }}>
              <Clock className="w-3.5 h-3.5" /> {formatCountdown(secondsLeft)}
            </div>
          )}
        </div>

        {error && <p className="text-rose-400 text-xs mb-3 px-1">{error}</p>}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.length === 0 && (
            <p className="text-zinc-600 text-xs text-center py-10">
              {isDoctor ? 'Say hello — the member is waiting.' : 'Your doctor will say hello shortly.'}
            </p>
          )}
          {messages.map((m) => {
            const isOwn = m.senderType === role;
            return (
              <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    background: isOwn ? 'linear-gradient(135deg, #f0b429, #f59e0b)' : 'rgba(255,255,255,0.05)',
                    color: isOwn ? '#1a1305' : '#e4e4e7',
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Session ended state */}
        {sessionEnded ? (
          isDoctor ? (
            room?.request.recommendation?.sentAt ? (
              <div className="glass-panel rounded-2xl p-5">
                <p className="text-white text-sm font-medium mb-2 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4" style={{ color: '#f0b429' }} /> Recommendation sent
                </p>
                <p className="text-zinc-400 text-xs leading-relaxed mb-4">{room.request.recommendation.content}</p>
                <button type="button" onClick={onExit}
                  className="h-10 px-5 rounded-xl text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}>
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-5">
                <p className="text-white text-sm font-medium mb-1">Session ended — write your recommendation</p>
                <p className="text-zinc-500 text-xs mb-3">Not a prescription — behavioral guidance and next steps only.</p>
                {recError && <p className="text-rose-400 text-xs mb-2">{recError}</p>}
                <textarea
                  value={recDraft} onChange={(e) => setRecDraft(e.target.value)} rows={5}
                  placeholder="Write a recommendation, or generate a draft below to start from..."
                  className="w-full px-3 py-2.5 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#f0b429]/70 rounded-xl text-white placeholder-zinc-600 text-sm outline-none transition-colors resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleDraftRecommendation} disabled={isDraftingRec}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl border text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    {isDraftingRec ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />} AI Draft
                  </button>
                  <button type="button" onClick={handleSendRecommendation} disabled={isSendingRec || !recDraft.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}>
                    {isSendingRec ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />} Send to Patient
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="glass-panel rounded-2xl p-5 text-center">
              {room?.request.recommendation?.content ? (
                <>
                  <p className="text-white text-sm font-medium mb-2 flex items-center justify-center gap-1.5">
                    <FileCheck2 className="w-4 h-4" style={{ color: '#f0b429' }} /> Your Recommendation
                  </p>
                  <p className="text-zinc-400 text-xs leading-relaxed mb-4 text-left">{room.request.recommendation.content}</p>
                </>
              ) : (
                <>
                  <p className="text-white text-sm font-medium mb-1">This session has ended</p>
                  <p className="text-zinc-500 text-xs mb-4 flex items-center justify-center gap-1.5">
                    <RefreshCw className="animate-spin w-3 h-3" /> Your doctor is preparing your recommendation...
                  </p>
                </>
              )}
              <button type="button" onClick={onExit}
                className="h-10 px-5 rounded-xl text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}>
                Back to Dashboard
              </button>
            </div>
          )
        ) : (
          <div className="flex gap-2">
            <input
              value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              className="flex-1 h-11 px-4 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#f0b429]/70 rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-4 focus:ring-[#f0b429]/10 outline-none transition-all duration-300"
            />
            <motion.button
              type="button" onClick={handleSend} disabled={isSending || !draft.trim()}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white cursor-pointer disabled:opacity-40 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}
            >
              {isSending ? <RefreshCw className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
            </motion.button>
          </div>
        )}
      </div>

      {/* ── Doctor-only sidebar: session controls + private AI tips ── */}
      {isDoctor && !sessionEnded && (
        <div className="w-full md:w-72 flex-shrink-0 px-4 md:pr-6 pb-6 md:py-6 space-y-3">
          <div className="glass-panel rounded-2xl p-4">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-3">Session Controls</p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={handleExtend}
                className="flex items-center gap-2 h-9 px-3 rounded-lg border text-zinc-300 hover:text-white text-xs font-medium cursor-pointer transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <PlusCircle className="w-3.5 h-3.5" style={{ color: '#f0b429' }} /> Extend +10 min
              </button>
              <button type="button" onClick={handleEnd} disabled={isEnding}
                className="flex items-center gap-2 h-9 px-3 rounded-lg border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50">
                {isEnding ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <PhoneOff className="w-3.5 h-3.5" />} End Session
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">AI Tips</p>
              <span className="text-[9px] text-zinc-600">Private — not visible to member</span>
            </div>
            <button type="button" onClick={handleGetTip} disabled={isFetchingTip}
              className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 mb-3"
              style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}>
              {isFetchingTip ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />} Get a tip
            </button>
            <AnimatePresence>
              {tip && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="text-zinc-400 text-xs leading-relaxed rounded-lg p-3"
                  style={{ background: 'rgba(240,180,41,0.06)' }}
                >
                  {tip}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {room?.request.report && (
            <div className="glass-panel rounded-2xl p-4">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2">Pre-Chat Summary</p>
              <p className="text-zinc-400 text-xs leading-relaxed">{room.request.report.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
