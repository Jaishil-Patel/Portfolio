// Single source of truth for the day–night value t ∈ [0, 1] (0 = night, 1 = day).
// Writes go straight to CSS custom properties on <html>, so scrubbing the dial
// re-colors the whole site without a single React render. Canvas/WebGL pieces
// read get() in their rAF loops or subscribe() for change-driven updates.

type Listener = (t: number) => void

// v2: key bumped when the default flipped to light, so a previously stored
// 'night' from the dark-default era doesn't override the new default.
const STORAGE_KEY = 'theme-pole-v2'
const listeners = new Set<Listener>()

function readInitialT(): number {
  // The no-flash inline script in index.html seeds --t before first paint.
  const raw = document.documentElement.style.getPropertyValue('--t')
  const parsed = parseFloat(raw)
  // Fallback matches the inline script's default: day (light) mode.
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 1
}

let t = readInitialT()
let scheme: 'light' | 'dark' | null = null

function apply(next: number) {
  t = Math.min(1, Math.max(0, next))
  const el = document.documentElement
  el.style.setProperty('--t', String(t))
  // --dusk peaks at t = 0.5; computed here rather than with CSS abs() for
  // broader browser support.
  el.style.setProperty('--dusk', String(1 - Math.abs(2 * t - 1)))
  const s = t >= 0.5 ? 'light' : 'dark'
  if (s !== scheme) {
    scheme = s
    el.style.colorScheme = s
    el.dataset.theme = s
  }
  listeners.forEach(l => l(t))
}

export const themeStore = {
  get: () => t,

  /** Scrub to an arbitrary t. Callers flush at most once per frame. */
  set: apply,

  /** Land on a pole and persist it. Mid-drag values are never persisted. */
  settle(pole: 0 | 1) {
    apply(pole)
    try {
      localStorage.setItem(STORAGE_KEY, pole === 1 ? 'day' : 'night')
    } catch {
      // storage unavailable (private mode etc.) — theme still works, just not remembered
    }
  },

  subscribe(l: Listener): () => void {
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  },
}

// Keep the store's scheme bookkeeping consistent with what the inline script set.
scheme = t >= 0.5 ? 'light' : 'dark'
