import { useMemo, useState } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Line } from '@react-three/drei';
import {
  HELIO_BODIES,
  type HelioBodyMeta,
  helioPosition,
  helioTrajectory,
  type HelioPosition,
} from '@/core/astronomy/heliocentric';
import { useDisplayTime } from '@/state/useDisplayTime';

type ScaleMode = 'visible' | 'log';

/**
 * Visualisation distance for a given AU separation. Real distances span two
 * orders of magnitude, so we compress them; logarithmic is useful when you
 * want Neptune visible alongside Mercury, sqrt keeps relative ordering
 * intuitive while still revealing the inner cluster.
 */
function scaleAu(au: number, mode: ScaleMode): number {
  switch (mode) {
    case 'visible':
      return Math.sqrt(au) * 2.7;
    case 'log':
      return Math.log(1 + au) * 2.5;
  }
}

function scaledPoint(p: HelioPosition, mode: ScaleMode): [number, number, number] {
  if (p.distanceAu === 0) return [0, 0, 0];
  const factor = scaleAu(p.distanceAu, mode) / p.distanceAu;
  return [p.x * factor, p.y * factor, p.z * factor];
}

function PlanetSphere({
  meta,
  position,
  highlighted,
  onSelect,
}: {
  meta: HelioBodyMeta;
  position: [number, number, number];
  highlighted: boolean;
  onSelect: () => void;
}) {
  return (
    <group position={position}>
      <mesh
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[meta.visualRadius, 28, 28]} />
        <meshBasicMaterial color={meta.color} />
      </mesh>
      {highlighted && (
        <mesh>
          <ringGeometry args={[meta.visualRadius * 1.6, meta.visualRadius * 1.9, 32]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0.9} side={2} />
        </mesh>
      )}
      <Billboard>
        <Text
          position={[0, meta.visualRadius + 0.14, 0]}
          fontSize={0.18}
          color="#f8fafc"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#020617"
        >
          {meta.name}
        </Text>
      </Billboard>
    </group>
  );
}

function OrbitLine({ points, color }: { points: [number, number, number][]; color: string }) {
  return <Line points={points} color={color} lineWidth={1} transparent opacity={0.35} />;
}

function EarthSunLine({
  earthPos,
}: {
  earthPos: [number, number, number];
}) {
  return (
    <Line
      points={[[0, 0, 0], earthPos]}
      color="#fde68a"
      lineWidth={1}
      transparent
      opacity={0.4}
      dashed
      dashSize={0.15}
      gapSize={0.1}
    />
  );
}

function InfoPanel({
  meta,
  position,
  earthDistanceAu,
  onClose,
}: {
  meta: HelioBodyMeta;
  position: HelioPosition;
  earthDistanceAu: number;
  onClose: () => void;
}) {
  const lines = [
    `Distanza dal Sole ${position.distanceAu.toFixed(3)} AU`,
    `${(position.distanceAu * 149.6e6).toLocaleString('it-IT', { maximumFractionDigits: 0 })} km`,
    meta.key !== 'earth'
      ? `Distanza dalla Terra ${earthDistanceAu.toFixed(3)} AU`
      : null,
    `Periodo orbitale ${(meta.orbitalPeriodDays / 365.25).toFixed(2)} anni`,
  ].filter(Boolean) as string[];

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(380px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-night-700 bg-night-950/90 px-4 py-3 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-50">{meta.name}</div>
          <div className="mt-0.5 text-xs text-night-300">
            {meta.key === 'earth' ? 'Casa nostra' : 'Pianeta'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full border border-night-700 px-2 py-0.5 text-xs text-night-300 transition hover:border-night-500 hover:text-slate-100"
          aria-label="Chiudi"
        >
          ✕
        </button>
      </div>
      <ul className="mt-2 space-y-1 text-xs text-night-200">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function EclipticGrid() {
  // Concentric rings at 1, 5, 10, 30 AU help give a sense of distance.
  const rings = useMemo(() => {
    const out: { radius: number; points: [number, number, number][] }[] = [];
    for (const au of [1, 5, 10, 30]) {
      const r = Math.sqrt(au) * 2.7;
      const segs = 96;
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
      }
      out.push({ radius: au, points: pts });
    }
    return out;
  }, []);
  return (
    <>
      {rings.map((r) => (
        <Line
          key={r.radius}
          points={r.points}
          color="#1e293b"
          lineWidth={1}
          transparent
          opacity={0.5}
        />
      ))}
    </>
  );
}

export default function SolarSystem3D() {
  const displayed = useDisplayTime();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('visible');

  const data = useMemo(() => {
    const earthMeta = HELIO_BODIES.find((b) => b.key === 'earth')!;
    const earthNow = helioPosition(earthMeta.body, displayed);

    return HELIO_BODIES.map((meta) => {
      const now = helioPosition(meta.body, displayed);
      const trajectory = helioTrajectory(meta, displayed, 96);
      const orbitPoints = trajectory.map((p) => scaledPoint(p, scaleMode));
      const position = scaledPoint(now, scaleMode);
      const earthDistanceAu =
        meta.key === 'earth'
          ? 0
          : Math.sqrt(
              (now.x - earthNow.x) ** 2 +
                (now.y - earthNow.y) ** 2 +
                (now.z - earthNow.z) ** 2,
            );
      return { meta, now, position, orbitPoints, earthDistanceAu };
    });
  }, [displayed, scaleMode]);

  const earth = data.find((d) => d.meta.key === 'earth')!;
  const selected = data.find((d) => d.meta.key === selectedKey) ?? null;

  return (
    <div className="relative h-full w-full bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.92),rgba(2,6,23,1))]">
      <Canvas
        camera={{ position: [10, 16, 18], fov: 55 }}
        onPointerMissed={() => setSelectedKey(null)}
      >
        <ambientLight intensity={0.6} />

        <EclipticGrid />

        {/* Sun */}
        <mesh onPointerDown={(e) => { e.stopPropagation(); setSelectedKey(null); }}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>

        {data.map((d) => (
          <OrbitLine
            key={`orbit-${d.meta.key}`}
            points={d.orbitPoints}
            color={d.meta.color}
          />
        ))}

        <EarthSunLine earthPos={earth.position} />

        {data.map((d) => (
          <PlanetSphere
            key={d.meta.key}
            meta={d.meta}
            position={d.position}
            highlighted={selectedKey === d.meta.key}
            onSelect={() => setSelectedKey(d.meta.key)}
          />
        ))}

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={50}
          target={[0, 0, 0]}
        />
      </Canvas>

      {selected && (
        <InfoPanel
          meta={selected.meta}
          position={selected.now}
          earthDistanceAu={selected.earthDistanceAu}
          onClose={() => setSelectedKey(null)}
        />
      )}

      <div className="pointer-events-auto absolute right-3 top-3 max-w-[14rem] rounded-md border border-night-800/70 bg-night-950/80 px-2.5 py-2 text-[11px] leading-snug text-night-300">
        <div className="font-semibold text-slate-200">Sistema solare</div>
        <div className="mt-1 text-night-300">
          Vista eliocentrica. Le orbite mostrano un periodo intero, il punto
          pieno è la posizione attuale.
        </div>
        <div className="mt-2 flex gap-1">
          {(
            [
              { value: 'visible', label: 'Visibile' },
              { value: 'log', label: 'Logaritmico' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setScaleMode(opt.value)}
              className={`flex-1 rounded border px-2 py-0.5 text-[10px] transition ${
                scaleMode === opt.value
                  ? 'border-amber-200/60 bg-amber-200/10 text-amber-100'
                  : 'border-night-700 text-night-300 hover:text-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
