import { useEffect, useState } from 'react'
import Aurora from './effects/Aurora'
import ThemeDial from './components/ThemeDial'
import { themeStore } from './theme/themeStore'
import { auroraStops } from './theme/palette'
import BrainIntro from './components/BrainIntro'
import GlassSurface from './components/GlassSurface'
import SpotlightCard from './components/SpotlightCard'
import Reveal from './components/Reveal'
import Magnetic from './components/Magnetic'
import RotatingText from './components/RotatingText'
import CustomCursor from './components/CustomCursor'
import Skills from './components/Skills'
import Marquee from './components/Marquee'
import CountUp from './components/CountUp'
import Tilt from './components/Tilt'
import Journey from './components/Journey'
import arrowDown from './assets/arrow-down-02.svg'
import GradualBlur from './effects/GradualBlur'
import { FiArrowRight, FiArrowUp, FiDownload, FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'
import './App.css'
import Meekse from './assets/Meekse.jpeg'
import TrackViewer from './components/TrackViewer'
import BodeShowcase from './components/BodeShowcase'
import ApertureShowcase from './components/ApertureShowcase'
import hoodgoodsImage from './assets/Hoodgoods.png'

// Read per frame by the Aurora render loops — dragging the theme dial lerps
// the shader's color stops live without re-rendering React.
const themedAuroraStops = () => auroraStops(themeStore.get())
// Toward day, lift the aurora to (almost) flat stop color so it stays a
// light wash instead of a darkened multiply over the light background.
const themedAuroraLift = () => themeStore.get() * 0.9

function App() {
  const [showIntro, setShowIntro] = useState(true)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const [showMoreProjects, setShowMoreProjects] = useState(false)

  // Back-to-top appears once the viewport is near the bottom of the page.
  const [showBackToTop, setShowBackToTop] = useState(false)
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      setShowBackToTop(window.innerHeight + window.scrollY >= doc.scrollHeight - 240)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="app">
      <CustomCursor />
      {showIntro && <BrainIntro onDone={() => setShowIntro(false)} />}
      <header className="shell">
        <div className="nav-left">
          <ThemeDial />
        </div>

        <main className="main">
          {/* Landing section with Aurora background */}
          <section className="hero" id="top">
            <div className="aurora-hero-bg">
              <Aurora
                colorStops={["#8b5cf6", "#2dd4bf", "#4c1d95"]}
                getColorStops={themedAuroraStops}
                getLift={themedAuroraLift}
                blend={0.5}
                amplitude={1.0}
                speed={1}
              />
            </div>
            <div className="hero-photo">
              <GlassSurface
                width={320}
                height={380}
                borderRadius={40}
                displace={0.6}
                distortionScale={-160}
                redOffset={0}
                greenOffset={8}
                blueOffset={18}
                brightness={55}
                opacity={0.95}
                backgroundOpacity={0.15}
                mixBlendMode="screen"
              >
                <img src={Meekse} alt="Portrait of Jaishil" className="hero-photo-img" />
              </GlassSurface>
            </div>
            <div className="hero-text">
              <h1 className="hero-heading">
                Hi, I&apos;m <span className="hero-name">Jaishil Patel</span>
              </h1>
              <p className="hero-role">
                <span className="hero-role-static">I build </span>
                <RotatingText
                  className="hero-role-rotating"
                  items={[
                    'full-stack products',
                    'data-driven apps',
                    'clean APIs',
                    'rich front-ends',
                    'intelligent systems'
                  ]}
                />
              </p>
              <p className="hero-subtitle">
                A Computer Science graduate with majors being Computer Science, Computer Applications and Information Systems. I
                enjoy turning complex problems into elegant, data-driven products. I love working end-to-end: from models and APIs to rich front-ends.
              </p>
              <div className="hero-actions">
                <Magnetic strength={0.35}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => scrollToSection('projects')}
                  >
                    Check out my work <FiArrowRight />
                  </button>
                </Magnetic>
                <Magnetic strength={0.35}>
                  <a className="btn btn-ghost" href="/CV.pdf" download>
                    Grab my CV <FiDownload />
                  </a>
                </Magnetic>
              </div>
              <div className="hero-socials">
                <Magnetic strength={0.5}>
                  <a
                    className="hero-social"
                    href="mailto:jaishilpatel1105@gmail.com"
                    aria-label="Email"
                  >
                    <FiMail />
                  </a>
                </Magnetic>
                <Magnetic strength={0.5}>
                  <a
                    className="hero-social"
                    href="https://github.com/Jaishil-Patel"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                  >
                    <FiGithub />
                  </a>
                </Magnetic>
                <Magnetic strength={0.5}>
                  <a
                    className="hero-social"
                    href="https://www.linkedin.com/in/jaishil-patel-07766a320/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                  >
                    <FiLinkedin />
                  </a>
                </Magnetic>
              </div>
            </div>
            <button
              type="button"
              className="scroll-cue"
              onClick={() => scrollToSection('about')}
              aria-label="Scroll to about section"
            >
              <span className="scroll-cue__text">Scroll for an adventure</span>
              <span className="scroll-cue__mouse">
                <span className="scroll-cue__wheel" />
              </span>
            </button>
          </section>

          <section id="about" className="section about-section">
            <Reveal className="about-header" direction="scale">
              <h2 className="about-title">
                <span className="about-title-main">about</span>
                <span className="about-title-accent">me</span>
              </h2>
            </Reveal>
            <div className="about-bento">
              <Reveal className="bento-tile bento-intro" direction="up">
                <span className="bento-eyebrow">// the short version</span>
                <p className="bento-statement">
                  I design <span className="grad-text">intelligent systems</span> that
                  don&apos;t just work, they feel intentional and intuitive. From F1 data
                  visualisation to helping artisans sell online and a document opener, my work focuses on
                  clear value and clean engineering.
                </p>
              </Reveal>

              <Reveal className="bento-tile bento-terminal" direction="up" delay={0.05}>
                <div className="term-bar">
                  <span className="term-dot term-dot--r" />
                  <span className="term-dot term-dot--y" />
                  <span className="term-dot term-dot--g" />
                  <span className="term-title">jaishil@dev ~ %</span>
                </div>
                <pre className="term-body">
                  <code>
                    <span className="term-line">
                      <span className="term-prompt">$</span> whoami
                    </span>
                    <span className="term-out">→ cs grad + information systems</span>
                    <span className="term-line">
                      <span className="term-prompt">$</span> stack --top
                    </span>
                    <span className="term-out">→ react · typescript · node · python</span>
                    <span className="term-line">
                      <span className="term-prompt">$</span> mode
                    </span>
                    <span className="term-out">
                      → solving your problems<span className="term-caret" />
                    </span>
                  </code>
                </pre>
              </Reveal>

              <Reveal className="bento-tile bento-portrait" direction="left" delay={0.1}>
                <img src={Meekse} alt="Portrait of Jaishil" className="bento-portrait-img" />
                <div className="bento-portrait-glow" aria-hidden="true" />
                <span className="bento-portrait-name">Jaishil Patel</span>
              </Reveal>

              <Reveal className="bento-tile bento-bring" direction="up" delay={0.1}>
                <h3 className="bento-heading">What I bring</h3>
                <ul className="bento-list">
                  <li>Strong CS fundamentals and analytical thinking.</li>
                  <li>Hands-on with React, TypeScript, Node, SQL and cloud tooling.</li>
                  <li>Cleaning, shaping and surfacing data for decisions.</li>
                  <li>Iteration, testing and maintainable code by default.</li>
                </ul>
              </Reveal>

              <Reveal className="bento-tile bento-stats" direction="up" delay={0.05}>
                <div className="stat">
                  <span className="stat-num grad-text">
                    <CountUp to={9} suffix="+" />
                  </span>
                  <span className="stat-label">Languages</span>
                </div>
                <div className="stat">
                  <span className="stat-num grad-text">
                    <CountUp to={3} suffix="x" />
                  </span>
                  <span className="stat-label">Award-winning builds</span>
                </div>
                <div className="stat">
                  <span className="stat-num grad-text">
                    <CountUp to={4} suffix="+" />
                  </span>
                  <span className="stat-label">Years coding</span>
                </div>
                <div className="stat">
                  <span className="stat-num grad-text">∞</span>
                  <span className="stat-label">Curiosity</span>
                </div>
              </Reveal>

              <Reveal className="bento-tile bento-beyond" direction="up" delay={0.1}>
                <h3 className="bento-heading">Beyond the code</h3>
                <p>
                  I stay active through walks and workouts, front lever loading, and I&apos;m an active
                  member of BAPS.
                </p>
              </Reveal>
            </div>
          </section>

          <section id="skills" className="section">
            <Reveal className="section-header" direction="up">
              <h2>Technical Skills</h2>
              <p>A snapshot of the tools I&apos;m comfortable shipping with.</p>
            </Reveal>
            <div className="skills-marquees">
              <Marquee
                speed={30}
                items={[
                  'Python', 'React', 'TypeScript', 'Node.js', 'NestJS', 'Supabase',
                  'PostgreSQL', 'TensorFlow', 'Pandas', 'Java', 'C++'
                ]}
              />
              <Marquee
                speed={34}
                reverse
                items={[
                  'Vite', 'Git', 'Jest', 'REST APIs', 'Azure', 'Auth0', 'Vercel',
                  'Scikit-learn', 'NumPy', 'C#', 'SQL'
                ]}
              />
            </div>
            <Skills />
          </section>

          <section id="projects" className="section">
            <Reveal className="section-header" direction="up">
              <h2>Selected Projects</h2>
              <p>
                A few examples of how I like to combine engineering, data and user
                experience.
              </p>
            </Reveal>
            <div className="projects-grid projects-grid--bento">
              <Reveal className="project-item" direction="up" delay={0}>
                <h3 className="project-title">
                  <span className="project-index">01</span>RaceIQ
                </h3>
                {/* No <Tilt> here: the interactive 3D viewer needs a flat
                    (non-preserve-3d) compositing layer so Chrome doesn't evict
                    its WebGL context. The card also flips via 2D crossfade
                    (project--interactive) rather than a rotateY 3D flip. */}
                <div className="project-tilt">
                <SpotlightCard className="card project project--interactive" spotlightColor="var(--spotlight)">
                  <div className="card-face front">
                    {/* No color prop: TrackViewer themes the line itself
                        (teal at night, soft red at day). */}
                    <TrackViewer
                      src="/circuits/mc-1929.geojson"
                      className="project-image"
                    />
                    <p className="project-summary">
                      F1 statistics tracker
                    </p>
                  </div>
                  <div className="card-face back">
                    <div className="project-header">
                      <span className="chip chip-primary">Project of the year</span>
                    </div>
                    <p className="project-stack">
                      <span>TypeScript</span>
                      <span>React + Vite</span>
                      <span>NestJS</span>
                      <span>Supabase (PostgreSQL)</span>
                    </p>
                    <ul className="list-soft">
                      <li>
                        Built a full-stack F1 tracker with 25 years of driver and team
                        statistics in an intuitive visual interface.
                      </li>
                      <li>
                        Implemented a comparison engine with weighted metrics for drivers
                        and teams.
                      </li>
                      <li>
                        Rendered 3D racetracks on an HTML canvas for interactive
                        exploration.
                        
                      </li>
                      <li>
                        Used materialized views to clean and pre-aggregate data,
                        cutting load times by ~40%.
                        
                      </li>
                      <li>
                        Combined data science, modern web development, and a passion 
                        for motorsport into one immersive experience.
                        
                      </li>
                    </ul>
                  </div>
                </SpotlightCard>
                </div>
              </Reveal>

              <Reveal className="project-item" direction="up" delay={0.1}>
                <h3 className="project-title">
                  <span className="project-index">02</span>Bode
                </h3>
                <Tilt className="project-tilt">
                <SpotlightCard className="card project" spotlightColor="var(--spotlight)">
                  <div className="card-face front">
                    <BodeShowcase className="project-image project-image--cover" />
                    <p className="project-summary">
                      PDF reader &amp; annotator
                    </p>
                  </div>
                  <div className="card-face back">
                    <div className="project-header">
                      <span className="chip chip-primary">Open source</span>
                    </div>
                    <p className="project-stack">
                      <span>TypeScript</span>
                      <span>React</span>
                      <span>Tauri</span>
                      <span>Rust</span>
                      <span>PDF.js</span>
                    </p>
                    <ul className="list-soft">
                      <li>
                        Built a free, ad-free PDF reader and annotator that also opens
                        and edits Markdown, across desktop and mobile.
                      </li>
                      <li>
                        Shipped an annotation toolkit, highlighter, freehand pen,
                        shapes, text boxes and signatures, with export to flattened PDFs.
                      </li>
                      <li>
                        Added virtualised scrolling, full-text search, thumbnails and
                        outline navigation for smooth handling of large documents.
                      </li>
                      <li>
                        Packaged it cross-platform with Tauri for Windows, Linux
                        and Android.
                      </li>
                    </ul>
                  </div>
                </SpotlightCard>
                </Tilt>
              </Reveal>

              <Reveal className="project-item" direction="up" delay={0.2}>
                <h3 className="project-title">
                  <span className="project-index">03</span>Aperture Protocol
                </h3>
                <Tilt className="project-tilt">
                <SpotlightCard className="card project" spotlightColor="var(--spotlight)">
                  <div className="card-face front">
                    <ApertureShowcase className="project-image" />
                    <p className="project-summary">
                      3D escape room
                    </p>
                  </div>
                  <div className="card-face back">
                    <div className="project-header">
                      <span className="chip chip-primary">Game of the year</span>
                    </div>
                    <p className="project-stack">
                      <span>JavaScript</span>
                      <span>Three.js</span>
                      <span>HTML &amp; CSS</span>
                      <span>Blender</span>
                    </p>
                    <ul className="list-soft">
                      <li>
                        Created an interactive 3D escape room experience rendered in the
                        browser.
                      </li>
                      <li>
                        Modelled key assets in Blender and optimised them for real-time
                        rendering.
                      </li>
                      <li>
                        Implemented puzzle logic, progression, and environmental effects.
                      </li>
                      <li>
                        Tuned performance to keep frame rates smooth on mid-range
                        hardware.
                      </li>
                    </ul>
                  </div>
                </SpotlightCard>
                </Tilt>
              </Reveal>

              <Reveal className="project-item" direction="up" delay={0.3}>
                <h3 className="project-title">
                  <span className="project-index">04</span>HoodGoods
                </h3>
                <Tilt className="project-tilt">
                <SpotlightCard className="card project" spotlightColor="var(--spotlight)">
                  <div className="card-face front">
                    <img
                      src={hoodgoodsImage}
                      alt="HoodGoods marketplace preview"
                      className="project-image project-image--logo"
                    />
                    <p className="project-summary">
                      Local artisan marketplace
                    </p>
                  </div>
                  <div className="card-face back">
                    <p className="project-stack">
                      <span>React + Vite</span>
                      <span>NestJS</span>
                      <span>Supabase</span>
                      <span>Jest</span>
                    </p>
                    <ul className="list-soft">
                      <li>
                        Designed and implemented a full-stack e-commerce platform to
                        help small-scale artisans sell handcrafted goods.
                      </li>
                      <li>
                        Built authentication with Auth0, a shopping cart, and product
                        filters.
                      </li>
                      <li>
                        Integrated Supabase-backed APIs to manage listings and user
                        profiles.
                      </li>
                      <li>
                        Prioritised responsive layouts and clear UX for mobile users.
                      </li>
                    </ul>
                  </div>
                </SpotlightCard>
                </Tilt>
              </Reveal>
            </div>

            <Magnetic strength={0.5} className="projects-toggle-wrap">
              <button
                type="button"
                className="projects-toggle"
                onClick={() => setShowMoreProjects(prev => !prev)}
                aria-label={showMoreProjects ? 'Hide more projects' : 'View more projects'}
              >
                <img
                  src={arrowDown}
                  alt=""
                  className={showMoreProjects ? 'projects-toggle__icon projects-toggle__icon--up' : 'projects-toggle__icon'}
                />
              </button>
            </Magnetic>

            {showMoreProjects && (
              <div className="projects-grid projects-grid--more">
                <article className="card project project--simple">
                  <h3 className="project-title">Tutor Form Filler</h3>
                  <p className="project-stack">
                    <span>Python</span>
                    <span>Flask</span>
                    <span>python-docx</span>
                  </p>
                  <ul className="list-soft">
                    <li>Local web app for Wits tutors to log tutoring, marking and invigilation sessions.</li>
                    <li>Generates a completed university timesheet as a formatted Word document in one click.</li>
                    <li>Works fully offline with JSON-backed storage and month-based organisation.</li>
                  </ul>
                </article>

                <article className="card project project--simple">
                  <h3 className="project-title">Job Form Filler</h3>
                  <p className="project-stack">
                    <span>HTML</span>
                    <span>JavaScript</span>
                    <span>localStorage</span>
                  </p>
                  <ul className="list-soft">
                    <li>Single-file info hub that speeds up job application forms with one-click copy fields.</li>
                    <li>Tracks submitted applications and schedules interviews on a colour-coded calendar.</li>
                    <li>Runs entirely in the browser, no server, build step or external dependencies.</li>
                  </ul>
                </article>

                <article className="card project project--simple">
                  <h3 className="project-title">API Playground</h3>
                  <p className="project-stack">
                    <span>NestJS</span>
                    <span>Postman</span>
                    <span>PostgreSQL</span>
                  </p>
                  <ul className="list-soft">
                    <li>Collection of small APIs for experimenting with backend ideas.</li>
                    <li>Covers authentication, file uploads and CRUD patterns.</li>
                    <li>Used as a sandbox to test deployment and monitoring.</li>
                  </ul>
                </article>

                <article className="card project project--simple">
                  <h3 className="project-title">Task Tracker</h3>
                  <p className="project-stack">
                    <span>React</span>
                    <span>Node.js</span>
                    <span>MongoDB</span>
                  </p>
                  <ul className="list-soft">
                    <li>Lightweight app to capture and prioritise daily tasks.</li>
                    <li>Supports tags, due dates, and simple progress tracking.</li>
                    <li>Designed with a clean, minimal interface.</li>
                  </ul>
                </article>

                <article className="card project project--simple">
                  <h3 className="project-title">Portfolio Site</h3>
                  <p className="project-stack">
                    <span>React</span>
                    <span>TypeScript</span>
                    <span>Vite</span>
                  </p>
                  <ul className="list-soft">
                    <li>It's this site :) hope you are enjoying it :)</li>
                    <li>Built this responsive, animated portfolio from scratch.</li>
                    <li>Showcases projects, skills and experience in a single-page layout.</li>
                    <li>Uses reusable UI components and modern CSS effects.</li>
                  </ul>
                </article>
              </div>
            )}
          </section>

          <section id="experience" className="section section-grid">
            <Reveal className="section-header" direction="up">
              <h2>Journey</h2>
              <p>Education, experience and certifications that shape how I work.</p>
            </Reveal>
            <Journey />
          </section>

          <section id="contact" className="section contact">
            <Reveal className="contact-cta" direction="scale">
              <div className="contact-aurora" aria-hidden="true">
                <Aurora
                  colorStops={["#8b5cf6", "#2dd4bf", "#4c1d95"]}
                  getColorStops={themedAuroraStops}
                  getLift={themedAuroraLift}
                  blend={0.4}
                  amplitude={0.8}
                  speed={0.6}
                />
              </div>
              <div className="contact-cta-inner">
                <span className="contact-eyebrow">// let&apos;s talk</span>
                <h2 className="contact-headline">
                  Have an idea? <span className="grad-text">Let&apos;s build it.</span>
                </h2>
                <p className="contact-lead">
                  Data-heavy dashboards, experimental AI features or a full-stack
                  product, I&apos;d love to hear what you&apos;re working on.
                </p>
                <div className="contact-actions">
                  <Magnetic strength={0.35}>
                    <a className="btn btn-primary" href="mailto:jaishilpatel1105@gmail.com">
                      <FiMail /> Say hello
                    </a>
                  </Magnetic>
                  <Magnetic strength={0.35}>
                    <a className="btn btn-ghost" href="/CV.pdf" download>
                      <FiDownload /> Grab my CV
                    </a>
                  </Magnetic>
                </div>
                <div className="contact-meta">
                  <a className="contact-meta-item" href="mailto:jaishilpatel1105@gmail.com">
                    <FiMail /> jaishilpatel1105@gmail.com
                  </a>
                  <a className="contact-meta-item" href="tel:+27646572021">
                    +27 64 657 2021
                  </a>
                  <div className="contact-socials">
                    <Magnetic strength={0.5}>
                      <a
                        className="contact-social"
                        href="https://github.com/Jaishil-Patel"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub"
                      >
                        <FiGithub />
                      </a>
                    </Magnetic>
                    <Magnetic strength={0.5}>
                      <a
                        className="contact-social"
                        href="https://www.linkedin.com/in/jaishil-patel-07766a320/"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="LinkedIn"
                      >
                        <FiLinkedin />
                      </a>
                    </Magnetic>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
          <footer className="footer">
            <span>Designed &amp; built in React + TypeScript</span>
            <span className="footer-dot" />
          </footer>
        </main>
      </header>
      <button
        type="button"
        className={
          showBackToTop ? 'back-to-top back-to-top--visible' : 'back-to-top'
        }
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        tabIndex={showBackToTop ? 0 : -1}
      >
        <FiArrowUp />
      </button>
      <GradualBlur
        target="page"
        position="bottom"
        height="3.5rem"
        strength={2}
        divCount={5}
        curve="bezier"
        exponential
        opacity={1}
      />
    </div>
  )
}

export default App
