import { motion } from 'framer-motion';
import TextAnimation from './TextAnimation';
import AssessmentButton from './AssessmentButton';

export default function Hero({ onBegin }: { onBegin?: () => void }) {
  return (
    <div id="hero" className="relative w-full h-screen flex items-center overflow-hidden scroll-mt-[100px]">

      {/* FLEX ROW — Left Text | Right Button */}
      <div className="z-10 w-full flex flex-col md:flex-row h-full items-center px-6 md:px-20 gap-10">

        {/* LEFT SIDE — Text + Subtitle */}
        <div className="flex flex-col justify-center flex-1 text-center md:text-left pt-20 md:pt-0">

          <TextAnimation />

          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.8 }}
            className="text-lg md:text-xl text-zinc-400 leading-relaxed mt-4 md:ml-4"
          >
            <span className="text-zinc-300 italic">
              Defend against cross-addictions with adaptive logic and clinical empathy. Reclaim your digital clarity.
            </span>
          </motion.p>

        </div>

        {/* RIGHT SIDE — Button */}
        <div className="flex flex-col items-center justify-center flex-1 pb-20 md:pb-0">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
          >
            <AssessmentButton onClick={onBegin} />
          </motion.div>
        </div>

      </div>

    </div>
  );
}