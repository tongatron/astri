import { useMemo, useState } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Line } from '@react-three/drei';
import { toObserver } from '@/core/astronomy/observer';
import { sunState } from '@/core/astronomy/sun';
import { moonState } from '@/core/astronomy/moon';
import { planetStates } from '@/core/astronomy/planets';
import {
  equatorialToHorizontal,
  eclipticLongitudeToEquatorial,
} from '@/core/coords/equatorial';
import { horizontalToCartesian } from '@/core/coords/horizon';
import { useDisplayTime } from '@/state/useDisplayTime';
import { useStore } from '@/state/store';
import { STARS, type Star } from '@/data/stars';
import { CONSTELLATIONS } from '@/data/constellations';
import {
  compassDirection,
  formatAngle,
  formatKm,
  formatMagnitude,
  formatOptionalTime,
  formatPercent,
} from '@/core/astronomy/format';

const SPHERE_R = 6;
const HORIZON_THICKNESS = 0.02;

const CARDINALS: { label: string; azimuth: number }[] = [
  { label: 'N', azimuth: 0 },
  { label: 'E', azimuth: 90 },
  { label: 'S', azimuth: 180 },
  { label: 'O', azimuth: 270 },
];

const PLANET_COLORS: Record<string, string> = {
  mercury: '#c0a779',
  venus: '#f3d8a7',
  mars: '#d96b4a',
  jupiter: '#d6c5a4',
  saturn: '#e9d99c',
  uranus: '#9ed7d4',
  neptune: '#6f8ed8',
};

type SkyBody = {
  key: string;
  label: string;
  altitude: number;
  azimuth: number;
  color: string;
  size: number;
  kind: 'sun' | 'moon' | 'planet';
  detail: string[];
};

type SkyStar = Star & {
  altitude: number;
  azimuth: number;
};

type Selection =
  | { type: 'body'; key: string }
  | { type: 'star'; key: string }
  | null;

function altAzCircle(altitude: (azimuth: number) => number, segments = 96) {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const az = (i / segments) * 360;
    const p = horizontalToCartesian(altitude(az), az, SPHERE_R);
    points.push([p.x, p.y, p.z]);
  }
  return points;
}

function HorizonRing() {
  const points = useMemo(() => altAzCircle(() => 0), []);
  return (
    <>
      <Line points={points} color="#fbbf24" lineWidth={1.5} transparent opacity={0.85} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SPHERE_R - HORIZON_THICKNESS, SPHERE_R, 96]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} />
      </mesh>
    </>
  );
}

function CardinalLabels() {
  return (
    <>
      {CARDINALS.map((c) => {
        const p = horizontalToCartesian(0, c.azimuth, SPHERE_R + 0.35);
        return (
          <Billboard key={c.label} position={[p.x, p.y, p.z]}>
            <Text
              fontSize={0.42}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#020617"
            >
              {c.label}
            </Text>
          </Billboard>
        );
      })}
    </>
  );
}

function MeridianRing() {
  const points = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i <= 96; i++) {
      const t = (i / 96) * 360;
      const azimuth = t < 180 ? 0 : 180;
      const altitude =
        t < 180 ? 90 - Math.abs(t - 90) : -(90 - Math.abs(t - 270));
      const p = horizontalToCartesian(altitude, azimuth, SPHERE_R);
      out.push([p.x, p.y, p.z]);
    }
    return out;
  }, []);
  return <Line points={points} color="#475569" lineWidth={1} transparent opacity={0.5} />;
}

