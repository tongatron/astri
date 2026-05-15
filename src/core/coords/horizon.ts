/**
 * Local horizon frame for 3D rendering:
 *   +y = zenith (up)
 *   +z = north
 *   +x = east
 *
 * Azimuth is measured clockwise from north (0° = N, 90° = E, 180° = S, 270° = W),
 * altitude is the elevation above the horizon in degrees.
 */
export function horizontalToCartesian(
  altitudeDeg: number,
  azimuthDeg: number,
  radius = 1,
): { x: number; y: number; z: number } {
  const alt = (altitudeDeg * Math.PI) / 180;
  const az = (azimuthDeg * Math.PI) / 180;
  const horizontal = Math.cos(alt);
  return {
    x: radius * horizontal * Math.sin(az),
    y: radius * Math.sin(alt),
    z: radius * horizontal * Math.cos(az),
  };
}
