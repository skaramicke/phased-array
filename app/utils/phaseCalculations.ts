import { Antenna } from "../types";

export function calculatePhases(
  antennas: Antenna[],
  target: { x: number; y: number } | null
): Antenna[] {
  if (!target) return antennas;
  if (antennas.length === 0) return [];

  const distances = antennas.map((antenna) => {
    const dx = target.x - antenna.x;
    const dy = target.y - antenna.y;
    return Math.sqrt(dx ** 2 + dy ** 2);
  });

  const maxDistance = Math.max(...distances);

  return antennas.map((antenna, index) => {
    const phaseDelay = (maxDistance - distances[index]) * 360;
    return { ...antenna, phase: phaseDelay % 360 };
  });
}
