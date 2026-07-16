import { useEffect, useRef } from 'react'
import { animate } from 'motion/react'
import type { AnimationPlaybackControls } from 'motion/react'
import { themeStore } from '../theme/themeStore'
import './ThemeDial.css'

/* The theme control is an orbit: drag the celestial body along a 140° arc.
   Left end = sun (day), right end = moon (night). Any position in between is
   a real intermediate palette — release settles to the nearest pole.
   Geometry: arc center sits below the viewBox so the visible arc is a
   shallow dome. θ is measured in SVG coords (y down), so the dome spans
   200°..340°. t maps linearly (reversed) onto that span. */
const CX = 60
const CY = 78
const R = 46
const THETA_MIN = 200
const THETA_MAX = 340
const DEG = Math.PI / 180

function thetaFor(t: number) {
  // t = 1 (day/sun) sits at the left end of the dome, t = 0 (night/moon)
  // at the right end.
  return THETA_MAX - t * (THETA_MAX - THETA_MIN)
}

function posFor(t: number) {
  const th = thetaFor(t) * DEG
  return { x: CX + R * Math.cos(th), y: CY + R * Math.sin(th) }
}

function valueText(t: number) {
  return t < 0.25 ? 'Night' : t > 0.75 ? 'Day' : 'Dusk'
}

