import { Antenna } from "../types";

function calculateArrayCenter(antennas: Antenna[]): { x: number; y: number } {
  const sum = antennas.reduce(
    (acc, antenna) => ({
      x: acc.x + antenna.x,
      y: acc.y + antenna.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / antennas.length,
    y: sum.y / antennas.length,
  };
}

function calculateTargetDirection(
  arrayCenter: { x: number; y: number },
  target: { x: number; y: number }
): { x: number; y: number } {
  const dx = target.x - arrayCenter.x;
  const dy = target.y - arrayCenter.y;
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  return {
    x: dx / magnitude,
    y: dy / magnitude,
  };
}

function calculateAntennaDistance(
  antenna: Antenna,
  arrayCenter: { x: number; y: number },
  direction: { x: number; y: number }
): number {
  const dx = antenna.x - arrayCenter.x;
  const dy = antenna.y - arrayCenter.y;
  return dx * direction.x + dy * direction.y;
}

export function calculatePhases(
  antennas: Antenna[],
  target: { x: number; y: number } | null
): Antenna[] {
  if (!target || antennas.length === 0) return antennas;

  const arrayCenter = calculateArrayCenter(antennas);
  const targetDirection = calculateTargetDirection(arrayCenter, target);

  // Find the antenna furthest in the negative direction along the target vector
  const referenceAntenna = antennas.reduce((furthest, current) => {
    const furthestDistance = calculateAntennaDistance(
      furthest,
      arrayCenter,
      targetDirection
    );
    const currentDistance = calculateAntennaDistance(
      current,
      arrayCenter,
      targetDirection
    );
    return currentDistance < furthestDistance ? current : furthest;
  });

  const referenceDistance = calculateAntennaDistance(
    referenceAntenna,
    arrayCenter,
    targetDirection
  );

  return antennas.map((antenna) => {
    const distance = calculateAntennaDistance(
      antenna,
      arrayCenter,
      targetDirection
    );
    const relativeDistance = distance - referenceDistance;
    const phase = (relativeDistance % 1) * 360; // Convert wavelengths to degrees
    return { ...antenna, phase: (phase + 360) % 360 }; // Ensure phase is always positive
  });
}

export function calculateGainChartData(antennas: Antenna[]) {
  const centerAntennaX =
    antennas.reduce((sum, ant) => sum + ant.x, 0) / antennas.length;
  const centerAntennaY =
    antennas.reduce((sum, ant) => sum + ant.y, 0) / antennas.length;

  const gainValues = [];
  let maxGain = 0;

  for (let angle = 0; angle < 360; angle++) {
    const radian = (angle * Math.PI) / 180;
    let gainReal = 0;
    let gainImag = 0;

    for (const antenna of antennas) {
      const dx = antenna.x - centerAntennaX;
      const dy = antenna.y - centerAntennaY;
      const distance = -dx * Math.cos(radian) + dy * Math.sin(radian);
      const phase = (antenna.phase * Math.PI) / 180;
      gainReal += Math.cos(2 * Math.PI * distance + phase);
      gainImag += Math.sin(2 * Math.PI * distance + phase);
    }

    const gain =
      Math.sqrt(gainReal * gainReal + gainImag * gainImag) / antennas.length;
    gainValues.push(gain);
    if (gain > maxGain) maxGain = gain;
  }

  return { gainValues, maxGain };
}
