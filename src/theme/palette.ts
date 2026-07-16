// Shared JS-side color math for theme-aware canvas/WebGL pieces.
// The CSS side interpolates via color-mix(); anything drawn imperatively
// (aurora shader, three.js lines, intro canvas) uses these helpers instead.

export type Rgb = [number, number, number]

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function mixRgb(a: Rgb, b: Rgb, k: number): Rgb {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

export function mixHex(a: string, b: string, k: number): string {
  return rgbToHex(mixRgb(hexToRgb(a), hexToRgb(b), k))
}

// Aurora sky keyframes: night → dusk → day. The aurora is the most
// sky-like element on the page, so it gets true 3-stop interpolation —
// dragging through the middle passes through a sunset, not a gray average.
export const AURORA_NIGHT = ['#8b5cf6', '#2dd4bf', '#4c1d95']
export const AURORA_DUSK = ['#f472b6', '#fb923c', '#7c3aed']
// Day is a light turquoise ribbon. Kept clearly in the teal family so it
// stands out against the lavender paper instead of dissolving into it;
// rendered with full lift (see Aurora's uLift) so these read as-is.
export const AURORA_DAY = ['#8de9d8', '#5fe3cd', '#a9f0e3']

export function auroraStops(t: number): string[] {
  const [from, to, k] = t < 0.5
    ? ([AURORA_NIGHT, AURORA_DUSK, t * 2] as const)
    : ([AURORA_DUSK, AURORA_DAY, (t - 0.5) * 2] as const)
  return from.map((c, i) => mixHex(c, to[i], k))
}
