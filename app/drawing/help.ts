export function drawHelpMessage(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  const toolboxSize = canvas.width / 8;
  const margin = 16;
  const toolboxX = canvas.width - toolboxSize - margin;
  const toolboxY = canvas.height - toolboxSize - margin;

  // Draw help message box
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 2;
  const boxWidth = canvas.width * 0.6;
  const boxHeight = canvas.height * 0.3;
  const boxX = (canvas.width - boxWidth) / 2;
  const boxY = (canvas.height - boxHeight) / 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
  ctx.fill();
  ctx.stroke();

  // Draw help message text
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = [
    "Welcome to the Phased Array Visualizer!",
    "To get started:",
    "1. Drag the antenna icon from the toolbox",
    "2. Drop it on the canvas to place antennas",
    "3. Click anywhere to set the target location",
  ];
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, boxY + 30 + index * 25);
  });

  // Draw arrow
  const arrowStartX = boxX + boxWidth;
  const arrowStartY = boxY + boxHeight;
  const arrowEndX = toolboxX;
  const arrowEndY = toolboxY;
  const arrowHeadSize = 10;

  ctx.beginPath();
  ctx.moveTo(arrowStartX, arrowStartY);
  ctx.lineTo(arrowEndX, arrowEndY);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw arrow head
  const angle = Math.atan2(arrowEndY - arrowStartY, arrowEndX - arrowStartX);
  ctx.beginPath();
  ctx.moveTo(arrowEndX, arrowEndY);
  ctx.lineTo(
    arrowEndX - arrowHeadSize * Math.cos(angle - Math.PI / 6),
    arrowEndY - arrowHeadSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    arrowEndX - arrowHeadSize * Math.cos(angle + Math.PI / 6),
    arrowEndY - arrowHeadSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fill();
}
