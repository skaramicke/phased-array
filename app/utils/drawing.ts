import { Antenna } from "../types";

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gridSize: number
) {
  const cellSize = canvas.width / gridSize;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ddd";
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }
}

export function calculatePhases(
  antennas: Antenna[],
  target: { x: number; y: number } | null,
  wavelengthPixels: number
): number[] {
  if (!target) return new Array(antennas.length).fill(0);
  if (antennas.length === 0) return [];

  const distances = antennas.map((antenna) => {
    const dx = (target.x - antenna.x) / wavelengthPixels;
    const dy = (target.y - antenna.y) / wavelengthPixels;
    return Math.sqrt(dx ** 2 + dy ** 2);
  });

  const maxDistance = Math.max(...distances);

  return distances.map((distance) => {
    const phaseDelay = (maxDistance - distance) * 2 * Math.PI;
    return phaseDelay;
  });
}

export function drawPropagation(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  antennas: Antenna[],
  target: { x: number; y: number } | null,
  wavelength: number,
  time: number,
  waveSpeed: number
) {
  if (antennas.length === 0) return;

  const resolution = 4;
  const phases = calculatePhases(antennas, target, wavelength);

  for (let x = 0; x < canvas.width; x += resolution) {
    for (let y = 0; y < canvas.height; y += resolution) {
      let intensity = 0;

      for (let i = 0; i < antennas.length; i++) {
        const antenna = antennas[i];
        const distance = Math.sqrt((x - antenna.x) ** 2 + (y - antenna.y) ** 2);
        const phase =
          (distance / wavelength) * 2 * Math.PI -
          ((time * waveSpeed) / wavelength) * 2 * Math.PI +
          (target ? phases[i] : 0);
        intensity += Math.sin(phase);
      }

      intensity = Math.abs(intensity) / antennas.length;
      ctx.fillStyle = `rgba(0, 255, 0, ${intensity})`;
      ctx.fillRect(x, y, resolution, resolution);
    }
  }
}

export function drawEmissionCircles(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  antennas: Antenna[],
  target: { x: number; y: number } | null,
  wavelength: number,
  time: number,
  waveSpeed: number
) {
  if (antennas.length === 0) return;

  const maxRadius = canvas.width;
  const phases = calculatePhases(antennas, target, wavelength);

  antennas.forEach((antenna, i) => {
    const baseRadius =
      (((time * waveSpeed) % wavelength) +
        ((target ? phases[i] : 0) / (2 * Math.PI)) * wavelength) %
      wavelength;

    for (let radius = baseRadius; radius < maxRadius; radius += wavelength) {
      ctx.beginPath();
      ctx.arc(antenna.x, antenna.y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.stroke();

      const blueRadius = radius - wavelength / 2;
      if (blueRadius > 0) {
        ctx.beginPath();
        ctx.arc(antenna.x, antenna.y, blueRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });
}

export function drawAntennas(
  ctx: CanvasRenderingContext2D,
  antennas: Antenna[],
  target: { x: number; y: number } | null,
  cellSize: number,
  wavelength: number
) {
  if (antennas.length === 0) return;

  const phases = calculatePhases(antennas, target, wavelength);
  antennas.forEach((antenna, i) => {
    ctx.beginPath();
    ctx.arc(antenna.x, antenna.y, cellSize / 4, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
    ctx.fill();

    const phaseDegrees = ((target ? phases[i] : 0) * (180 / Math.PI)) % 360;
    ctx.fillStyle = "white";
    ctx.font = `${cellSize / 6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(phaseDegrees.toFixed(2), antenna.x, antenna.y);
  });
}

export function drawTarget(
  ctx: CanvasRenderingContext2D,
  target: { x: number; y: number } | null
) {
  if (target) {
    ctx.beginPath();
    ctx.moveTo(target.x - 10, target.y);
    ctx.lineTo(target.x + 10, target.y);
    ctx.moveTo(target.x, target.y - 10);
    ctx.lineTo(target.x, target.y + 10);
    ctx.strokeStyle = "red";
    ctx.stroke();
  }
}
