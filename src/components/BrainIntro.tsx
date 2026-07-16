import { useEffect, useRef, useState } from 'react'
import './BrainIntro.css'

type Stage = 'boot' | 'alive' | 'zoom' | 'flash'

interface BrainIntroProps {
  onDone: () => void
}

/* Side-profile brain silhouette + gyri (folds), in a ~210x150 local space. */
const OUTLINE =
  'M30 108 C14 96 10 70 24 52 C34 30 60 16 88 16 C120 8 158 14 178 36 ' +
  'C196 52 200 78 190 96 C186 104 178 106 174 112 C178 124 166 136 150 132 ' +
  'C140 130 136 124 130 122 L126 138 L114 136 L118 122 C96 122 70 120 52 114 ' +
  'C44 112 36 110 30 108 Z'

const GYRI = [
  'M38 62 C56 40 88 42 96 62 C102 76 86 88 70 82',
  'M108 30 C140 24 162 44 156 64',
  'M118 92 C134 78 158 82 166 98',
  'M56 96 C74 106 96 102 106 88',
  'M126 52 C138 44 150 48 152 58',
]

const BRAIN_CX = 105
const BRAIN_CY = 76
/* The point we dive into (roughly the frontal cortex). */
const FOCAL_X = 102
const FOCAL_Y = 66

/* Timeline (ms) */
const FORM_END = 1300
const ZOOM_START = 3600
const ZOOM_END = 4900
const FLASH_AT = ZOOM_END - 240
const DONE_AT = 5400
const REDUCED_DONE_AT = 3200

const VIOLET = [139, 92, 246]
const TEAL = [45, 212, 191]

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/* Violet → teal mix, optionally lifted toward white. */
function col(k: number, a: number, lift = 0) {
  const r = lerp(lerp(VIOLET[0], TEAL[0], k), 255, lift)
  const g = lerp(lerp(VIOLET[1], TEAL[1], k), 255, lift)
  const b = lerp(lerp(VIOLET[2], TEAL[2], k), 255, lift)
  return `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`
}

interface Neuron {
  tx: number
  ty: number
  sx: number
  sy: number
  delay: number
  phase: number
  speed: number
  r: number
  hue: number
  /* per-frame scratch */
  x: number
  y: number
  nt: number
  px: number
  py: number
}

interface Pulse {
  a: number
  b: number
  t: number
  v: number
  hue: number
}

