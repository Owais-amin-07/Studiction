// src/App.tsx
import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SpaceBackground from './components/SpaceBackground';
import LightBeam from './components/LightBeam';
import Navbar from './components/Navigation';
import Hero from './components/Hero';
import EngagementHook from './components/EngagementHook';
import FeatureSlider from './components/FeatureSlider';
import FooterCTA from './components/FooterCTA';
import AccountModal from '../AccountModal';
import { GoogleOAuthProvider } from '@react-oauth/google';
// import RecoveryHub from './components/RecoveryHub';
import RecoveryHubCard from './components/RecoveryHubCard';

const RecoveryHub = lazy(() => import('./components/RecoveryHub'));
const LiquidTransition = lazy(() => import('./components/LiquidTransition'));
const DiagnosticChat   = lazy(() => import('./components/DiagnosticChat'));
const SessionSetup     = lazy(() => import('./components/SessionSetup'));
const PersonaReveal    = lazy(() => import('./components/PersonaReveal'));
const LoginPage        = lazy(() => import('./components/LoginPage'));
const SignupPage       = lazy(() => import('./components/SignupPage'));
const Dashboard        = lazy(() => import('./components/Dashboard'));
const WelcomeGate      = lazy(() => import('./components/WelcomeGate'));
const DoctorLogin      = lazy(() => import('./components/DoctorLogin'));
const DoctorDashboard  = lazy(() => import('./components/DoctorDashboard'));
const PremiumPlans     = lazy(() => import('./components/PremiumPlans'));
const PremiumRequestSent = lazy(() => import('./components/PremiumRequestSent'));


import * as api from './services/api';
import * as doctorApi from './services/doctorApi';
import type { SessionConfig } from './components/SessionSetup';
import type { DoctorData } from './services/doctorApi';
import type { DiagnosticResult } from './components/DiagnosticChat';

export type AppView   = 'welcome' | 'landing' | 'transition' | 'diagnostic' | 'reveal' | 'dashboard' | 'doctor-login' | 'doctor-portal' | 'premium' | 'premium-request-sent' | 'recovery-hub' | 'resume-chat';
export type ModalView = 'none' | 'login' | 'signup' | 'account';

export type UserData = {
  name:       string;
  email:      string;
  username:   string;
  joinedDate: string;
  goal?:      string;
  isPremium?:       boolean;
  premiumPlan?:      'monthly' | 'yearly' | null;
  premiumExpiresAt?: string | null;
};

export type DiagResult = {
  tier:    'low' | 'moderate' | 'high';
  stage:   'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
  score:   number;
  summary: string;
  addictionType?: 'digital' | 'nicotine' | 'both';
};

if (typeof window !== 'undefined' && history.scrollRestoration) {
  history.scrollRestoration = 'manual';
}

