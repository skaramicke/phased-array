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
  // Find array center
  const centerX =
    antennas.reduce((sum, ant) => sum + ant.x, 0) / antennas.length;
  const centerY =
    antennas.reduce((sum, ant) => sum + ant.y, 0) / antennas.length;

  const gainValues = [];
  let maxGain = -Infinity;

  // Calculate array factor for each angle
  for (let angle = 0; angle < 360; angle++) {
    const radian = ((angle - 90) * Math.PI) / 180;

    // Direction cosines for exact phase calculation
    const dirX = -Math.cos(radian);
    const dirY = Math.sin(radian);

    let sumReal = 0;
    let sumImag = 0;

    for (const antenna of antennas) {
      const dx = antenna.x - centerX;
      const dy = antenna.y - centerY;

      const positionPhase = 2 * Math.PI * (dx * dirX + dy * dirY);
      const elementPhase = (antenna.phase * Math.PI) / 180;
      const totalPhase = positionPhase + elementPhase;

      sumReal += Math.cos(totalPhase);
      sumImag += Math.sin(totalPhase);
    }

    // Calculate normalized power (relative to maximum)
    const power = sumReal * sumReal + sumImag * sumImag;
    const normalizedPower = power / (antennas.length * antennas.length);

    // Convert to dB (will range from -inf to 0)
    const gainDB = 10 * Math.log10(normalizedPower);
    gainValues.push(gainDB);

    if (gainDB > maxGain) {
      maxGain = gainDB;
    }
  }

  // Floor very low gains at -40dB
  const processedGains = gainValues.map((gain) =>
    Math.max(gain - maxGain, -40)
  );

  // Calculate array gain in dBd for labels
  const arrayGainDBd = 10 * Math.log10(antennas.length);

  return {
    gainValues: processedGains, // Normalized pattern (-40 to 0 dB)
    maxGain: arrayGainDBd, // True array gain in dBd for labels
  };
}