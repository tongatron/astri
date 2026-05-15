import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Line } from '@react-three/drei';
import { toObserver } from '@/core/astronomy/observer';
import { sunState } from '@/core/astronomy/sun';
import { moonState } from '@/core/astronomy/moon';
import { planetStates } from '@/core/astronomy/planets';
import { horizontalToCartesian } from '@/core/coords/horizon';
import { useDisplayTime } from '@/state/useDisplayTime';
import { useStore } from '@/state/store';

const SPHERE_R = 6;
const HORIZON_THICKNESS = 0.02;

const CARDINALS: { label: string; azimuth: number }[] = [
  { label: 'N', azimuth: 0 },
  { label: 'E', azimuth: 90 },
  { label: 'S', azimuth: 180 },
  { label: 'O', azimuth: 270 },
];

type BodyMarker = {
  key: string;
  label: string;
  altitude: number;
  azimuth: number;
  color: string;
  size: number;
};

const PLANET_COLORS: Record<string, string> = {
  mercury: '#c0a779',
  venus: '#f3d8a7',
  mars: '#d96b4a',
  jupiter: '#d6c5a4',
  saturn: '#e9d99c',
  uranus: '#9ed7d4',
  neptune: '#6f8ed8',
};

function altAzCircle(
  altitudes: (azimuth: number) => number,
  segments = 96,
): [number, number, number][] {
  const points: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const az = (i / segments) * 360;
    const alt = altitudes(az);
    const p = horizontalToCartesian(alt, az, SPHERE_R);
    points.push([p.x, p.y, p.z]);
  }
  return points;
}

function MarkerSphere({ marker }: { marker: BodyMarker }) {
  const above = marker.altitude > 0;
  const p = horizontalToCartesian(marker.altitude, marker.azimuth, SPHERE_R);
  return (
    <group position={[p.x, p.y, p.z]}>
      <mesh>
        <sphereGeometry args={[marker.size, 24, 24]} />
        <meshBasicMaterial
          color={marker.color}
          transparent
          opacity={above ? 1 : 0.35}
        />
      </mesh>
      <Billboard>
        <Text
          position={[0, marker.size + 0.18, 0]}
          fontSize={0.22}
          color={above ? '#f8fafc' : '#94a3b8'}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#020617"
        >
          {marker.label}
        </Text>
      </Billboard>
    </group>
  );
}

function HorizonRing() {
  const points = useMemo(() => altAzCircle(() => 0), []);
  return (
    <>
      <Line points={points} color="#fbbf24" lineWidth={1.5} transparent opacity={0.85} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SPHERE_R - HORIZON_THICKNESS, SPHERE_R, 96]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.35} />
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
      // Sweep altitude 0 → 90 → 0 → -90 → 0 along az=0 / az=180 (meridian)
      const azimuth = t < 180 ? 0 : 180;
      const altitude = t < 180 ? 90 - Math.abs(t - 90) : -(90 - Math.abs(t - 270));
      const p = horizontalToCartesian(altitude, azimuth, SPHERE_R);
      out.push([p.x, p.y, p.z]);
    }
    return out;
  }, []);
  return <Line points={points} color="#475569" lineWidth={1} transparent opacity={0.5} />;
}

function EquatorRing({ latitude }: { latitude: number }) {
  // The celestial equator crosses the horizon due east and due west, with
  // its peak altitude at due south equal to 90° − |φ| (in the N hemisphere).
  const phi = (latitude * Math.PI) / 180;
  const points = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i <= 128; i++) {
      const hourAngle = (i / 128) * 2 * Math.PI - Math.PI; // -π..π
      // Sky coords for declination=0 at given hour angle and latitude.
      const sinAlt = Math.cos(phi) * Math.cos(hourAngle);
      const altitude = Math.asin(sinAlt);
      const cosAlt = Math.cos(altitude);
      const sinAz =
        cosAlt < 1e-6 ? 0 : (-Math.cos(0) * Math.sin(hourAngle)) / cosAlt;
      const cosAz =
        cosAlt < 1e-6
          ? 1
          : (Math.sin(0) - Math.sin(phi) * sinAlt) / (Math.cos(phi) * cosAlt);
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

export default function SkySphere3D() {
  const location = useStore((s) => s.location);
  const displayed = useDisplayTime();

  const markers = useMemo<BodyMarker[]>(() => {
    if (!location) return [];
    const obs = toObserver(location);
    const sun = sunState(displayed, obs);
    const moon = moonState(displayed, obs);
    const planets = planetStates(displayed, obs);

    return [
      {
        key: 'sun',
        label: 'Sole',
        altitude: sun.altitude,
        azimuth: sun.azimuth,
        color: '#ffd166',
        size: 0.32,
      },
      {
        key: 'moon',
        label: 'Luna',
        altitude: moon.altitude,
        azimuth: moon.azimuth,
        color: '#d7e2f3',
        size: 0.28,
      },
      ...planets.map((p) => ({
        key: p.key,
        label: p.name,
        altitude: p.altitude,
        azimuth: p.azimuth,
        color: PLANET_COLORS[p.key] ?? '#a3e635',
        size: 0.16,
      })),
    ];
  }, [displayed, location]);

  if (!location) {
    return (
      <div className="grid h-full place-items-center text-center text-night-300">
        Seleziona una posizione per vedere la sfera celeste.
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.9),rgba(2,6,23,1))]">
      <Canvas camera={{ position: [9, 4.5, 9], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <HorizonRing />
        <CardinalLabels />
        <MeridianRing />
        <EquatorRing latitude={location.lat} />
        {markers.map((m) => (
          <MarkerSphere key={m.key} marker={m} />
        ))}
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={20}
          target={[0, 0.6, 0]}
        />
      </Canvas>
    </div>
  );
}
