'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import './CustomCursor.css';

/**
 * A glowing two-part cursor: a small solid dot that tracks the pointer exactly,
 * and a larger springy ring that lags behind and grows over interactive elements.
 * Hidden on touch / coarse-pointer devices.
 */
export default function CustomCursor() {
  const [enabled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  );
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [hidden, setHidden] = useState(true);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;

    const interactiveSelector =
      'a, button, [role="button"], input, textarea, select, .interactive';

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
      const target = e.target as HTMLElement | null;
      setHovering(Boolean(target?.closest(interactiveSelector)));
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setHidden(true);

    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    document.addEventListener('mouseleave', leave);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      document.removeEventListener('mouseleave', leave);
    };
  }, [x, y, enabled]);

  useEffect(() => {
    document.body.classList.toggle('has-custom-cursor', enabled);
    return () => document.body.classList.remove('has-custom-cursor');
  }, [enabled]);

  if (!enabled) return null;

  const ringScale = (hovering ? 1.7 : 1) * (pressed ? 0.8 : 1);

  return (
    <>
      <motion.div
        className="cursor-ring"
        style={{ x: ringX, y: ringY, opacity: hidden ? 0 : 1 }}
        animate={{ scale: ringScale }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      <motion.div
        className="cursor-dot"
        style={{ x, y, opacity: hidden ? 0 : 1 }}
        animate={{ scale: pressed ? 0.6 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      />
    </>
  );
}
