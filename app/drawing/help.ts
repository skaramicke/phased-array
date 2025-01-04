export function drawHelpMessage(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  const minDimension = Math.min(canvas.width, canvas.height);
  const fontSize = Math.max(12, Math.floor(minDimension / 30));
  const lineHeight = fontSize * 1.75;
  const lines = [
    "📡 Drag antennas from the toolbox to the canvas.",
    "🎯 Click to set phase calculation target direction",
  ];
  const textBlockHeight = lines.length * lineHeight;
  const textBlockWidth = Math.max(
    ...lines.map((line) => ctx.measureText(line).width)
  );
  const margin = fontSize;

  const boxWidth = textBlockWidth + 2 * margin;
  const boxHeight = textBlockHeight + 2 * margin;
  const boxX = (canvas.width - boxWidth) / 2;
  const boxY = (canvas.height - boxHeight) / 2;

  // Draw help message box
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
  ctx.fill();
  ctx.stroke();

  // Draw help message text
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const textStartY = boxY + margin + lineHeight / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, textStartY + index * lineHeight);
  });

  // Draw arrow to toolbox
  const toolboxSize = canvas.width / 8;
  const toolboxX = canvas.width - toolboxSize - margin;
  const toolboxY = canvas.height - toolboxSize - margin;
  const arrowStartX = boxX + boxWidth;
  const arrowStartY = boxY + boxHeight;
  const arrowEndX = toolboxX;
  const arrowEndY = toolboxY;
  const arrowHeadSize = Math.max(5, Math.floor(minDimension / 100));

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
