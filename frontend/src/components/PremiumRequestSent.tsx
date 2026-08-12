import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import * as api from '../services/api';
import LiveChat from './LiveChat';

interface PremiumRequestSentProps {
  onDone: () => void;
}

const POLL_INTERVAL_MS = 4000;

export default function PremiumRequestSent({ onDone }: PremiumRequestSentProps) {
  const [acceptedRequestId, setAcceptedRequestId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const request = await api.getMyPremiumRequest();
        if (request?.status === 'accepted') {
          setAcceptedRequestId(request.id);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // transient failure — just try again on the next tick
      } finally {
        setIsChecking(false);
      }
    };
    check();
    pollRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (acceptedRequestId) {
    const token = api.getToken();
    if (token) {
      return <LiveChat requestId={acceptedRequestId} role="patient" token={token} onExit={onDone} />;
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 15 }}
        className="glass-panel rounded-3xl p-8 max-w-md w-full text-center"
        style={{ boxShadow: '0 0 50px rgba(240,180,41,0.08)' }}
      >
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(240,180,41,0.12)' }}>
          {isChecking
            ? <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#f0b429' }} />
            : <CheckCircle2 className="w-7 h-7" style={{ color: '#f0b429' }} />}
        </div>
        <h1 className="text-white text-xl font-light mb-2">Sent to our doctors</h1>
        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
          Your information has been shared with our care team. This screen will open your chat
          automatically the moment a doctor accepts — no need to refresh.
        </p>
        <button
          type="button" onClick={onDone}
          className="w-full h-11 rounded-xl text-white font-semibold tracking-wider uppercase text-[13px] cursor-pointer flex items-center justify-center gap-1.5"
          style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}
        >
          Back to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
