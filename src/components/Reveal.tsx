'use client';

import { type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Direction the element travels in from. */
  direction?: Direction;
  /** Delay in seconds before the animation starts. */
  delay?: number;
  /** Travel distance in pixels. */
  distance?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Render as a different element (e.g. 'section', 'li'). */
  as?: 'div' | 'section' | 'li' | 'article' | 'span';
  /** Re-run the animation every time it scrolls into view. */
  once?: boolean;
};

const offset = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'up':
      return { y: distance };
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: distance };
    case 'right':
      return { x: -distance };
    default:
      return {};
  }
};

export default function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  distance = 32,
  duration = 0.7,
  as = 'div',
  once = true
}: RevealProps) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: reduce
      ? { opacity: 0 }
      : {
          opacity: 0,
          scale: direction === 'scale' ? 0.94 : 1,
          ...offset(direction, distance)
        },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        duration: reduce ? 0.3 : duration,
        delay,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2, margin: '0px 0px -10% 0px' }}
    >
      {children}
    </MotionTag>
  );
}
