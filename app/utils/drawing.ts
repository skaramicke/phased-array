import { Antenna } from "../types";

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gridSize: number
) {
  const cellSize = canvas.width / gridSize;
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;

  for (let i = 0; i <= gridSize; i++) {
    const pos = i * cellSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
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
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (let x = 0; x < canvas.width; x += resolution) {
    for (let y = 0; y < canvas.height; y += resolution) {
      let intensity = 0;

      for (let i = 0; i < antennas.length; i++) {
        const antenna = antennas[i];
        const distance = Math.sqrt(
          ((x - centerX) / wavelengthPixels - antenna.x) ** 2 +
            ((centerY - y) / wavelengthPixels - antenna.y) ** 2
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
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  antennas.forEach((antenna) => {
    const baseRadius = (((time * waveSpeed) % 1) + antenna.phase / 360) % 1;

    for (
      let radius = baseRadius;
      radius < maxRadius / wavelengthPixels;
      radius += 1
    ) {
      ctx.beginPath();
      ctx.arc(
        centerX + antenna.x * wavelengthPixels,
        centerY - antenna.y * wavelengthPixels,
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
          centerX + antenna.x * wavelengthPixels,
          centerY - antenna.y * wavelengthPixels,
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
  wavelengthPixels: number,
  isDragging: boolean,
  draggingAntennaId: number | null
) {
  if (antennas.length === 0) return;

  const canvas = ctx.canvas;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  antennas.forEach((antenna, index) => {
    const x = antenna.x * wavelengthPixels + centerX;
    const y = centerY - antenna.y * wavelengthPixels;

    ctx.beginPath();
    ctx.arc(x, y, wavelengthPixels / 4, 0, 2 * Math.PI);

    if (isDragging && index === draggingAntennaId) {
      // Dragging antenna: dashed line circle
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "rgba(0, 0, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    } else {
      // Non-dragging antennas: filled semitransparent circle
      ctx.fillStyle = isDragging
        ? "rgba(0, 0, 255, 0.3)"
        : "rgba(0, 0, 255, 0.5)";
      ctx.fill();
      ctx.strokeStyle = isDragging
        ? "rgba(0, 0, 255, 0.5)"
        : "rgba(0, 0, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw phase angle text
    ctx.fillStyle = "white";
    ctx.font = `${wavelengthPixels / 6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${antenna.phase.toFixed(1)}°`, x, y);
  });
}

export function drawTarget(
  ctx: CanvasRenderingContext2D,
  target: { x: number; y: number } | null,
  wavelengthPixels: number
) {
  if (target) {
    const canvas = ctx.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const x = target.x * wavelengthPixels + centerX;
    const y = centerY - target.y * wavelengthPixels;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.strokeStyle = "red";
    ctx.stroke();
  }
}
