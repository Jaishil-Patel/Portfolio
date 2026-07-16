import { useEffect, useRef, useState } from 'react'
import apertureArt from '../assets/Aper.png'
import './ApertureShowcase.css'

interface ApertureShowcaseProps {
  className?: string
}

/* Looping timeline (ms): a keypad mounted on a pair of blast doors solves
   itself — first try DENIED, second try is accepted, the keypad powers
   down, and the doors part along their seam to reveal the game art. */
const LOOP = 9200
const PANEL_IN = [0, 600] as const
/* First attempt: wrong code, one press per timestamp. */
const PRESSES_1 = [750, 1080, 1410, 1740] as const
const CODE_1 = '1234'
const DENIED = [2150, 2950] as const
/* Second attempt: 0451 — the immersive-sim door code. */
const PRESSES_2 = [3150, 3480, 3810, 4140] as const
const CODE_2 = '0451'
const GRANTED_AT = 4600
/* Keypad fades off before the doors move — nothing tears in half. */
const KEYPAD_OUT = [5000, 5500] as const
const DOORS = [5600, 7000] as const
const ART_AT = 5600

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => t * t * (3 - 2 * t)
const seg = (t: number, [a, b]: readonly [number, number]) =>
  clamp01((t - a) / (b - a))

function ApertureShowcase({ className }: ApertureShowcaseProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [art, setArt] = useState(false)
  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const artRef = useRef(false)

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

    /* The pair of door slabs the keypad is mounted on. Drawn first, offset
       apart by `slide`; the gap between them shows the art underneath. */
    const drawDoors = (t: number, slide: number) => {
      const granted = t >= GRANTED_AT
      const halfW = w / 2
      for (const dir of [-1, 1] as const) {
        const x = dir < 0 ? -slide : halfW + slide
        if (x + halfW < 0 || x > w) continue

        /* Slab body: brushed-dark metal, lit faintly toward the seam. */
        const slab = ctx.createLinearGradient(x, 0, x + halfW, 0)
        const edgeTone = '#191424'
        const seamTone = '#221c31'
        slab.addColorStop(0, dir < 0 ? edgeTone : seamTone)
        slab.addColorStop(1, dir < 0 ? seamTone : edgeTone)
        ctx.fillStyle = slab
        ctx.fillRect(x, 0, halfW, h)

        /* Horizontal panel grooves for a machined look. */
        for (const fy of [0.22, 0.5, 0.78]) {
          const gy = Math.round(fy * h) + 0.5
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, gy)
          ctx.lineTo(x + halfW, gy)
          ctx.stroke()
          ctx.strokeStyle = 'rgba(233, 231, 240, 0.05)'
          ctx.beginPath()
          ctx.moveTo(x, gy + 1)
          ctx.lineTo(x + halfW, gy + 1)
          ctx.stroke()
        }

        /* Seam edge: a hairline that arms teal once the code is accepted. */
        const seamX = (dir < 0 ? x + halfW : x) + dir * -0.5
        ctx.save()
        if (granted) {
          ctx.shadowColor = 'rgba(45, 212, 191, 0.8)'
          ctx.shadowBlur = 8
          ctx.strokeStyle = 'rgba(45, 212, 191, 0.9)'
        } else {
          ctx.strokeStyle = 'rgba(168, 163, 186, 0.35)'
        }
        ctx.lineWidth = granted ? 1.5 : 1
        ctx.beginPath()
        ctx.moveTo(seamX, 0)
        ctx.lineTo(seamX, h)
        ctx.stroke()
        ctx.restore()
      }
    }

    /* The keypad panel mounted over the seam; `alpha` fades it off once
       access is granted, before the doors move. */
    const drawKeypad = (t: number, alpha: number) => {
      const tIn = easeOutCubic(seg(t, PANEL_IN))
      const outP = easeInOut(seg(t, KEYPAD_OUT))

      /* Shake while the panel refuses the wrong code. */
      let shakeX = 0
      if (t >= DENIED[0] && t < DENIED[1]) {
        shakeX = Math.sin(t * 0.09) * 4 * Math.exp(-(t - DENIED[0]) / 260)
      }

      /* Slightly below center so the display row clears the card's
         "flip for details" chip at the top. */
      let panelH = h * 0.74
      let panelW = panelH * 0.64
      if (panelW > w * 0.42) {
        panelW = w * 0.42
        panelH = panelW / 0.64
      }
      const px = (w - panelW) / 2 + shakeX
      const py = (h - panelH) / 2 + h * 0.03 + (1 - tIn) * 12 - outP * 8
      const granted = t >= GRANTED_AT

      ctx.globalAlpha = alpha

      /* Panel body */
      ctx.save()
      ctx.shadowColor = granted ? 'rgba(45, 212, 191, 0.45)' : 'rgba(0, 0, 0, 0.55)'
      ctx.shadowBlur = granted ? 26 : 20
      ctx.shadowOffsetY = granted ? 0 : 6
      ctx.fillStyle = '#171321'
      ctx.beginPath()
      ctx.roundRect(px, py, panelW, panelH, 6)
      ctx.fill()
      ctx.restore()
      ctx.strokeStyle = granted ? 'rgba(45, 212, 191, 0.7)' : 'rgba(168, 163, 186, 0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(px, py, panelW, panelH, 6)
      ctx.stroke()

      const pad = panelW * 0.1

      /* Display */
      const dispH = panelH * 0.14
      ctx.fillStyle = '#0c0a12'
      ctx.beginPath()
      ctx.roundRect(px + pad, py + pad, panelW - pad * 2, dispH, 3)
      ctx.fill()

      const pressed = (arr: readonly number[]) => arr.filter(pt => t >= pt).length
      let text = 'ENTER CODE'
      let color = '#8f89a6'
      let small = true
      if (t >= GRANTED_AT) {
        text = 'OPEN'
        color = '#2dd4bf'
        small = false
      } else if (t >= DENIED[1]) {
        const n = pressed(PRESSES_2)
        if (n > 0) {
          text = '•'.repeat(n)
          color = '#e9e7f0'
          small = false
        }
      } else if (t >= DENIED[0]) {
        text = 'DENIED'
        color = '#f87171'
        small = false
      } else {
        const n = pressed(PRESSES_1)
        if (n > 0) {
          text = '•'.repeat(n)
          color = '#e9e7f0'
          small = false
        }
      }
      ctx.fillStyle = color
      ctx.font = `${small ? 500 : 700} ${dispH * (small ? 0.38 : 0.52)}px 'SF Mono', ui-monospace, Consolas, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (text.startsWith('•')) ctx.font = `700 ${dispH * 0.6}px 'SF Mono', ui-monospace, Consolas, monospace`
      ctx.fillText(text, px + panelW / 2, py + pad + dispH / 2 + 1)

      /* Keypad grid */
      const gridTop = py + pad + dispH + pad * 0.8
      const gridH = py + panelH - pad - gridTop
      const gap = panelW * 0.035
      const keyW = (panelW - pad * 2 - gap * 2) / 3
      const keyH = (gridH - gap * 3) / 4

      /* Which key is glowing right now (decays after each press) */
      const glowFor = (digit: string) => {
        let g = 0
        const hit = (codes: string, times: readonly number[]) => {
          for (let i = 0; i < times.length; i++) {
            if (codes[i] === digit && t >= times[i]) {
              g = Math.max(g, Math.exp(-(t - times[i]) / 240))
            }
          }
        }
        hit(CODE_1, PRESSES_1)
        hit(CODE_2, PRESSES_2)
        return g
      }

      for (let i = 0; i < KEYS.length; i++) {
        const col = i % 3
        const row = (i / 3) | 0
        const kx = px + pad + col * (keyW + gap)
        const ky = gridTop + row * (keyH + gap)
        const glow = glowFor(KEYS[i])

        ctx.fillStyle = glow > 0.02 ? `rgba(139, 92, 246, ${0.18 + glow * 0.5})` : '#211c2e'
        ctx.beginPath()
        ctx.roundRect(kx, ky, keyW, keyH, 3)
        ctx.fill()
        ctx.strokeStyle =
          glow > 0.02
            ? `rgba(196, 167, 255, ${0.4 + glow * 0.6})`
            : 'rgba(168, 163, 186, 0.22)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(kx, ky, keyW, keyH, 3)
        ctx.stroke()

        ctx.fillStyle = glow > 0.02 ? '#f3edff' : '#a5a1b3'
        ctx.font = `500 ${keyH * 0.42}px 'SF Mono', ui-monospace, Consolas, monospace`
        ctx.fillText(KEYS[i], kx + keyW / 2, ky + keyH / 2 + 1)
      }

      ctx.globalAlpha = 1
    }

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const doorP = easeInOut(seg(t, DOORS))
      const slide = doorP * w * 0.55

      /* Light flooding through the widening gap — brightest mid-open,
         gone once the doors are fully parted and the art stands alone. */
      if (doorP > 0) {
        const beamA = Math.sin(Math.PI * doorP) * 0.55
        const beamW = Math.max(6, slide * 2.6)
        const grad = ctx.createLinearGradient(w / 2 - beamW / 2, 0, w / 2 + beamW / 2, 0)
        grad.addColorStop(0, 'rgba(45, 212, 191, 0)')
        grad.addColorStop(0.5, `rgba(214, 255, 249, ${beamA})`)
        grad.addColorStop(1, 'rgba(45, 212, 191, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      drawDoors(t, slide)

      const keypadAlpha =
        easeOutCubic(seg(t, PANEL_IN)) * (1 - easeInOut(seg(t, KEYPAD_OUT)))
      if (keypadAlpha > 0.01) drawKeypad(t, keypadAlpha)
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

      const showArt = cycle >= ART_AT
      if (showArt !== artRef.current) {
        artRef.current = showArt
        setArt(showArt)
      }
      draw(Math.min(cycle, DOORS[1]))
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

  const artVisible = art || reduced
  return (
    <div ref={rootRef} className={`aperture-show ${className ?? ''}`} aria-hidden="true">
      {/* The canvas stays visible throughout: once the doors slide offscreen
          it is transparent, so the art below shows through the open doorway. */}
      {!reduced && <canvas ref={canvasRef} className="aperture-show__canvas" />}
      <img
        src={apertureArt}
        alt=""
        className={
          artVisible ? 'aperture-show__art aperture-show__art--visible' : 'aperture-show__art'
        }
      />
    </div>
  )
}

export default ApertureShowcase
