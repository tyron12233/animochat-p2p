import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Helper for random values
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Individual particle component
type ParticleProps = {
  a: number;
  d: number;
};

const Particle = ({ a, d }: ParticleProps) => {
  const x = Math.cos(a) * d;
  const y = Math.sin(a) * d;
  const duration = random(2, 4);
  const delay = random(0, 2);
  const scale = random(0.8, 1.2);

  return (
    <motion.div
      className="absolute bg-white rounded-full"
      style={{
        width: 10,
        height: 10,
        left: '50%',
        top: '50%',
        translateX: '-50%',
        translateY: '-50%',
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

// Main animation component with enter and exit animations
export const FindingMatchAnimation = () => {
  // Create an array for the radar pulses
  const pulses = [0, 1, 2];
  
  // Create an array for orbiting particles
  const particles = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    angle: (i / 5) * 2 * Math.PI,
    distance: random(80, 120),
  }));

  const pulseVariants = {
    initial: { scale: 0, opacity: 1 },
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
  } as Variants;

  // Variants for the main container's enter and exit animation
  const containerVariants = {
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
  } as Variants;

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center w-full h-full bg-green-500 overflow-hidden z-10"
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
              className="absolute w-full h-full rounded-full border-2 border-white/50"
              variants={pulseVariants}
              initial="initial"
              animate="animate"
              custom={i}
            />
          ))}
        </AnimatePresence>

        <motion.div
          className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
          </svg>
        </motion.div>

        {/* Orbiting particles */}
        <div className="absolute w-full h-full">
          {particles.map(p => (
            <Particle key={p.id} a={p.angle} d={p.distance} />
          ))}
        </div>
      </div>
      <motion.p 
        className="mt-8 text-2xl font-semibold text-white tracking-wider"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
      >
        Finding a match...
      </motion.p>
    </motion.div>
  );
};