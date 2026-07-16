'use client';

import { type ReactNode } from 'react';
import './Marquee.css';

type MarqueeProps = {
  items: ReactNode[];
  /** Seconds for one full loop. */
  speed?: number;
  reverse?: boolean;
  className?: string;
};

/**
 * Infinite horizontal marquee. The track is duplicated so the loop is seamless,
 * and it pauses on hover. Fades out at both edges via a CSS mask.
 */
export default function Marquee({ items, speed = 28, reverse = false, className }: MarqueeProps) {
  const track = [...items, ...items];

  return (
    <div className={`marquee ${className ?? ''}`}>
      <div
        className={`marquee__track ${reverse ? 'marquee__track--reverse' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {track.map((item, i) => (
          <span className="marquee__item" key={i} aria-hidden={i >= items.length}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