function App() {
  const [view,        setView]        = useState<AppView>('welcome');
  const [modal,       setModal]       = useState<ModalView>('none');
  const [isLoggedIn,  setIsLoggedIn]  = useState<boolean>(false);
  const [userData,    setUserData]    = useState<UserData | null>(null);
  const [diagResult,  setDiagResult]  = useState<DiagResult | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);

  const [doctorData,       setDoctorData]       = useState<DoctorData | null>(null);
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState<boolean>(false);

  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);

  // ── On mount: verify JWT + restore user + result from DB ─────────────────────
  // Checks both sessions independently — a returning doctor skips straight to
  // their portal, a returning patient skips straight to the normal landing,
  // and a first-time visitor with neither sees the welcome/role-select screen.
  useEffect(() => {
    const restore = async () => {
      setAuthLoading(true);

      const doctor = await doctorApi.getCurrentDoctor();
      if (doctor) {
        setDoctorData(doctor);
        setIsDoctorLoggedIn(true);
        setView('doctor-portal');
        setAuthLoading(false);
        return;
      }

      const user = await api.getMe();
      if (!user) { setAuthLoading(false); return; }
      setUserData(user);
      setIsLoggedIn(true);
      setView('landing');
      try {
        const result = await api.getResult();
        if (result) setDiagResult(result);
      } catch { /* no result yet */ }
      setAuthLoading(false);
    };
    restore();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  useEffect(() => {
    document.body.style.overflow = modal !== 'none' ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modal]);

  const openLogin   = () => setModal('login');
  const openSignup  = () => setModal('signup');
  const openAccount = () => setModal('account');
  const closeModal  = () => setModal('none');

  const enterAsPatient = () => setView('landing');

  const openPremium = () => {
    if (!isLoggedIn) { openLogin(); return; }
    setView('premium');
  };

  const handlePremiumActivated = (updatedUser: UserData) => {
    setUserData(updatedUser);
  };

  const handleDoctorLogin = (doctor: DoctorData) => {
    setDoctorData(doctor);
    setIsDoctorLoggedIn(true);
    setView('doctor-portal');
  };

  const handleDoctorLogout = () => {
    doctorApi.doctorLogout();
    setDoctorData(null);
    setIsDoctorLoggedIn(false);
    setView('welcome');
  };

  const startDiagnostic = () => {
    if (!isLoggedIn) { openSignup(); return; }
    setSessionConfig(null);
    setView('transition');
  };



    // Deep link from the acceptance email: SITE/#chat=ID → straight into the chat
  useEffect(() => {
    if (isLoggedIn && window.location.hash.startsWith('#chat=')) {
      setView('resume-chat');
    }
  }, [isLoggedIn]);


  const [bgReady, setBgReady] = useState(false);

useEffect(() => {
  const id = 'requestIdleCallback' in window
    ? requestIdleCallback(() => setBgReady(true))
    : setTimeout(() => setBgReady(true), 200);
  return () => {
    if ('cancelIdleCallback' in window) cancelIdleCallback(id as number);
    else clearTimeout(id as unknown as number);
  };
}, []);



  // ── Google OAuth — mirrors handleLogin so dashboard data resumes correctly ───
  const handleGoogleAuth = async ({ token, user }: { token: string; user: any }) => {
    api.setToken(token);
    setUserData(user);
    setIsLoggedIn(true);

    // Pull this user's existing diagnostic result (if any) — same as email/password login
    try {
      const result = await api.getResult();
      if (result) setDiagResult(result);
      setModal('none');
      setView(result ? 'dashboard' : 'landing');
    } catch (err) {
      console.error('getResult failed after Google auth:', err);   // ← add this
      // brand-new Google user, no result yet — send to landing to start diagnostic
      setModal('none');
      setView('landing');
    }
  };

  // Fires only once SignupPage's internal OTP step succeeds — a brand-new
  // account has no diagnostic result yet, so (unlike login) we go straight
  // to the transition view rather than checking for one.
  const handleAccountVerified = (user: UserData) => {
    setUserData(user);
    setIsLoggedIn(true);
    setModal('none');
    setView('transition');
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    const user = await api.login(data);
    setUserData(user);
    setIsLoggedIn(true);
    const result = await api.getResult();
    if (result) setDiagResult(result);
    setModal('none');
    setView(result ? 'dashboard' : 'landing');
  };

  const handleLogout = () => {
    api.removeToken();
    localStorage.removeItem('studiction_user');
    localStorage.removeItem('studiction_result');
    setIsLoggedIn(false);
    setUserData(null);
    setDiagResult(null);
    setConversationHistory([]);
    setModal('none');
    setView('landing');
  };

  const handleDiagnosticComplete = async (result: DiagResult & {
    conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  }) => {
    const { conversationHistory: history, ...diagOnly } = result;
    setDiagResult(diagOnly);
    setConversationHistory(history);
    setView('dashboard');
    try {
      await api.saveResult(diagOnly);
    } catch (err) {
      console.error('Failed to persist result to DB:', err);
    }
  };

  // The premium pre-chat runs through the same DiagnosticChat engine (short
  // target, gold theme) but its output means something different — instead
  // of saving a scored result, it becomes the report a doctor reads before
  // accepting the patient. tier/urgency share the same enum values, so that
  // mapping is direct; the rest is derived into short, doctor-readable text.
  const handlePremiumPreChatComplete = async (result: DiagnosticResult) => {
    const concernLabel: Record<string, string> = {
      digital:  'Digital habits',
      nicotine: 'Nicotine use',
      both:     'Digital & nicotine habits',
    };
    try {
      await api.submitPremiumRequest({
        report: {
          mainConcern: concernLabel[result.addictionType || ''] || 'General check-in',
          keyDetails:  `Stage: ${result.stage} · Score: ${result.score}/100`,
          urgency:     result.tier,
          summary:     result.summary,
        },
        conversationHistory: result.conversationHistory,
      });
    } catch (err) {
      console.error('Failed to submit premium request:', err);
    }
    setView('premium-request-sent');
  };

 const handleUpdateUser = async (updated: UserData) => {
    try {
      const freshUser = await api.updateMe({ name: updated.name, username: updated.username, goal: updated.goal });
      setUserData(freshUser);
      localStorage.setItem('studiction_user', JSON.stringify(freshUser));
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  if (authLoading) return null;

  return (
    <main className="min-h-screen text-white selection:bg-zen-emerald selection:text-white overflow-hidden">
      {bgReady && <SpaceBackground />}
      <LightBeam />
      <img
        src="/moon.webp"
        style={{
          position: 'fixed', top: '50px', left: '-30px',
          width: '200px', height: '200px', rotate: '1deg',
          zIndex: 1, pointerEvents: 'none', opacity: 0.6,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <Suspense fallback={null}>
          {view === 'welcome' && (
            <WelcomeGate
              onContinueAsPatient={enterAsPatient}
              onGoToDoctorLogin={() => setView('doctor-login')}
            />
          )}


          {view === 'doctor-login' && (
            <DoctorLogin
              onLogin={handleDoctorLogin}
              onBack={() => setView('welcome')}
            />
          )}

          {view === 'doctor-portal' && (
            isDoctorLoggedIn && doctorData
              ? <DoctorDashboard doctor={doctorData} onLogout={handleDoctorLogout} />
              : <DoctorLogin onLogin={handleDoctorLogin} onBack={() => setView('welcome')} />
          )}

          {view === 'premium' && (
            <PremiumPlans
              onBack={() => setView('landing')}
              onPremiumActivated={handlePremiumActivated}
            />
          )}
        </Suspense>

        { (view === 'landing' || view === 'dashboard') && (
        <Navbar
          isLoggedIn={isLoggedIn}
          onLoginClick={isLoggedIn ? openAccount : openLogin}
          onSignupClick={openSignup}
          onAccountClick={openAccount}
          onDashboardClick={() => { if (!isLoggedIn) { openLogin(); return; } setView('dashboard'); }}
          onHomeClick={() => setView('landing')}
          onPremiumClick={openPremium}
        />
        )}

        {view === 'landing' && (
          <>
            <Hero onBegin={startDiagnostic} />
            <EngagementHook />
            <RecoveryHubCard onOpen={() => setView('recovery-hub')} />
            <FeatureSlider />
            <FooterCTA onInitiate={startDiagnostic} />
          </>
        )}

          <Suspense fallback={null}>
            {view === 'transition' && (
              <LiquidTransition onComplete={() => setView('diagnostic')} />
            )}

            {view === 'diagnostic' && (
              sessionConfig
                ? sessionConfig.isPremiumFlow
                  ? <DiagnosticChat
                      durationMinutes={sessionConfig.durationMinutes}
                      mood={sessionConfig.mood}
                      fixedExchangeTarget={7}
                      variant="premium"
                      onComplete={handlePremiumPreChatComplete}
                    />
                  : <DiagnosticChat
                      durationMinutes={sessionConfig.durationMinutes}
                      mood={sessionConfig.mood}
                      onComplete={handleDiagnosticComplete}
                    />
                : <SessionSetup
                    onStart={setSessionConfig}
                    isPremium={userData?.isPremium}
                    onRequirePremium={openPremium}
                  />
            )}

            {view === 'premium-request-sent' && (
              <PremiumRequestSent onDone={() => setView('dashboard')} />
            )}

            {view === 'reveal' && (
              <PersonaReveal onComplete={() => setView('dashboard')} />
            )}

            {view === 'recovery-hub' && (
            <RecoveryHub onBack={() => setView('landing')} />
            )}


            {view === 'resume-chat' && (
              <PremiumRequestSent
                onDone={() => { window.location.hash = ''; setView('dashboard'); }}
              />
            )}

            {view === 'dashboard' && (
              <Dashboard
                tier={diagResult?.tier ?? 'moderate'}
                stage={diagResult?.stage as any ?? 'action'}
                score={diagResult?.score ?? 50}
                summary={diagResult?.summary ?? ''}
                addictionType={diagResult?.addictionType ?? 'digital'}
                hasResult={diagResult !== null}
                onBeginAssessment={() => setView('transition')}
                conversationHistory={conversationHistory}
                userName={userData?.name}
                userEmail={userData?.email}
                onOpenRecoveryHub={() => setView('recovery-hub')}
              />
            )}
          </Suspense>
      </div>

      <AnimatePresence>
        {modal !== 'none' && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeModal}
              style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              }}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1,  scale: 1,    y: 0,  filter: 'blur(0px)' }}
              exit={{   opacity: 0,  scale: 0.92, y: 20,  filter: 'blur(8px)' }}
              transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: 'fixed', inset: 0, zIndex: 51,
                overflowY: 'auto', display: 'flex',
                alignItems: 'flex-start', justifyContent: 'center',
                padding: '20px', pointerEvents: 'none',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  pointerEvents: 'auto', marginTop: 'auto', marginBottom: 'auto',
                  width: '100%', display: 'flex', justifyContent: 'center',
                  paddingTop: '20px', paddingBottom: '20px',
                }}
              >
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                  {modal === 'login' && (
                    <LoginPage
                      onLogin={handleLogin}
                      onGoogleAuth={handleGoogleAuth}
                      onGoToSignup={() => setModal('signup')}
                      onClose={closeModal}
                    />
                  )}
                  {modal === 'signup' && (
                    <SignupPage
                      onAccountVerified={handleAccountVerified}
                      onGoogleAuth={handleGoogleAuth}
                      onGoToLogin={() => setModal('login')}
                      onClose={closeModal}
                    />
                  )}
                </GoogleOAuthProvider>
                {modal === 'account' && (
                  <AccountModal
                    isOpen={modal === 'account'}
                    onClose={closeModal}
                    onLogout={handleLogout}
                    userData={userData}
                    onUpdateUser={handleUpdateUser}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;