export default function ThemeDial() {
  const svgRef = useRef<SVGSVGElement>(null)
  const handleRef = useRef<SVGGElement>(null)
  const raysRef = useRef<SVGGElement>(null)
  const biteRef = useRef<SVGCircleElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const anim = useRef<AnimationPlaybackControls | null>(null)
  const dragging = useRef(false)
  const moved = useRef(false)
  const start = useRef({ x: 0, y: 0 })
  const pendingT = useRef<number | null>(null)
  const rafId = useRef(0)

  // Imperative visual update — runs at scrub rate, so no React state here.
  useEffect(() => {
    const render = (t: number) => {
      const { x, y } = posFor(t)
      if (handleRef.current) {
        handleRef.current.setAttribute('transform', `translate(${x} ${y})`)
      }
      // Sun rays grow in; the crescent "bite" slides off the disc as day comes.
      if (raysRef.current) {
        raysRef.current.setAttribute('transform', `scale(${0.4 + 0.6 * t})`)
        raysRef.current.style.opacity = String(t)
      }
      if (biteRef.current) {
        biteRef.current.setAttribute('cx', String(4 + (1 - t) * 5.5))
        biteRef.current.style.opacity = String(Math.min(1, (1 - t) * 2))
      }
      const btn = buttonRef.current
      if (btn) {
        btn.setAttribute('aria-valuenow', String(Math.round(t * 100)))
        btn.setAttribute('aria-valuetext', valueText(t))
      }
    }
    render(themeStore.get())
    return themeStore.subscribe(render)
  }, [])

  const stopAnim = () => {
    anim.current?.stop()
    anim.current = null
  }

  const settleTo = (pole: 0 | 1) => {
    stopAnim()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      themeStore.settle(pole)
      return
    }
    anim.current = animate(themeStore.get(), pole, {
      type: 'spring',
      stiffness: 180,
      damping: 22,
      onUpdate: v => themeStore.set(v),
      onComplete: () => themeStore.settle(pole),
    })
  }

  const tFromPointer = (e: React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return themeStore.get()
    const rect = svg.getBoundingClientRect()
    // Client → viewBox coords (viewBox is 0 0 120 64)
    const px = ((e.clientX - rect.left) / rect.width) * 120
    const py = ((e.clientY - rect.top) / rect.height) * 64
    let deg = Math.atan2(py - CY, px - CX) / DEG
    if (deg < 0) deg += 360
    // Anything below the horizon clamps to the nearest end of the dome.
    if (deg < THETA_MIN) deg = deg > 90 ? THETA_MIN : THETA_MAX
    if (deg > THETA_MAX) deg = THETA_MAX
    return (THETA_MAX - deg) / (THETA_MAX - THETA_MIN)
  }

  const flushScrub = () => {
    rafId.current = 0
    if (pendingT.current !== null) {
      themeStore.set(pendingT.current)
      pendingT.current = null
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    stopAnim()
    dragging.current = true
    moved.current = false
    start.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    // Generous threshold: a slightly jittery click still counts as a tap.
    if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) {
      moved.current = true
    }
    if (!moved.current) return
    pendingT.current = tFromPointer(e)
    if (!rafId.current) rafId.current = requestAnimationFrame(flushScrub)
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    if (rafId.current) {
      cancelAnimationFrame(rafId.current)
      flushScrub()
    }
    // A drag settles to the pole nearest the handle; a plain tap toggles —
    // sun becomes moon, moon becomes sun.
    if (moved.current) {
      settleTo(themeStore.get() >= 0.5 ? 1 : 0)
    } else {
      settleTo(themeStore.get() >= 0.5 ? 0 : 1)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const t = themeStore.get()
    const step = (d: number) => {
      stopAnim()
      themeStore.set(t + d)
    }
    switch (e.key) {
      // Left/right follow the handle on screen (sun left, moon right);
      // up/down follow slider convention (up = more day).
      case 'ArrowLeft':
      case 'ArrowUp':
        step(0.05)
        break
      case 'ArrowRight':
      case 'ArrowDown':
        step(-0.05)
        break
      case 'Home':
        settleTo(0)
        break
      case 'End':
        settleTo(1)
        break
      case 'Enter':
      case ' ':
        settleTo(t < 0.5 ? 1 : 0)
        break
      default:
        return
    }
    e.preventDefault()
  }

  // The page should never *rest* mid-dusk: leaving the control mid-arc
  // settles it to the nearest pole.
  const onBlur = () => {
    if (dragging.current) return
    const t = themeStore.get()
    if (t > 0.001 && t < 0.999) settleTo(t >= 0.5 ? 1 : 0)
  }

  useEffect(() => () => stopAnim(), [])

  return (
    <div className="theme-dial">
      <svg
        ref={svgRef}
        className="theme-dial__svg"
        viewBox="0 0 120 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Orbit track */}
        <path className="theme-dial__track" d={arcPath()} />
        {/* Horizon tick at the dusk midpoint */}
        <line className="theme-dial__tick" x1="60" y1="28" x2="60" y2="33" />
        {/* Stars fade out as day arrives (opacity driven by --t in CSS) */}
        <g className="theme-dial__stars">
          <circle cx="98" cy="18" r="1" />
          <circle cx="86" cy="10" r="1.4" />
          <circle cx="106" cy="32" r="1" />
        </g>
        {/* The celestial body */}
        <g ref={handleRef} className="theme-dial__handle">
          <g>
            <g ref={raysRef} className="theme-dial__rays">
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * 45 * Math.PI) / 180
                return (
                  <line
                    key={i}
                    x1={9.5 * Math.cos(a)}
                    y1={9.5 * Math.sin(a)}
                    x2={13 * Math.cos(a)}
                    y2={13 * Math.sin(a)}
                  />
                )
              })}
            </g>
            <mask id="theme-dial-crescent">
              <rect x="-14" y="-14" width="28" height="28" fill="white" />
              <circle ref={biteRef} cx="9.5" cy="-2.5" r="6.5" fill="black" />
            </mask>
            <circle
              className="theme-dial__body"
              r="7"
              mask="url(#theme-dial-crescent)"
            />
          </g>
        </g>
      </svg>
      {/* The a11y surface: a slider from night (0) to day (100). */}
      <button
        ref={buttonRef}
        type="button"
        className="theme-dial__hit interactive"
        role="slider"
        aria-label="Theme, from night to day"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(themeStore.get() * 100)}
        aria-valuetext={valueText(themeStore.get())}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
    </div>
  )
}

function arcPath() {
  // Drawn left (sun end) to right (moon end) so the clockwise sweep traces
  // the shallow dome, not the long way around.
  const a = posFor(1)
  const b = posFor(0)
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}
