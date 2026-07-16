import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { WebGLRenderer } from 'three';
import CircuitTrack3D, { type TrackStatus } from './CircuitTrack3D';
import { themeStore } from '../theme/themeStore';
import { mixHex } from '../theme/palette';
import './TrackViewer.css';

type TrackViewerProps = {
  /** Path under /public, e.g. "/circuits/mc-1929.geojson". */
  src: string;
  color?: string;
  className?: string;
};

const MAX_CANVAS_RETRIES = 4;

/**
 * WebGL context creation can fail outright when the GPU process is under
 * pressure (three throws while probing shader precision). Without a
 * boundary that error would take down the whole page; instead show the
 * spinner briefly and retry with a fresh Canvas.
 */
class CanvasRetryBoundary extends Component<
  { onRetry: () => void; retriesLeft: number; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    if (this.props.retriesLeft > 0) {
      window.setTimeout(() => {
        this.setState({ failed: false });
        this.props.onRetry();
      }, 1500);
    }
  }

  render() {
    if (this.state.failed) {
      return this.props.retriesLeft > 0 ? (
        <div className="track3d-spinner" />
      ) : (
        <div className="track3d-missing">3D view unavailable</div>
      );
    }
    return this.props.children;
  }
}

/**
 * Renders an F1 circuit as a glowing, orbitable 3D line.
 * On mount it does a quick "swirl" then settles into a steady idle spin.
 * The spin pauses while the user is dragging (OrbitControls handles that)
 * and resumes on release. Pointer interaction stays local to the canvas
 * so it never triggers a surrounding flip-card click.
 */
export default function TrackViewer({ src, color, className }: TrackViewerProps) {
  const interacted = useRef(false);
  // Track color follows the day–night dial: bright teal glow at night,
  // soft red at day so the line pops on the light lavender stage.
  // Quantized so a drag doesn't re-render the 3D scene at 60fps.
  const themeT = useSyncExternalStore(
    themeStore.subscribe,
    () => Math.round(themeStore.get() * 32) / 32
  );
  const trackColor = color ?? mixHex('#2dd4bf', '#e05555', themeT);
  // Signature swirl: fast on load, then settle into a steady idle spin.
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(3.0);
  const [showHint, setShowHint] = useState(false);
  const [status, setStatus] = useState<TrackStatus>('loading');

  useEffect(() => {
    const id = window.setTimeout(() => {
      setAutoRotateSpeed(1.5);
      if (!interacted.current) setShowHint(true);
    }, 4000);
    return () => window.clearTimeout(id);
  }, []);

  const grab = () => {
    interacted.current = true;
    setShowHint(false);
  };

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  // Chrome occasionally evicts a background WebGL context under GPU
  // pressure and never restores it, leaving the card blank. When a lost
  // context hasn't recovered shortly after, remount the Canvas for a
  // fresh one.
  const [canvasKey, setCanvasKey] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const onCanvasCreated = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', () => {
      window.setTimeout(() => {
        const ctx = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        if (!ctx || ctx.isContextLost()) setCanvasKey(k => k + 1);
      }, 1500);
    });
  }, []);
  const retryCanvas = useCallback(() => {
    setFailCount(f => f + 1);
    setCanvasKey(k => k + 1);
  }, []);

  return (
    <div
      className={`track3d ${className ?? ''}`}
      // Keep interaction local: orbiting/zooming/clicking the track must
      // never flip the card. Flipping happens only through the explicit
      // "flip for details" chip, whose clicks are allowed to bubble up to
      // the surrounding SpotlightCard.
      onPointerDown={e => {
        grab();
        stop(e);
      }}
      onClick={e => {
        if (!(e.target as HTMLElement).closest('.track3d-flip')) stop(e);
      }}
      onWheel={grab}
    >
      <CanvasRetryBoundary
        onRetry={retryCanvas}
        retriesLeft={MAX_CANVAS_RETRIES - failCount}
      >
        <Suspense fallback={<div className="track3d-spinner" />}>
          <Canvas
            key={canvasKey}
            camera={{ position: [0, 20, 40], fov: 40 }}
            dpr={1}
            onCreated={onCanvasCreated}
          >
            <CircuitTrack3D src={src} color={trackColor} onStatusChange={setStatus} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} />
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              enableDamping
              autoRotate
              autoRotateSpeed={autoRotateSpeed}
              onStart={grab}
            />
          </Canvas>
        </Suspense>
      </CanvasRetryBoundary>

      {showHint && status === 'ready' && (
        <span className="track3d-hint">drag to explore</span>
      )}

      <button type="button" className="track3d-flip">
        flip for details
      </button>
    </div>
  );
}
