'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import './RotatingText.css';

type RotatingTextProps = {
  items: string[];
  /** Time each item stays on screen, in ms. */
  interval?: number;
  className?: string;
};

/**
 * Cycles through a list of strings with a springy vertical swap.
 * Splits each word into letters for a staggered reveal.
 */
export default function RotatingText({
  items,
  interval = 2200,
  className
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % items.length);
    }, interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  const current = items[index];
  const letters = current.split('');

  return (
    <span className={`rotating-text ${className ?? ''}`} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          className="rotating-text__word"
          initial={reduce ? { opacity: 0 } : undefined}
          animate={reduce ? { opacity: 1 } : undefined}
          exit={reduce ? { opacity: 0 } : undefined}
          transition={reduce ? { duration: 0.2 } : undefined}
        >
          {reduce
            ? current
            : letters.map((letter, i) => (
                <motion.span
                  key={`${current}-${i}`}
                  className="rotating-text__letter"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                    delay: i * 0.025
                  }}
                >
                  {letter === ' ' ? ' ' : letter}
                </motion.span>
              ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