function EquatorRing({ latitude }: { latitude: number }) {
  const phi = (latitude * Math.PI) / 180;
  const points = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i <= 128; i++) {
      const hourAngle = (i / 128) * 2 * Math.PI - Math.PI;
      const sinAlt = Math.cos(phi) * Math.cos(hourAngle);
      const altitude = Math.asin(sinAlt);
      const cosAlt = Math.cos(altitude);
      const sinAz = cosAlt < 1e-6 ? 0 : (-Math.sin(hourAngle)) / cosAlt;
      const cosAz =
        cosAlt < 1e-6 ? 1 : (-Math.sin(phi) * sinAlt) / (Math.cos(phi) * cosAlt);
      const azRad = Math.atan2(sinAz, cosAz);
      const azDeg = ((azRad * 180) / Math.PI + 360) % 360;
      const altDeg = (altitude * 180) / Math.PI;
      const p = horizontalToCartesian(altDeg, azDeg, SPHERE_R);
      out.push([p.x, p.y, p.z]);
    }
    return out;
  }, [phi]);
  return <Line points={points} color="#38bdf8" lineWidth={1} transparent opacity={0.45} />;
}

function EclipticRing({ date, observer }: { date: Date; observer: ReturnType<typeof toObserver> }) {
  const points = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i <= 180; i++) {
      const lon = (i / 180) * 360;
      const { raHours, decDeg } = eclipticLongitudeToEquatorial(lon);
      const { altitude, azimuth } = equatorialToHorizontal(
        raHours,
        decDeg,
        date,
        observer,
      );
      const p = horizontalToCartesian(altitude, azimuth, SPHERE_R);
      out.push([p.x, p.y, p.z]);
    }
    return out;
  }, [date, observer]);
  return <Line points={points} color="#f97316" lineWidth={1} transparent opacity={0.4} />;
}

function magnitudeToSize(mag: number): number {
  // Brightest naked-eye stars ≈ -1.5, faintest plotted ≈ 3.5. Map to a
  // visually pleasant range in scene units.
  const clamped = Math.max(-1.5, Math.min(3.5, mag));
  return 0.13 - (clamped + 1.5) * (0.09 / 5);
}

function StarPoint({
  star,
  onSelect,
  highlighted,
}: {
  star: SkyStar;
  onSelect: () => void;
  highlighted: boolean;
}) {
  const above = star.altitude > 0;
  const p = horizontalToCartesian(star.altitude, star.azimuth, SPHERE_R);
  const size = magnitudeToSize(star.magnitude);
  return (
    <mesh
      position={[p.x, p.y, p.z]}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <sphereGeometry args={[size, 10, 10]} />
      <meshBasicMaterial
        color={highlighted ? '#fde68a' : '#f8fafc'}
        transparent
        opacity={above ? 1 : 0.18}
      />
    </mesh>
  );
}

function BodyMarker({
  body,
  onSelect,
  highlighted,
}: {
  body: SkyBody;
  onSelect: () => void;
  highlighted: boolean;
}) {
  const above = body.altitude > 0;
  const p = horizontalToCartesian(body.altitude, body.azimuth, SPHERE_R);
  return (
    <group position={[p.x, p.y, p.z]}>
      <mesh
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[body.size, 24, 24]} />
        <meshBasicMaterial
          color={body.color}
          transparent
          opacity={above ? 1 : 0.35}
        />
      </mesh>
      {highlighted && (
        <mesh>
          <ringGeometry args={[body.size * 1.6, body.size * 1.9, 32]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0.9} side={2} />
        </mesh>
      )}
      <Billboard>
        <Text
          position={[0, body.size + 0.18, 0]}
          fontSize={0.22}
          color={above ? '#f8fafc' : '#94a3b8'}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#020617"
        >
          {body.label}
        </Text>
      </Billboard>
    </group>
  );
}

