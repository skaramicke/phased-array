export function drawToolbox(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  wavelengthPixels: number,
  showTrashCan: boolean,
  isHovered: boolean
) {
  const toolboxSize = canvas.width / 8;
  const margin = 16;
  const x = canvas.width - toolboxSize - margin;
  const y = canvas.height - toolboxSize - margin;

  // Draw toolbox background
  ctx.fillStyle = isHovered
    ? "rgba(255, 255, 255, 1)"
    : "rgba(255, 255, 255, 0.9)";
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
  ctx.strokeStyle = isHovered ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 2;
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

export function isOverToolbox(
  x: number,
  y: number,
  canvas: HTMLCanvasElement
): boolean {
  const toolboxSize = canvas.width / 8;
  const margin = 16;
  const toolboxX = canvas.width - toolboxSize - margin;
  const toolboxY = canvas.height - toolboxSize - margin;
  return (
    x >= toolboxX &&
    x <= toolboxX + toolboxSize &&
    y >= toolboxY &&
    y <= toolboxY + toolboxSize
  );
}

