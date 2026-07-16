import { useEffect, useRef, useState } from 'react'
import bodeLogo from '../assets/bode.png'
import './BodeShowcase.css'

interface BodeShowcaseProps {
  className?: string
}

/* Looping timeline (ms). The logo phase runs to the end of the loop; the
   fade back to a fresh page overlaps the next cycle's paper-in via CSS. */
const LOOP = 8400
const PAPER_IN = [0, 600] as const
const HL_TEAL = [700, 1700] as const
const HL_VIOLET = [1900, 2700] as const
const CIRCLE = [2900, 3900] as const
const SIGN = [4100, 5300] as const
const LOGO_AT = 5700

/* Text rows on the page: width as a fraction of the page width. Row 3 has a
   separate short "word" chunk that the pen circles. */
const ROWS = [0.82, 0.66, 0.78, 0.36, 0.74, 0.6, 0.7, 0.42]
const WORD_ROW = 3
const HL_TEAL_ROW = 1
const HL_VIOLET_ROW = 4

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => t * t * (3 - 2 * t)
const seg = (t: number, [a, b]: readonly [number, number]) =>
  clamp01((t - a) / (b - a))

function BodeShowcase({ className }: BodeShowcaseProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [logo, setLogo] = useState(false)
  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const logoRef = useRef(false)

  useEffect(() => {
    if (reduced) return
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    const resize = () => {
      const r = root.getBoundingClientRect()
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = r.width
      h = r.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(root)

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      /* Page geometry: portrait sheet centered on the dark stage, raised a
         touch so the caption overlay at the card bottom doesn't sit on it. */
      let pageH = h * 0.78
      let pageW = pageH * 0.72
      if (pageW > w * 0.55) {
        pageW = w * 0.55
        pageH = pageW / 0.72
      }
      const tIn = easeOutCubic(seg(t, PAPER_IN))
      const px = (w - pageW) / 2
      const py = (h - pageH) / 2 - h * 0.045 + (1 - tIn) * 12

      ctx.globalAlpha = tIn

      /* Paper */
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 22
      ctx.shadowOffsetY = 8
      ctx.fillStyle = '#f5f2fd'
      ctx.beginPath()
      ctx.roundRect(px, py, pageW, pageH, 3)
      ctx.fill()
      ctx.restore()

      const pad = pageW * 0.09
      const barH = pageH * 0.03
      const rowY = (i: number) => py + pageH * (0.24 + i * 0.062)

      /* Title + rule */
      ctx.fillStyle = '#262230'
      ctx.font = `600 ${pageW * 0.095}px Georgia, 'Times New Roman', serif`
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('Bode', px + pad, py + pageH * 0.13)
      ctx.fillStyle = '#8b84a6'
      ctx.font = `${pageW * 0.038}px Georgia, serif`
      ctx.fillText('annotated.pdf', px + pad, py + pageH * 0.175)
      ctx.strokeStyle = 'rgba(38, 34, 48, 0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px + pad, py + pageH * 0.2)
      ctx.lineTo(px + pageW - pad, py + pageH * 0.2)
      ctx.stroke()

      /* Body text as skeleton bars */
      ctx.fillStyle = '#c8c2df'
      for (let i = 0; i < ROWS.length; i++) {
        ctx.beginPath()
        ctx.roundRect(px + pad, rowY(i), pageW * ROWS[i], barH, barH / 2)
        ctx.fill()
      }
      /* The short "word" chunk on the circled row */
      const wordX = px + pad + pageW * (ROWS[WORD_ROW] + 0.04)
      const wordW = pageW * 0.14
      ctx.fillStyle = '#a79fc2'
      ctx.beginPath()
      ctx.roundRect(wordX, rowY(WORD_ROW), wordW, barH, barH / 2)
      ctx.fill()

      /* Highlighter sweeps (multiply reads like real highlighter ink) */
      const highlight = (row: number, p: number, color: string) => {
        if (p <= 0) return
        ctx.globalCompositeOperation = 'multiply'
        ctx.fillStyle = color
        const x0 = px + pad - barH * 0.4
        const fullW = pageW * ROWS[row] + barH * 0.8
        ctx.beginPath()
        ctx.roundRect(x0, rowY(row) - barH * 0.55, fullW * p, barH * 2.1, barH)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }
      highlight(HL_TEAL_ROW, easeInOut(seg(t, HL_TEAL)), '#9df0e4')
      highlight(HL_VIOLET_ROW, easeInOut(seg(t, HL_VIOLET)), '#d5c3fb')

      /* Pen circle around the word chunk, traced on with a dash */
      const pCircle = easeInOut(seg(t, CIRCLE))
      if (pCircle > 0) {
        const cx = wordX + wordW / 2
        const cy = rowY(WORD_ROW) + barH / 2
        const rx = wordW * 0.85
        const ry = barH * 2.3
        const L = 2 * Math.PI * Math.max(rx, ry)
        ctx.strokeStyle = '#6d3fd4'
        ctx.lineWidth = Math.max(1.2, pageW * 0.008)
        ctx.lineCap = 'round'
        ctx.setLineDash([L * pCircle, L])
        ctx.beginPath()
        /* Slightly wobbly hand-drawn ellipse: start at the right edge and
           overshoot a little past a full turn. */
        for (let a = 0; a <= Math.PI * 2.15; a += 0.12) {
          const wob = 1 + 0.05 * Math.sin(a * 3 + 1.2)
          const x = cx + Math.cos(a) * rx * wob
          const y = cy + Math.sin(a) * ry * wob
          if (a === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }

      /* Signature: baseline + self-writing squiggle */
      const sigY = py + pageH * 0.9
      ctx.strokeStyle = 'rgba(38, 34, 48, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px + pageW * 0.52, sigY)
      ctx.lineTo(px + pageW * 0.91, sigY)
      ctx.stroke()

      const pSign = easeInOut(seg(t, SIGN))
      if (pSign > 0) {
        const sx = (fx: number) => px + pageW * fx
        const sy = (fy: number) => py + pageH * fy
        const L = pageW * 0.55
        ctx.strokeStyle = '#3b3564'
        ctx.lineWidth = Math.max(1.2, pageW * 0.009)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.setLineDash([L * pSign, L])
        ctx.beginPath()
        ctx.moveTo(sx(0.55), sy(0.885))
        ctx.bezierCurveTo(sx(0.575), sy(0.845), sx(0.605), sy(0.845), sx(0.59), sy(0.883))
        ctx.bezierCurveTo(sx(0.578), sy(0.912), sx(0.64), sy(0.858), sx(0.67), sy(0.868))
        ctx.bezierCurveTo(sx(0.7), sy(0.878), sx(0.71), sy(0.852), sx(0.745), sy(0.86))
        ctx.bezierCurveTo(sx(0.79), sy(0.87), sx(0.83), sy(0.865), sx(0.875), sy(0.87))
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.globalAlpha = 1
    }

    let raf = 0
    let last = performance.now()
    let elapsed = 0
    let running = false

    const frame = (now: number) => {
      const dt = Math.min(48, now - last)
      last = now
      elapsed += dt
      const cycle = elapsed % LOOP

      const showLogo = cycle >= LOGO_AT
      if (showLogo !== logoRef.current) {
        logoRef.current = showLogo
        setLogo(showLogo)
      }
      /* While the logo holds, keep the fully annotated page underneath so
         the fade back reveals a finished document mid-transition. */
      draw(Math.min(cycle, LOGO_AT))
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    /* Only animate while the card is near the viewport. */
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start()
        else stop()
      },
      { rootMargin: '80px' }
    )
    io.observe(root)

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
    }
  }, [reduced])

  const logoVisible = logo || reduced
  return (
    <div ref={rootRef} className={`bode-show ${className ?? ''}`} aria-hidden="true">
      {!reduced && (
        <canvas
          ref={canvasRef}
          className={
            logoVisible ? 'bode-show__canvas bode-show__canvas--hidden' : 'bode-show__canvas'
          }
        />
      )}
      <img
        src={bodeLogo}
        alt=""
        className={logoVisible ? 'bode-show__logo bode-show__logo--visible' : 'bode-show__logo'}
      />
    </div>
  )
}

export default BodeShowcase
