import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

const PITCH_LIMIT = (89 * Math.PI) / 180;

/**
 * Drag-to-look first-person controls. Camera stays at the origin (centre of
 * the celestial sphere); pointer drag rotates the look direction. Works for
 * mouse, touch and pen events. Wheel adjusts FOV (zoom in/out).
 */
export default function FirstPersonControls({ enabled }: { enabled: boolean }) {
  const { camera, gl } = useThree();
  const yawRef = useRef(0);
  const pitchRef = useRef(0.35);
  const fovRef = useRef(75);
  const dragging = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const el = gl.domElement;
    el.style.cursor = 'grab';

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      dragging.current = { x: e.clientX, y: e.clientY };
      el.style.cursor = 'grabbing';
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* not all targets support capture */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.x;
      const dy = e.clientY - dragging.current.y;
      dragging.current = { x: e.clientX, y: e.clientY };
      const factor = (camera as THREE.PerspectiveCamera).fov / 75 * 0.005;
      yawRef.current -= dx * factor;
      pitchRef.current = Math.max(
        -PITCH_LIMIT,
        Math.min(PITCH_LIMIT, pitchRef.current + dy * factor),
      );
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging.current = null;
      el.style.cursor = 'grab';
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      fovRef.current = Math.max(
        20,
        Math.min(110, fovRef.current + e.deltaY * 0.05),
      );
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      el.style.cursor = '';
    };
  }, [enabled, gl, camera]);

  useFrame(() => {
    if (!enabled) return;
    const persp = camera as THREE.PerspectiveCamera;
    if (Math.abs(persp.fov - fovRef.current) > 0.01) {
      persp.fov = fovRef.current;
      persp.updateProjectionMatrix();
    }
    camera.position.set(0, 0, 0);
    const cp = Math.cos(pitchRef.current);
    const sp = Math.sin(pitchRef.current);
    const sy = Math.sin(yawRef.current);
    const cy = Math.cos(yawRef.current);
    camera.lookAt(cp * sy, sp, cp * cy);
  });

  return null;
}
