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

export function drawPropagation(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  antennas: Antenna[],
  wavelengthPixels: number,
  time: number,
  waveSpeed: number
) {
  if (antennas.length === 0) return;

  const resolution = 4;

  for (let x = 0; x < canvas.width; x += resolution) {
    for (let y = 0; y < canvas.height; y += resolution) {
      let intensity = 0;

      for (let i = 0; i < antennas.length; i++) {
        const antenna = antennas[i];
        const distance = Math.sqrt(
          (x / wavelengthPixels - antenna.x) ** 2 +
            (y / wavelengthPixels - antenna.y) ** 2
        );
        const phase =
          distance * 2 * Math.PI -
          time * waveSpeed * 2 * Math.PI +
          (antenna.phase * Math.PI) / 180;
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
  wavelengthPixels: number,
  time: number,
  waveSpeed: number
) {
  if (antennas.length === 0) return;

  const maxRadius = canvas.width;

  antennas.forEach((antenna) => {
    const baseRadius = (((time * waveSpeed) % 1) + antenna.phase / 360) % 1;

    for (
      let radius = baseRadius;
      radius < maxRadius / wavelengthPixels;
      radius += 1
    ) {
      ctx.beginPath();
      ctx.arc(
        antenna.x * wavelengthPixels,
        antenna.y * wavelengthPixels,
        radius * wavelengthPixels,
        0,
        2 * Math.PI
      );
      ctx.strokeStyle = "red";
      ctx.lineWidth = 1;
      ctx.stroke();

      const blueRadius = radius - 0.5;
      if (blueRadius > 0) {
        ctx.beginPath();
        ctx.arc(
          antenna.x * wavelengthPixels,
          antenna.y * wavelengthPixels,
          blueRadius * wavelengthPixels,
          0,
          2 * Math.PI
        );
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
  wavelengthPixels: number
) {
  if (antennas.length === 0) return;

  antennas.forEach((antenna) => {
    ctx.beginPath();
    ctx.arc(
      antenna.x * wavelengthPixels,
      antenna.y * wavelengthPixels,
      wavelengthPixels / 4,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = "blue";
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.font = `${wavelengthPixels / 6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      antenna.phase.toFixed(1),
      antenna.x * wavelengthPixels,
      antenna.y * wavelengthPixels
    );
  });
}

export function drawTarget(
  ctx: CanvasRenderingContext2D,
  target: { x: number; y: number } | null,
  wavelengthPixels: number
) {
  if (target) {
    ctx.beginPath();
    ctx.moveTo(target.x * wavelengthPixels - 10, target.y * wavelengthPixels);
    ctx.lineTo(target.x * wavelengthPixels + 10, target.y * wavelengthPixels);
    ctx.moveTo(target.x * wavelengthPixels, target.y * wavelengthPixels - 10);
    ctx.lineTo(target.x * wavelengthPixels, target.y * wavelengthPixels + 10);
    ctx.strokeStyle = "red";
    ctx.stroke();
  }
}
