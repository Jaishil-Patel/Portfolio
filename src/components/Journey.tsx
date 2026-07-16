'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';
import { FiBriefcase, FiBookOpen, FiAward } from 'react-icons/fi';
import './Journey.css';

type Kind = 'work' | 'education' | 'cert';

type Entry = {
  kind: Kind;
  /** Giant ghost label that drifts behind the chapter card. */
  big: string;
  title: string;
  place: string;
  period: string;
  points: string[];
};

/** Chronological, left to right — the scroll drives through the story. */
const ENTRIES: Entry[] = [
  {
    kind: 'education',
    big: 'START',
    title: 'Lenasia Secondary School',
    place: 'Matric',
    period: 'Top 5 with 5 distinctions',
    points: ['Finished in the top 5 of the school with five distinctions.']
  },
  {
    kind: 'education',
    big: '2022',
    title: 'BSc Computer Science',
    place: 'University of the Witwatersrand',
    period: '2022 – 2025',
    points: [
      'Triple major, Computer Science, Computer Applications and Information Systems.',
      'Solid foundation across data, software and business analysis.'
    ]
  },
  {
    kind: 'cert',
    big: 'CERT',
    title: 'Alibaba Cloud Engineer',
    place: 'Certification',
    period: 'Cloud-native',
    points: ['Cloud-native concepts and deployment patterns for modern app design.']
  },
  {
    kind: 'work',
    big: '2026',
    title: 'Sales Coordinator',
    place: 'Kadam Wholesale Company',
    period: '2026',
    points: [
      'Supported customers with product selection and managed wholesale inventory flow.',
      'Handled invoices, payments and front-office / warehouse coordination.'
    ]
  },
  {
    kind: 'education',
    big: 'HONS',
    title: 'BSc Honours in Computer Science',
    place: 'University of the Witwatersrand',
    period: '2026 – Present',
    points: [
      'Currently pursuing Honours in Computer Science.',
      'Deepening focus through advanced coursework and a very cool research project.',
      'If you want to see passion, ask about the process of researching in honours'
    ]
  },
  {
    kind: 'work',
    big: 'NOW',
    title: 'Tutor',
    place: 'University of the Witwatersrand',
    period: '2026 – Present',
    points: [
      'Help first and third year students to reason about core CS concepts.',
      'Explain technical ideas clearly while staying calm under pressure. "Removing the fluff :)"'
    ]
  },
  {
    kind: 'work',
    big: 'Future',
    title: 'Problem solving, working hard and and and',
    place: 'At your workplace :)',
    period: 'Now to forever',
    points: [
      "Looking for a curious graduate who learns quickly, thinks outside the box, and solves not only the problems you have but also the ones you haven't discovered yet? You've found him!"
    ]
  }
];

const ICONS: Record<Kind, React.ReactNode> = {
  work: <FiBriefcase />,
  education: <FiBookOpen />,
  cert: <FiAward />
};

const LABELS: Record<Kind, string> = {
  work: 'Experience',
  education: 'Education',
  cert: 'Certification'
};

function useNarrow(query = '(max-width: 859px)') {
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return narrow;
}

function ChapterCard({ entry, index }: { entry: Entry; index: number }) {
  return (
    <motion.div
      className="journey__card"
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="journey__count">
        {String(index + 1).padStart(2, '0')} / {String(ENTRIES.length).padStart(2, '0')}
      </span>
      <span className={`journey__tag journey__tag--${entry.kind}`}>
        {ICONS[entry.kind]}
        {LABELS[entry.kind]}
      </span>
      <h4 className="journey__title">{entry.title}</h4>
      <p className="journey__place">{entry.place}</p>
      <span className="journey__period">{entry.period}</span>
      <ul className="journey__points">
        {entry.points.map(point => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </motion.div>
  );
}

function Chapter({
  entry,
  index,
  total,
  progress,
}: {
  entry: Entry;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // Per-chapter parallax: the ghost label is exactly centered when this
  // chapter is centered (progress = index / (total - 1)) and lags behind
  // the track during the transitions either side.
  const bigX = useTransform(
    progress,
    [(index - 1) / (total - 1), (index + 1) / (total - 1)],
    ['16vw', '-16vw'],
  );

  return (
    <section className="journey__chapter">
      <div className="journey__big-wrap" aria-hidden="true">
        <motion.span className="journey__big" style={{ x: bigX }}>
          {entry.big}
        </motion.span>
      </div>
      <span
        className={`journey__node journey__node--${entry.kind}`}
        aria-hidden="true"
      />
      <div className="journey__card-slot">
        <ChapterCard entry={entry} index={index} />
      </div>
    </section>
  );
}

/**
 * Cinematic horizontal journey: the section pins to the viewport and
 * vertical scroll drives the chapters sideways, giant ghost labels
 * drifting in parallax behind each card. Falls back to a plain vertical
 * stack on narrow screens and for reduced-motion users.
 */
export default function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const narrow = useNarrow();
  const flat = Boolean(reduce) || narrow;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end']
  });

  // The pin turns ~5 viewports of scroll into one on-screen section, which
  // feels like being trapped if you aren't reading it. Scrolling with the
  // pointer on the page margins (outside the journey column) is treated as
  // "get me past this": amplify the wheel so the section scrolls by at
  // normal speed.
  useEffect(() => {
    if (flat) return;
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const pinned = rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
      if (!pinned) return;
      if (e.clientX >= rect.left && e.clientX <= rect.right) return;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      let dy = e.deltaY * unit * 5;
      // Stop just past the pin boundary so one flick can't overshoot the
      // neighbouring sections.
      if (dy > 0) dy = Math.min(dy, rect.bottom - window.innerHeight + 120);
      else dy = Math.max(dy, rect.top - 120);
      e.preventDefault();
      window.scrollBy({ top: dy });
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [flat]);

  const n = ENTRIES.length;
  // The track is n chapters wide; slide it left by all but the last one.
  const trackX = useTransform(scrollYProgress, [0, 1], ['0%', `-${((n - 1) / n) * 100}%`]);

  if (flat) {
    return (
      <div className="journey journey--flat" ref={ref}>
        {ENTRIES.map((entry, i) => (
          <ChapterCard key={`${entry.title}-${i}`} entry={entry} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="journey"
      ref={ref}
      style={{ height: `${n * 85}vh`, '--n': n } as React.CSSProperties}
    >
      <div className="journey__pin">
        <motion.div className="journey__track" style={{ x: trackX }}>
          {/* Timeline running through every chapter, connecting the nodes */}
          <div className="journey__line" aria-hidden="true" />
          {ENTRIES.map((entry, i) => (
            <Chapter
              key={`${entry.title}-${i}`}
              entry={entry}
              index={i}
              total={n}
              progress={scrollYProgress}
            />
          ))}
        </motion.div>

        <div className="journey__rail" aria-hidden="true">
          <motion.div className="journey__rail-fill" style={{ scaleX: scrollYProgress }} />
        </div>
      </div>
    </div>
  );
}