function BrainIntro({ onDone }: BrainIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const [stage, setStage] = useState<Stage>('boot')
  const [leaving, setLeaving] = useState(false)
  const stageRef = useRef<Stage>('boot')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const zoomStart = reduced ? Infinity : ZOOM_START
    const doneAt = reduced ? REDUCED_DONE_AT : DONE_AT
    const leaveAt = doneAt - 460

    let w = 0
    let h = 0
    let dpr = 1
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    /* Sample neurons inside the silhouette on a jittered grid. */
    const outline = new Path2D(OUTLINE)
    const gyri = GYRI.map(d => new Path2D(d))
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const neurons: Neuron[] = []
    const step = w < 640 ? 10.5 : 8.5
    for (let gx = 16; gx <= 198; gx += step) {
      for (let gy = 12; gy <= 142; gy += step) {
        const x = gx + Math.random() * 6 - 3
        const y = gy + Math.random() * 6 - 3
        if (!ctx.isPointInPath(outline, x, y)) continue
        const ang = Math.random() * Math.PI * 2
        const dist = 90 + Math.random() * 170
        neurons.push({
          tx: x,
          ty: y,
          sx: BRAIN_CX + Math.cos(ang) * dist,
          sy: BRAIN_CY + Math.sin(ang) * dist * 0.8,
          delay: Math.random() * 520,
          phase: Math.random() * Math.PI * 2,
          speed: 0.8 + Math.random() * 1.6,
          r: 1.1 + Math.random() * 1.5,
          hue: Math.random() * Math.random() * 0.8,
          x: 0,
          y: 0,
          nt: 0,
          px: NaN,
          py: NaN,
        })
      }
    }

    /* Synapses: connect each neuron to its nearest neighbours. */
    const edges: Array<[number, number]> = []
    for (let i = 0; i < neurons.length; i++) {
      const near: Array<[number, number]> = []
      for (let j = i + 1; j < neurons.length; j++) {
        const dx = neurons[i].tx - neurons[j].tx
        const dy = neurons[i].ty - neurons[j].ty
        const d2 = dx * dx + dy * dy
        if (d2 < 15 * 15) near.push([d2, j])
      }
      near.sort((a, b) => a[0] - b[0])
      for (let k = 0; k < Math.min(3, near.length); k++) {
        edges.push([i, near[k][1]])
      }
    }

    const pulses: Pulse[] = []
    let lastSpawn = 0
    let raf = 0
    let last = performance.now()
    let finished = false
    /* Accumulated frame time (dt capped per frame), not wall clock: if the
       tab is hidden and rAF pauses, the intro pauses instead of being
       silently skipped by a huge time jump. */
    let elapsed = reduced ? FORM_END : 0

    const frame = (now: number) => {
      const dt = Math.min(48, now - last)
      last = now
      elapsed += dt
      const t = elapsed

      if (t >= doneAt) {
        if (!finished) {
          finished = true
          onDoneRef.current()
        }
        return
      }
      raf = requestAnimationFrame(frame)

      const zoomT = clamp01((t - zoomStart) / (ZOOM_END - zoomStart))
      const zEase = Math.pow(zoomT, 2.4)
      const zoomScale = Math.pow(72, zEase)

      /* Stage / leaving state (guarded so we don't re-render every frame). */
      let st: Stage
      if (t < 420) st = 'boot'
      else if (t < zoomStart) st = 'alive'
      else if (t < FLASH_AT) st = 'zoom'
      else st = 'flash'
      if (st !== stageRef.current) {
        stageRef.current = st
        setStage(st)
      }
      if (t > leaveAt) setLeaving(true)

      /* --- Draw --- */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (zoomT > 0) {
        /* Fade-clear leaves light trails during the dive. */
        ctx.fillStyle = 'rgba(7, 5, 14, 0.26)'
        ctx.fillRect(0, 0, w, h)
      } else {
        ctx.clearRect(0, 0, w, h)
      }

      const cx = w / 2
      const cy = h * 0.42
      const breathe = reduced ? 1 : 1 + 0.018 * Math.sin(t / 850)
      const s = Math.min(w / 260, h / 230) * breathe * zoomScale
      const ax = lerp(BRAIN_CX, FOCAL_X, clamp01(zoomT * 1.6))
      const ay = lerp(BRAIN_CY, FOCAL_Y, clamp01(zoomT * 1.6))

      /* Neuron screen positions. */
      for (const n of neurons) {
        n.nt = easeOutCubic(clamp01((t - n.delay) / 800))
        const jx = Math.sin(t * 0.001 * n.speed + n.phase) * 0.7
        const jy = Math.cos(t * 0.0013 * n.speed + n.phase) * 0.7
        n.x = cx + (lerp(n.sx, n.tx, n.nt) + jx - ax) * s
        n.y = cy + (lerp(n.sy, n.ty, n.nt) + jy - ay) * s
      }

      /* Outline + gyri, traced on with dashes, in local space. */
      const outlineFade = 1 - clamp01(zoomT * 2.5)
      if (outlineFade > 0.01) {
        ctx.save()
        ctx.transform(s, 0, 0, s, cx - ax * s, cy - ay * s)
        const trace = easeOutCubic(clamp01((t - 100) / 1500))
        const oa = (0.45 + 0.18 * Math.sin(t / 600)) * trace * outlineFade
        ctx.setLineDash([760 * trace, 760])
        ctx.lineCap = 'round'
        ctx.strokeStyle = col(0.15, oa * 0.28)
        ctx.lineWidth = 4.5 / s
        ctx.stroke(outline)
        ctx.strokeStyle = col(0.1, oa, 0.35)
        ctx.lineWidth = 1.4 / s
        ctx.stroke(outline)
        for (let i = 0; i < gyri.length; i++) {
          const gp = easeOutCubic(clamp01((t - 500 - i * 140) / 650))
          if (gp <= 0) continue
          ctx.setLineDash([220 * gp, 220])
          ctx.strokeStyle = col(0.6, 0.3 * gp * outlineFade)
          ctx.lineWidth = 1 / s
          ctx.stroke(gyri[i])
        }
        ctx.restore()
        ctx.setLineDash([])
      }

      /* Synapse edges. */
      ctx.lineCap = 'round'
      for (let i = 0; i < edges.length; i++) {
        const a = neurons[edges[i][0]]
        const b = neurons[edges[i][1]]
        const vis = Math.min(a.nt, b.nt)
        if (vis <= 0.05) continue
        const shimmer = 0.5 + 0.5 * Math.sin(t / 900 + i * 1.7)
        const al = (0.05 + 0.06 * shimmer) * vis + zoomT * 0.08
        ctx.strokeStyle = col(0.3 + zoomT * 0.5, al)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      /* Firing pulses travelling along synapses. */
      if (t > FORM_END * 0.7 && edges.length > 0) {
        const interval = zoomT > 0 ? 26 : 85
        if (t - lastSpawn > interval && pulses.length < 70) {
          lastSpawn = t
          const e = edges[(Math.random() * edges.length) | 0]
          const flip = Math.random() < 0.5
          pulses.push({
            a: flip ? e[1] : e[0],
            b: flip ? e[0] : e[1],
            t: 0,
            v: 0.0012 + Math.random() * 0.0022,
            hue: Math.random(),
          })
        }
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]
        p.t += p.v * dt
        if (p.t >= 1) {
          pulses.splice(i, 1)
          continue
        }
        const a = neurons[p.a]
        const b = neurons[p.b]
        const x = lerp(a.x, b.x, p.t)
        const y = lerp(a.y, b.y, p.t)
        /* Light up the synapse being travelled. */
        ctx.strokeStyle = col(p.hue, 0.14)
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
        ctx.fillStyle = col(p.hue, 0.3)
        ctx.beginPath()
        ctx.arc(x, y, 3.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = col(p.hue, 0.95, 0.7)
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      /* Neurons (with warp streaks during the dive). */
      const rMul = Math.min(3.5, 0.9 + 0.35 * Math.sqrt(zoomScale))
      for (const n of neurons) {
        const na = 0.25 + 0.75 * n.nt
        const hueMix = clamp01(n.hue * 0.35 + zoomT * 0.9)
        const onscreen = n.x > -60 && n.x < w + 60 && n.y > -60 && n.y < h + 60
        if (zoomT > 0 && !Number.isNaN(n.px) && onscreen) {
          ctx.strokeStyle = col(hueMix, 0.35 * na)
          ctx.lineWidth = Math.max(1, n.r * 0.8)
          ctx.beginPath()
          ctx.moveTo(n.px, n.py)
          ctx.lineTo(n.x, n.y)
          ctx.stroke()
        }
        n.px = n.x
        n.py = n.y
        if (!onscreen) continue
        const rr = n.r * (1 + 0.3 * Math.sin(t * 0.002 * n.speed + n.phase)) * rMul
        ctx.fillStyle = col(hueMix, 0.1 * na)
        ctx.beginPath()
        ctx.arc(n.x, n.y, rr * 2.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = col(hueMix, 0.9 * na, 0.55)
        ctx.beginPath()
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2)
        ctx.fill()
      }

      /* Core glow at the dive point — flares as we approach. */
      const fx = cx + (FOCAL_X - ax) * s
      const fy = cy + (FOCAL_Y - ay) * s
      const glowR = Math.min(w, h) * (0.09 + zEase * 1.3)
      const glowA = (0.1 + 0.16 * Math.sin(t / 700)) * clamp01(t / 1400) + zEase * 0.55
      const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowR)
      grad.addColorStop(0, col(0.35 + zoomT * 0.4, Math.min(0.85, glowA), 0.5))
      grad.addColorStop(0.4, col(0.2, Math.min(0.5, glowA * 0.5)))
      grad.addColorStop(1, col(0.2, 0))
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(fx, fy, glowR, 0, Math.PI * 2)
      ctx.fill()
    }

    raf = requestAnimationFrame(frame)

    /* Skip: jump straight to the dive (or to the fade, if motion is reduced). */
    const skip = () => {
      if (reduced) {
        elapsed = Math.max(elapsed, REDUCED_DONE_AT - 480)
      } else if (elapsed < ZOOM_START) {
        elapsed = ZOOM_START
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') skip()
    }
    canvas.parentElement?.addEventListener('pointerdown', skip)
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKey)
      canvas.parentElement?.removeEventListener('pointerdown', skip)
    }
  }, [])

  return (
    <div
      className={leaving ? 'brain-intro brain-intro--leaving' : 'brain-intro'}
      data-stage={stage}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="brain-intro__canvas" />
      <div className="brain-intro__text">
        <h1 className="bi-title">Welcome.</h1>
        <p className="bi-sub">
          Diving into <span className="bi-grad">Jaishil&apos;s mind</span>
        </p>
      </div>
      <div className="brain-intro__flash" />
    </div>
  )
}

export default BrainIntro
