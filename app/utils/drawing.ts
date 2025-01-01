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

export function drawToolbox(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  wavelengthPixels: number,
  showTrashCan: boolean
) {
  const toolboxSize = canvas.width / 8;
  const margin = 16;
  const x = canvas.width - toolboxSize - margin;
  const y = canvas.height - toolboxSize - margin;

  // Draw toolbox background
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, toolboxSize, toolboxSize, 8);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Draw border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw icon
  ctx.fillStyle = showTrashCan ? "#ef4444" : "#3b82f6";
  const iconSize = toolboxSize * 0.5;
  const iconX = x + (toolboxSize - iconSize) / 2;
  const iconY = y + (toolboxSize - iconSize) / 2;

  if (showTrashCan) {
    drawTrashIcon(ctx, iconX, iconY, iconSize);
  } else {
    drawAntennaIcon(ctx, iconX, iconY, iconSize);
  }
}

export function drawAntennaIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);

  // Draw the vertical line (mast)
  ctx.beginPath();
  ctx.moveTo(12, 4);
  ctx.lineTo(12, 20);
  ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"; // Blue color
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw the dipole elements
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(18, 8);
  ctx.moveTo(8, 12);
  ctx.lineTo(16, 12);
  ctx.moveTo(10, 16);
  ctx.lineTo(14, 16);
  ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"; // Blue color
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawTrashIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);

  ctx.beginPath();
  ctx.moveTo(3, 6);
  ctx.lineTo(21, 6);
  ctx.moveTo(19, 6);
  ctx.lineTo(19, 20);
  ctx.arcTo(19, 21, 18, 21, 1);
  ctx.lineTo(6, 21);
  ctx.arcTo(5, 21, 5, 20, 1);
  ctx.lineTo(5, 6);
  ctx.moveTo(10, 11);
  ctx.lineTo(10, 17);
  ctx.moveTo(14, 11);
  ctx.lineTo(14, 17);
  ctx.moveTo(8, 6);
  ctx.lineTo(8, 4);
  ctx.arcTo(8, 3, 9, 3, 1);
  ctx.lineTo(15, 3);
  ctx.arcTo(16, 3, 16, 4, 1);
  ctx.lineTo(16, 6);

  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.restore();
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
