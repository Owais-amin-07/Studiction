import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Check, X, RefreshCw, AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import * as api from '../services/api';
import type { PremiumPlan, PaymentRecord, UserData } from '../services/api';

interface PremiumPlansProps {
  onBack: () => void;
  onPremiumActivated: (user: UserData) => void;
}

type Step = 'select' | 'processing' | 'success' | 'failure';

export default function PremiumPlans({ onBack, onPremiumActivated }: PremiumPlansProps) {
  const [plans, setPlans]         = useState<PremiumPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedId, setSelectedId]     = useState<'monthly' | 'yearly' | null>(null);
  const [step, setStep]           = useState<Step>('select');
  const [testFailure, setTestFailure]   = useState(false);
  const [payment, setPayment]     = useState<PaymentRecord | null>(null);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    api.getPremiumPlans()
      .then(setPlans)
      .catch(() => setError('Could not load plans — please try again'))
      .finally(() => setLoadingPlans(false));
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedId) || null;

  const handlePurchase = async () => {
    if (!selectedId) return;
    setStep('processing');
    setError(null);
    try {
      // A brief, deliberate pause — this is what makes "processing" read as
      // real rather than instant, without actually depending on anything.
      await new Promise((r) => setTimeout(r, 1400));
      const result = await api.purchasePremium({ planId: selectedId, simulateFailure: testFailure });
      setPayment(result.payment);
      if (result.error || !result.user) {
        setError(result.error || 'Payment failed');
        setStep('failure');
      } else {
        setStep('success');
        onPremiumActivated(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong — please try again');
      setStep('failure');
    }
  };

  const reset = () => {
    setStep('select');
    setPayment(null);
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-10">
      <motion.button
        type="button" onClick={onBack}
        whileHover={{ x: -2 }}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </motion.button>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">

          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <div className="text-center mb-8">
                <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}>
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-white text-2xl font-light tracking-wide mb-1">Go Premium</h1>
                <p className="text-zinc-500 text-sm">Connect with a real doctor, not just the assessment</p>
              </div>

              {loadingPlans ? (
                <div className="flex justify-center py-10"><RefreshCw className="animate-spin w-5 h-5 text-zinc-500" /></div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {plans.map((plan) => {
                    const isSelected = selectedId === plan.id;
                    const isYearly = plan.id === 'yearly';
                    return (
                      <motion.button
                        key={plan.id} type="button" onClick={() => setSelectedId(plan.id)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="relative text-left p-5 rounded-2xl border transition-all duration-200 cursor-pointer"
                        style={{
                          borderColor: isSelected ? 'rgba(240,180,41,0.6)' : 'rgba(255,255,255,0.06)',
                          background:  isSelected ? 'rgba(240,180,41,0.08)' : 'rgba(6,6,17,0.6)',
                          boxShadow:   isSelected ? '0 0 24px rgba(240,180,41,0.15)' : 'none',
                        }}
                      >
                        {isYearly && (
                          <span className="absolute -top-2.5 right-4 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-black"
                            style={{ background: '#f0b429' }}>
                            Best value
                          </span>
                        )}
                        <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">{plan.name}</p>
                        <p className="text-white text-2xl font-semibold mb-1">
                          {plan.currency} {plan.amount.toLocaleString()}
                          <span className="text-zinc-500 text-xs font-normal"> / {plan.id === 'monthly' ? 'mo' : 'yr'}</span>
                        </p>
                        <p className="text-zinc-600 text-[11px]">{plan.days} days of access</p>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              <ul className="space-y-2 mb-6 px-1">
                {['Live chat with a licensed doctor', 'Priority, longer assessment sessions', 'A written recommendation after each session'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-zinc-400 text-xs">
                    <Check className="w-3.5 h-3.5" style={{ color: '#f0b429' }} /> {f}
                  </li>
                ))}
              </ul>

              <label className="flex items-center gap-2 mb-4 px-1 cursor-pointer select-none">
                <input type="checkbox" checked={testFailure} onChange={(e) => setTestFailure(e.target.checked)}
                  className="accent-[#f0b429] w-3.5 h-3.5" />
                <span className="text-zinc-600 text-[11px]">Simulate a failed payment (for testing)</span>
              </label>

              <motion.button
                type="button" onClick={handlePurchase} disabled={!selectedId}
                whileHover={{ scale: selectedId ? 1.02 : 1 }} whileTap={{ scale: selectedId ? 0.98 : 1 }}
                className="w-full h-11 rounded-xl text-white font-semibold tracking-wider uppercase text-[13px] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}
              >
                {selectedPlan ? `Pay ${selectedPlan.currency} ${selectedPlan.amount.toLocaleString()}` : 'Select a plan'}
              </motion.button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center py-20 text-center">
              <RefreshCw className="animate-spin w-8 h-8 mb-4" style={{ color: '#f0b429' }} />
              <p className="text-white text-sm font-medium mb-1">Processing your payment</p>
              <p className="text-zinc-600 text-xs">Just a moment...</p>
            </motion.div>
          )}

          {step === 'success' && payment && selectedPlan && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-3xl p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(240,180,41,0.12)' }}>
                <Sparkles className="w-7 h-7" style={{ color: '#f0b429' }} />
              </div>
              <h2 className="text-white text-xl font-light mb-1">You're Premium</h2>
              <p className="text-zinc-500 text-sm mb-6">{payment.planName} plan activated</p>
              <div className="text-left rounded-xl p-4 mb-6 space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Amount</span><span className="text-white">{payment.currency} {payment.amount.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Transaction</span><span className="text-zinc-400 font-mono">{payment.simulatedTxnId}</span></div>
                <div className="flex justify-between text-xs"><span className="text-zinc-500">Status</span><span style={{ color: '#f0b429' }}>Succeeded</span></div>
              </div>
              <button type="button" onClick={onBack}
                className="w-full h-11 rounded-xl text-white font-semibold tracking-wider uppercase text-[13px] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}>
                Continue
              </button>
            </motion.div>
          )}

          {step === 'failure' && (
            <motion.div key="failure" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-3xl p-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
              <h2 className="text-white text-xl font-light mb-1">Payment failed</h2>
              <p className="text-zinc-500 text-sm mb-6">{error}</p>
              {payment && (
                <p className="text-zinc-600 text-[11px] font-mono mb-6">Ref: {payment.simulatedTxnId}</p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={reset}
                  className="flex-1 h-11 rounded-xl border border-white/10 text-zinc-300 font-semibold text-[13px] cursor-pointer flex items-center justify-center gap-1.5">
                  <X className="w-3.5 h-3.5" /> Try again
                </button>
                <button type="button" onClick={onBack}
                  className="flex-1 h-11 rounded-xl text-white font-semibold text-[13px] cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #f0b429, #f59e0b)' }}>
                  Back
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
