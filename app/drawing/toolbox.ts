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
  ctx.font = `${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("📡", size / 2, size / 2);
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
  ctx.font = `${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🗑️", size / 2, size / 2);
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

