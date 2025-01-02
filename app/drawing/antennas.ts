import { Antenna } from "../types";

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

export function drawDraggingAntenna(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  wavelengthPixels: number,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
  worldToCanvas: (
    worldX: number,
    worldY: number,
    canvas: HTMLCanvasElement
  ) => { x: number; y: number }
) {
  const { x: canvasX, y: canvasY } = worldToCanvas(x, y, canvas);

  ctx.strokeStyle = "rgba(100, 100, 100, 0.8)";
  ctx.setLineDash([5, 5]);

  const maxRadius = Math.max(canvas.width, canvas.height);
  for (
    let radius = 0.25;
    radius * wavelengthPixels <= maxRadius;
    radius += 0.25
  ) {
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, radius * wavelengthPixels, 0, 2 * Math.PI);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = "12px Arial";

  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    const rulerX = canvasX + i * wavelengthPixels;
    ctx.beginPath();
    ctx.moveTo(rulerX, canvasY - 10);
    ctx.lineTo(rulerX, canvasY + 10);
    ctx.stroke();
    ctx.fillText(`${Math.abs(i)}λ`, rulerX, canvasY - 15);
  }

  ctx.strokeStyle = "rgba(0, 0, 255, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(canvasX, canvasY, wavelengthPixels / 4, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(canvasX - wavelengthPixels / 4, canvasY);
  ctx.lineTo(canvasX + wavelengthPixels / 4, canvasY);
  ctx.moveTo(canvasX, canvasY - wavelengthPixels / 4);
  ctx.lineTo(canvasX, canvasY + wavelengthPixels / 4);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.beginPath();
  ctx.arc(
    canvasX + offsetX * wavelengthPixels,
    canvasY - offsetY * wavelengthPixels,
    5,
    0,
    2 * Math.PI
  );
  ctx.fill();

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(canvasX + 10, canvasY + 10, 120, 40);
  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`X: ${x.toFixed(2)}λ`, canvasX + 15, canvasY + 15);
  ctx.fillText(`Y: ${y.toFixed(2)}λ`, canvasX + 15, canvasY + 30);
}
