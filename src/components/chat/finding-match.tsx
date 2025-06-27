import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChatThemeV2 } from '@/src/lib/chat-theme';

// Helper for random values
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Individual particle component, now themed
type ParticleProps = {
  a: number;
  d: number;
  color: string;
};

const Particle = ({ a, d, color }: ParticleProps) => {
  const x = Math.cos(a) * d;
  const y = Math.sin(a) * d;
  const duration = random(2, 4);
  const delay = random(0, 2);
  const scale = random(0.8, 1.2);

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 10,
        height: 10,
        left: '50%',
        top: '50%',
        translateX: '-50%',
        translateY: '-50%',
        backgroundColor: color,
      }}
      initial={{ x: 0, y: 0, scale: 0 }}
      animate={{ x, y, scale }}
      transition={{ 
        duration, 
        delay, 
        repeat: Infinity, 
        repeatType: 'reverse', 
        ease: 'easeInOut' 
      }}
    />
  );
};

// Main animation component props
interface FindingMatchAnimationProps {
    theme: ChatThemeV2;
    mode: 'light' | 'dark';
    onCancel: () => void; // Added cancel handler prop
}

// Main animation component with enter and exit animations
export const FindingMatchAnimation: React.FC<FindingMatchAnimationProps> = ({ theme, mode, onCancel }) => {
  // Create an array for the radar pulses
  const pulses = [0, 1, 2];
  
  // Create an array for orbiting particles
  const particles = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    angle: (i / 5) * 2 * Math.PI,
    distance: random(80, 120),
  }));
  
  const textColor = theme.buttons.primary.text[mode];
  const accentColor = theme.accent.main[mode];
  const mainBgColor = theme.general.background[mode];

  const pulseVariants: Variants = {
    initial: { scale: 0, opacity: 0.5 },
    animate: (i: number) => ({
      scale: 1,
      opacity: 0,
      transition: {
        delay: i * 0.7,
        duration: 2.1,
        repeat: Infinity,
        ease: 'circOut',
      },
    }),
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full overflow-hidden z-10"
      style={{
        backgroundColor: accentColor,
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Radar-like pulses */}
        <AnimatePresence>
          {pulses.map((i) => (
            <motion.div
              key={i}
              className="absolute w-full h-full rounded-full border-2"
              style={{
                borderColor: textColor,
              }}
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              custom={i}
            />
          ))}
        </AnimatePresence>

        <motion.div
          className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: mainBgColor,
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg 
            className="w-12 h-12" 
            style={{
              color: accentColor,
            }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
          </svg>
        </motion.div>

        {/* Orbiting particles */}
        <div className="absolute w-full h-full">
          {particles.map(p => (
            <Particle key={p.id} a={p.angle} d={p.distance} color={textColor} />
          ))}
        </div>
      </div>
      <motion.p 
        className="mt-8 text-2xl font-semibold tracking-wider"
        style={{
            color: textColor,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
      >
        Finding a match...
      </motion.p>

      <motion.button
        className="mt-6 px-6 py-2 rounded-full text-sm font-semibold transition-colors"
        style={{
        backgroundColor: theme.buttons.secondary.background[mode],
        color: theme.buttons.secondary.text[mode],
        ...(theme.buttons.secondary.border?.[mode]
          ? { border: `1px solid ${theme.buttons.secondary.border[mode]}` }
          : { border: 'none' }),
        opacity: 0.8
        }}
        onClick={onCancel}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
        whileHover={{ scale: 1.05, opacity: 1 }}
        whileTap={{ scale: 0.95 }}
      >
        Cancel
      </motion.button>
    </motion.div>
  );
};
