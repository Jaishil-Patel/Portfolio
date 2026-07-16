'use client';

import { motion, useReducedMotion } from 'motion/react';
import './Skills.css';

type SkillGroup = {
  title: string;
  accent: string;
  skills: string[];
};

const GROUPS: SkillGroup[] = [
  {
    title: 'Languages',
    accent: '#8b5cf6',
    skills: ['JavaScript', 'TypeScript', 'SQL', 'Python', 'Java', 'C++', 'C#', 'C', 'PHP']
  },
  {
    title: 'AI & Data',
    accent: '#2dd4bf',
    skills: ['NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow', 'Data Analysis', 'ML basics']
  },
  {
    title: 'Engineering & Tools',
    accent: '#8b5cf6',
    skills: ['Git', 'Unit Testing', 'Jest', 'Agile', 'REST APIs', 'Azure', 'VS Code', 'IT Support']
  },
  {
    title: 'Web & App',
    accent: '#2dd4bf',
    skills: [
      'React',
      'Node.js',
      'Vite',
      'NestJS',
      'Android Studio',
      'Supabase',
      'Render',
      'Vercel',
      'Auth0'
    ]
  }
];

export default function Skills() {
  const reduce = useReducedMotion();

  return (
    <div className="skills-grid">
      {GROUPS.map(group => (
        <motion.div
          key={group.title}
          className="skill-card"
          style={{ '--accent': group.accent } as React.CSSProperties}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: reduce ? 0 : 0.04 } }
          }}
        >
          <div className="skill-card__glow" aria-hidden="true" />
          <h3 className="skill-card__title">{group.title}</h3>
          <div className="skill-pill-row">
            {group.skills.map(skill => (
              <motion.span
                key={skill}
                className="skill-pill"
                variants={{
                  hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                whileHover={reduce ? undefined : { y: -3, scale: 1.06 }}
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