function ConstellationLines({
  starsById,
}: {
  starsById: Record<string, SkyStar>;
}) {
  const segments = useMemo(() => {
    const out: { key: string; points: [number, number, number][] }[] = [];
    for (const c of CONSTELLATIONS) {
      for (const [aId, bId] of c.segments) {
        const a = starsById[aId];
        const b = starsById[bId];
        if (!a || !b) continue;
        const pa = horizontalToCartesian(a.altitude, a.azimuth, SPHERE_R * 0.999);
        const pb = horizontalToCartesian(b.altitude, b.azimuth, SPHERE_R * 0.999);
        // Skip lines where both endpoints are far below the horizon.
        if (a.altitude < -15 && b.altitude < -15) continue;
        out.push({
          key: `${c.id}-${aId}-${bId}`,
          points: [
            [pa.x, pa.y, pa.z],
            [pb.x, pb.y, pb.z],
          ],
        });
      }
    }
    return out;
  }, [starsById]);

  return (
    <>
      {segments.map((s) => (
        <Line
          key={s.key}
          points={s.points}
          color="#64748b"
          lineWidth={1}
          transparent
          opacity={0.55}
        />
      ))}
    </>
  );
}

function bodyDetailLines({
  body,
  state,
}: {
  body: SkyBody;
  state: ReturnType<typeof buildBodies>['raw'];
}): string[] {
  const lines = [
    `Altezza ${formatAngle(body.altitude)} · ${compassDirection(body.azimuth)} ${formatAngle(body.azimuth, 0)}`,
    ...body.detail,
  ];
  return lines;
  // state is unused but kept for future expansion
  void state;
}

function buildBodies(displayed: Date, observer: ReturnType<typeof toObserver>) {
  const sun = sunState(displayed, observer);
  const moon = moonState(displayed, observer);
  const planets = planetStates(displayed, observer);
  const bodies: SkyBody[] = [
    {
      key: 'sun',
      label: 'Sole',
      altitude: sun.altitude,
      azimuth: sun.azimuth,
      color: '#ffd166',
      size: 0.32,
      kind: 'sun',
      detail: [
        `Alba ${formatOptionalTime(sun.rise)} · Tramonto ${formatOptionalTime(sun.set)}`,
        `Distanza ${(sun.distance * 149_597_870.7).toLocaleString('it-IT', { maximumFractionDigits: 0 })} km`,
      ],
    },
    {
      key: 'moon',
      label: 'Luna',
      altitude: moon.altitude,
      azimuth: moon.azimuth,
      color: '#d7e2f3',
      size: 0.28,
      kind: 'moon',
      detail: [
        `${moon.phaseName} · illuminata al ${formatPercent(moon.illumination)}`,
        `Sorge ${formatOptionalTime(moon.rise)} · Tramonta ${formatOptionalTime(moon.set)}`,
        `Distanza ${formatKm(moon.distanceKm)}`,
      ],
    },
    ...planets.map((p) => ({
      key: p.key,
      label: p.name,
      altitude: p.altitude,
      azimuth: p.azimuth,
      color: PLANET_COLORS[p.key] ?? '#a3e635',
      size: 0.16,
      kind: 'planet' as const,
      detail: [
        `Magnitudine ${formatMagnitude(p.magnitude)} · ${p.instrument}`,
        `Distanza ${formatKm(p.distanceKm)} · elongazione ${formatAngle(p.elongation, 0)}`,
        `Sorge ${formatOptionalTime(p.rise)} · Tramonta ${formatOptionalTime(p.set)}`,
      ],
    })),
  ];
  return { bodies, raw: { sun, moon, planets } };
}

