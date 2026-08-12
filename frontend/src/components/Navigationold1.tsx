import { motion, AnimatePresence } from 'framer-motion';
import { Home, Activity, Brain, User, Sparkles, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavbarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onAccountClick?: () => void;
  onDashboardClick?: () => void;
  onHomeClick?: () => void;
  isLoggedIn?: boolean;
}


const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <motion.line
      x1="2" y1="5" x2="20" y2="5"
      stroke="#48cfad" strokeWidth="2.2" strokeLinecap="round"
      animate={isOpen ? { x1: 3, y1: 3, x2: 19, y2: 19 } : { x1: 2, y1: 5, x2: 20, y2: 5 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    />
    <motion.line
      x1="2" y1="11" x2="20" y2="11"
      stroke="#48cfad" strokeWidth="2.2" strokeLinecap="round"
      animate={isOpen ? { opacity: 0, x1: 11, x2: 11 } : { opacity: 1, x1: 2, x2: 20 }}
      transition={{ duration: 0.2 }}
    />
    <motion.line
      x1="2" y1="17" x2="20" y2="17"
      stroke="#48cfad" strokeWidth="2.2" strokeLinecap="round"
      animate={isOpen ? { x1: 3, y1: 19, x2: 19, y2: 3 } : { x1: 2, y1: 17, x2: 20, y2: 17 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    />
  </svg>
);



export default function Navigation({ onLoginClick, onAccountClick, onDashboardClick, onHomeClick, isLoggedIn }: NavbarProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { id: 'home',      icon: Home,     label: 'Home',       sectionId: 'hero' },
    { id: 'features',  icon: Sparkles, label: 'Feature',    sectionId: 'features' },
    { id: 'mind',      icon: Brain,    label: 'Mind',       sectionId: 'mind' },
    { id: 'stats',     icon: Activity, label: 'Progress',   onDashboard: true },
    { id: 'profile',   icon: User,     label: isLoggedIn ? 'Account' : 'Sign In',   isLogin: true },
  ];

  const handleClick = (item: typeof navItems[0]) => {
    if (isMobile) setIsOpen(false);
    if (item.isLogin) {
      isLoggedIn ? onAccountClick?.() : onLoginClick?.();
    } else if (item.onDashboard) {   // ← add this
      onDashboardClick?.();
    } else if (item.sectionId) {
      // Ensure we switch back to landing view if we are on dashboard or another view
      if (onHomeClick) onHomeClick();
      
      const element = document.getElementById(item.sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <AnimatePresence>
        {isMobile && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(!isOpen)}
            className="fixed top-6 right-6 z-[60] w-12 h-12 rounded-full glass-panel flex items-center justify-center text-[#48cfad] border border-white/10 shadow-2xl"
          >
            <HamburgerIcon isOpen={isOpen} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.nav
            initial={isMobile ? { opacity: 0, x: 20 } : { y: -50, opacity: 0 }}
            animate={isMobile ? { opacity: 1, x: 0 } : { y: 0, opacity: 1 }}
            exit={isMobile ? { opacity: 0, x: 20 } : { opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: isMobile ? 0 : 0.5 }}
            className={`fixed z-50 flex transition-all duration-500 ${
              isMobile 
                ? 'inset-0 flex-col items-center justify-center gap-4 bg-[#04040c]/98 p-8' 
                : 'top-4 left-1/2 -translate-x-1/2 flex-row gap-3 px-5 py-2 rounded-full glass-panel'
            }`}
          >
            {/* Header for mobile menu */}
            {isMobile && (
              <div className="absolute top-16 flex flex-col items-center gap-4 mb-8">
                <img
                      src="./ftlogo.webp"
                      alt="Studiction"
                      className="w-30 h-30 object-contain"
                    />
                <h2 className="text-2xl font-black tracking-[0.35em] uppercase bg-gradient-to-r from-[#6c63ff] via-[#48cfad] to-[#6c63ff] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(72,207,173,0.5)] [filter:drop-shadow(0_0_8px_rgba(108,99,255,0.4))]">
                  STUDICTION
                </h2>
              </div>
            )}

            {navItems.map((item) => {
              const Icon      = item.icon;
              const isHovered = hovered === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative flex items-center transition-all duration-300 outline-none ${
                    isMobile 
                      ? 'w-full max-w-xs px-6 py-4 rounded-2xl bg-white/5 border border-white/5 flex-row gap-4 text-white hover:bg-white/10 active:scale-95' 
                      : `h-8 px-5 rounded-full ${isHovered ? 'bg-white/10 text-[#48cfad]' : 'text-zinc-300'}`
                  }`}
                >
                  <Icon size={isMobile ? 22 : 20} className={isMobile ? 'text-[#48cfad]' : ''} />

                  {isMobile ? (
                    <span className="text-base font-light tracking-widest uppercase">
                      {item.label}
                    </span>
                  ) : (
                    <motion.span
                      initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                      animate={{
                        width: isHovered ? 'auto' : 0,
                        opacity: isHovered ? 1 : 0,
                        marginLeft: isHovered ? 8 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isMobile && <ChevronRight size={16} className="ml-auto text-zinc-600" />}
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}