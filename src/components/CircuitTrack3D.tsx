import { useEffect, useMemo, useState } from 'react';
import { CatmullRomCurve3, EllipseCurve, Vector3 } from 'three';
import { Line, Html } from '@react-three/drei';

export type TrackStatus = 'loading' | 'ready' | 'missing';

type CircuitTrack3DProps = {
  /** Path under /public, e.g. "/circuits/mc-1929.geojson". */
  src: string;
  color?: string;
  lineWidth?: number;
  onStatusChange?: (status: TrackStatus) => void;
};

/* ------------------------------------------------------------------ */
/* GeoJSON parsing — deliberately tolerant                             */
/* ------------------------------------------------------------------ */

type Geometry = {
  type: string;
  coordinates: unknown;
};

/** Walk any supported geometry down to a flat array of [x, y] pairs. */
function extractCoords(geometry: Geometry): number[][] {
  const out: number[][] = [];
  const pushPair = (pair: unknown) => {
    if (
      Array.isArray(pair) &&
      typeof pair[0] === 'number' &&
      typeof pair[1] === 'number' &&
      Number.isFinite(pair[0]) &&
      Number.isFinite(pair[1])
    ) {
      out.push([pair[0], pair[1]]);
    }
  };

  const { type, coordinates: c } = geometry;
  if (type === 'LineString') {
    (c as unknown[]).forEach(pushPair);
  } else if (type === 'MultiLineString') {
    (c as unknown[][]).forEach(line => line.forEach(pushPair));
  } else if (type === 'Polygon') {
    // outer ring
    (((c as unknown[])[0] as unknown[]) ?? []).forEach(pushPair);
  } else if (type === 'MultiPolygon') {
    // outer ring of first polygon
    ((((c as unknown[])[0] as unknown[])?.[0] as unknown[]) ?? []).forEach(pushPair);
  }
  return out;
}

/** Accepts a FeatureCollection, a single Feature, or a bare geometry. */
function coordsFromGeoJSON(data: unknown): number[][] {
  const d = data as Record<string, unknown>;
  if (!d || typeof d !== 'object') return [];

  if (d.type === 'FeatureCollection' && Array.isArray(d.features)) {
    const out: number[][] = [];
    for (const feature of d.features as Array<{ geometry?: Geometry }>) {
      if (feature?.geometry) out.push(...extractCoords(feature.geometry));
    }
    return out;
  }
  if (d.type === 'Feature' && d.geometry) {
    return extractCoords(d.geometry as Geometry);
  }
  if (typeof d.type === 'string' && 'coordinates' in d) {
    return extractCoords(d as unknown as Geometry);
  }
  return [];
}

/* ------------------------------------------------------------------ */
/* Rendering pipeline (Steps C–G from the spec)                        */
/* ------------------------------------------------------------------ */

/** Are these coords geographic (lon/lat) rather than already planar? */
function isGeographic(coords: number[][]): boolean {
  return coords.every(
    ([x, y]) => x >= -180 && x <= 180 && y >= -90 && y <= 90,
  );
}

/** Cheap equirectangular projection corrected for longitude compression. */
function projectLatLonToXY(coords: number[][]): number[][] {
  const meanLat =
    coords.reduce((s, [, lat]) => s + lat, 0) / Math.max(1, coords.length);
  const cosLat = Math.cos((meanLat * Math.PI) / 180);
  return coords.map(([lon, lat]) => [lon * cosLat, lat]);
}

/** Center on origin and scale so the largest dimension is ~30 world units. */
function normalizeTrack(points: Vector3[]): Vector3[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const width = maxX - minX;
  const height = maxZ - minZ;
  const scale = 30 / Math.max(width, height || 1);
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  return points.map(p => new Vector3((p.x - cx) * scale, 0, (p.z - cz) * scale));
}

/** Full pipeline: raw GeoJSON -> smooth, closed list of points to draw. */
function buildTrackPoints(data: unknown): Vector3[] | null {
  // Step A — extract 2D coordinates
  let coords = coordsFromGeoJSON(data);
  if (coords.length < 4) return null;

  // Step C — project if geographic
  if (isGeographic(coords)) {
    coords = projectLatLonToXY(coords);
  }

  // Step D — drop non-finite + collapse consecutive duplicates
  const cleaned: number[][] = [];
  for (const [x, y] of coords) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const prev = cleaned[cleaned.length - 1];
    if (prev && prev[0] === x && prev[1] === y) continue;
    cleaned.push([x, y]);
  }
  if (cleaned.length < 4) return null;

  // Step E — lift into 3D (XZ plane, Y up)
  const lifted = cleaned.map(([x, y]) => new Vector3(x, 0, y));

  // Step F — normalize
  const normalized = normalizeTrack(lifted);

  // Step G — smooth into a closed Catmull-Rom curve
  const curve = new CatmullRomCurve3(normalized, true, 'catmullrom', 0.05);
  const samples = Math.min(1000, Math.max(100, normalized.length * 4));
  return curve.getPoints(samples);
}

/** Generic placeholder oval used when no track file resolves. */
function placeholderPoints(): Vector3[] {
  const ellipse = new EllipseCurve(0, 0, 20, 12, 0, Math.PI * 2, false, 0);
  return ellipse.getPoints(120).map(p => new Vector3(p.x, 0, p.y));
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CircuitTrack3D({
  src,
  color = '#2dd4bf',
  lineWidth = 2,
  onStatusChange,
}: CircuitTrack3DProps) {
  const [points, setPoints] = useState<Vector3[] | null>(null);
  const [status, setStatus] = useState<TrackStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPoints(null);
    onStatusChange?.('loading');

    (async () => {
      try {
        const res = await fetch(src);
        const text = await res.text();
        // Guard against static hosts serving an HTML 200 fallback.
        const head = text.trimStart().slice(0, 9).toLowerCase();
        if (!res.ok || head.startsWith('<!doctype') || head.startsWith('<html')) {
          throw new Error('not found');
        }
        const built = buildTrackPoints(JSON.parse(text));
        if (cancelled) return;
        if (built) {
          setPoints(built);
          setStatus('ready');
          onStatusChange?.('ready');
        } else {
          throw new Error('no geometry');
        }
      } catch {
        if (cancelled) return;
        setPoints(null);
        setStatus('missing');
        onStatusChange?.('missing');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src, onStatusChange]);

  const placeholder = useMemo(placeholderPoints, []);

  if (status === 'loading') {
    return (
      <Html center>
        <div className="track3d-spinner" aria-label="Loading track" />
      </Html>
    );
  }

  if (status === 'missing') {
    return (
      <group>
        <Line points={placeholder} color="#585372" lineWidth={lineWidth} />
        <Html center>
          <div className="track3d-missing">Track layout not available</div>
        </Html>
      </group>
    );
  }

  return <Line points={points ?? placeholder} color={color} lineWidth={lineWidth} />;
}