function InfoPanel({
  selection,
  bodies,
  stars,
  onClose,
}: {
  selection: Selection;
  bodies: SkyBody[];
  stars: Record<string, SkyStar>;
  onClose: () => void;
}) {
  if (!selection) return null;

  let title = '';
  let subtitle = '';
  let lines: string[] = [];

  if (selection.type === 'body') {
    const b = bodies.find((x) => x.key === selection.key);
    if (!b) return null;
    title = b.label;
    subtitle = b.kind === 'sun' ? 'Stella del Sistema solare' : b.kind === 'moon' ? 'Satellite naturale' : 'Pianeta';
    lines = bodyDetailLines({ body: b, state: undefined as never });
  } else {
    const s = stars[selection.key];
    if (!s) return null;
    title = s.name;
    subtitle = `${s.bayer ?? ''} · ${s.constellation}`.replace(/^\s·\s/, '');
    lines = [
      `Magnitudine ${s.magnitude.toFixed(2)}`,
      `Altezza ${formatAngle(s.altitude)} · ${compassDirection(s.azimuth)} ${formatAngle(s.azimuth, 0)}`,
      `Coordinate equatoriali ${s.raHours.toFixed(2)}h, ${s.decDeg.toFixed(2)}°`,
      s.altitude > 0 ? 'Sopra l\'orizzonte' : 'Sotto l\'orizzonte',
    ];
  }

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-night-700 bg-night-950/90 px-4 py-3 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-50">{title}</div>
          {subtitle && (
            <div className="mt-0.5 truncate text-xs text-night-300">
              {subtitle}
            </div>
          )}
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

export default function SkySphere3D() {
  const location = useStore((s) => s.location);
  const displayed = useDisplayTime();
  const [selection, setSelection] = useState<Selection>(null);

  const { bodies, observer } = useMemo(() => {
    if (!location) return { bodies: [], observer: null };
    const obs = toObserver(location);
    return { bodies: buildBodies(displayed, obs).bodies, observer: obs };
  }, [displayed, location]);

  const skyStarsById = useMemo<Record<string, SkyStar>>(() => {
    if (!observer) return {};
    const out: Record<string, SkyStar> = {};
    for (const star of STARS) {
      const { altitude, azimuth } = equatorialToHorizontal(
        star.raHours,
        star.decDeg,
        displayed,
        observer,
      );
      out[star.id] = { ...star, altitude, azimuth };
    }
    return out;
  }, [displayed, observer]);

  if (!location || !observer) {
    return (
      <div className="grid h-full place-items-center text-center text-night-300">
        Seleziona una posizione per vedere la sfera celeste.
      </div>
    );
  }

  const stars = Object.values(skyStarsById);

  return (
    <div className="relative h-full w-full bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.9),rgba(2,6,23,1))]">
      <Canvas
        camera={{ position: [9, 4.5, 9], fov: 50 }}
        onPointerMissed={() => setSelection(null)}
      >
        <ambientLight intensity={0.6} />
        <HorizonRing />
        <CardinalLabels />
        <MeridianRing />
        <EquatorRing latitude={location.lat} />
        <EclipticRing date={displayed} observer={observer} />
        <ConstellationLines starsById={skyStarsById} />
        {stars.map((star) => (
          <StarPoint
            key={star.id}
            star={star}
            highlighted={
              selection?.type === 'star' && selection.key === star.id
            }
            onSelect={() => setSelection({ type: 'star', key: star.id })}
          />
        ))}
        {bodies.map((body) => (
          <BodyMarker
            key={body.key}
            body={body}
            highlighted={
              selection?.type === 'body' && selection.key === body.key
            }
            onSelect={() => setSelection({ type: 'body', key: body.key })}
          />
        ))}
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={20}
          target={[0, 0.6, 0]}
        />
      </Canvas>
      <InfoPanel
        selection={selection}
        bodies={bodies}
        stars={skyStarsById}
        onClose={() => setSelection(null)}
      />
      <div className="pointer-events-none absolute right-3 top-3 max-w-[12rem] rounded-md border border-night-800/70 bg-night-950/70 px-2.5 py-1.5 text-[10px] leading-snug text-night-300">
        <div className="font-semibold text-slate-200">Legenda</div>
        <div className="mt-1 space-y-0.5">
          <div><span className="text-amber-400">●</span> orizzonte / cardinali</div>
          <div><span className="text-sky-400">●</span> equatore celeste</div>
          <div><span className="text-orange-400">●</span> eclittica</div>
          <div><span className="text-slate-400">●</span> meridiano locale</div>
          <div className="text-night-400">click su corpi o stelle per info</div>
        </div>
      </div>
    </div>
  );
}
