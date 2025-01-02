import { Antenna } from "../types";

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
