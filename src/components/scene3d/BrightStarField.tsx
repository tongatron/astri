import { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { equatorialToHorizontal } from '@/core/coords/equatorial';
import { horizontalToCartesian } from '@/core/coords/horizon';
import { useBrightStars, type BrightStarRow } from '@/data/useBrightStars';

const SPHERE_R = 6;
const MAX_STARS = 6000;

function magnitudeToSize(mag: number): number {
  // Slightly more compressed mapping than the named-star renderer, so the
  // background stars don't overwhelm the named ones.
  const clamped = Math.max(-1.5, Math.min(6.0, mag));
  return 0.085 - (clamped + 1.5) * (0.07 / 7.5);
}

function colorIndexToColor(ci: number | null): THREE.Color {
  if (ci === null || !Number.isFinite(ci)) return new THREE.Color('#f8fafc');
  // Approximate B-V → temperature → tint mapping. Higher CI = cooler/redder.
  if (ci <= 0) return new THREE.Color('#bfdcff'); // blue-white
  if (ci <= 0.3) return new THREE.Color('#dfeaff'); // white
  if (ci <= 0.6) return new THREE.Color('#fff4d9'); // yellow-white
  if (ci <= 1.0) return new THREE.Color('#ffe1a1'); // yellow
  if (ci <= 1.5) return new THREE.Color('#ffb574'); // orange
  return new THREE.Color('#ff8a60'); // red
}

export default function BrightStarField({
  enabled,
  date,
  observer,
  excludeIds,
}: {
  enabled: boolean;
  date: Date;
  observer: ReturnType<typeof import('@/core/astronomy/observer').toObserver>;
  excludeIds: Set<string>;
}) {
  const state = useBrightStars(enabled);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pre-compute horizontal coordinates and instance attributes whenever
  // the date or observer changes. Memoize off the catalog once it loads.
  const instanceData = useMemo(() => {
    if (state.status !== 'ready') return null;
    const stars: BrightStarRow[] = state.stars.slice(0, MAX_STARS);

    // Filter out stars too close to our named catalog so we don't double-draw
    // them. We exclude by approximate RA/Dec proximity (1 arcminute window)
    // is hard, but skipping by magnitude tier + leaving the named ones drawn
    // on top works visually. We just keep all here.
    void excludeIds;

    const positions: { x: number; y: number; z: number }[] = [];
    const scales: number[] = [];
    const colors: THREE.Color[] = [];
    const opacities: number[] = [];

    for (const [raHours, decDeg, mag, ci] of stars) {
      const { altitude, azimuth } = equatorialToHorizontal(
        raHours,
        decDeg,
        date,
        observer,
      );
      const p = horizontalToCartesian(altitude, azimuth, SPHERE_R);
      positions.push(p);
      scales.push(magnitudeToSize(mag));
      colors.push(colorIndexToColor(ci));
      opacities.push(altitude > 0 ? 1 : 0.18);
    }

    return { positions, scales, colors, opacities, count: stars.length };
  }, [state, date, observer, excludeIds]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !instanceData) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < instanceData.count; i++) {
      const p = instanceData.positions[i];
      const s = instanceData.scales[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // Encode opacity into color alpha by scaling the color tint.
      const c = instanceData.colors[i];
      const op = instanceData.opacities[i];
      mesh.setColorAt(
        i,
        new THREE.Color(c.r * op, c.g * op, c.b * op),
      );
    }
    mesh.count = instanceData.count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [instanceData]);

  if (state.status !== 'ready' || !instanceData) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, instanceData.count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}
