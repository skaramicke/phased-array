import { Antenna } from "../types";
import { worldToCanvas } from "../utils/canvasUtils";

function formatGainLabel(gain: number, arrayGainDBd: number): string {
  return `${(gain + arrayGainDBd).toFixed(1)} dBd`;
}

function drawGainChartContent(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  gainChartData: { gainValues: number[]; maxGain: number },
  levels: number[]
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const arrayGainDBd = gainChartData.maxGain;

  // Draw reference circles
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();

  // Draw dB reference circles
  const dbLevels = levels.map((db) => ({
    value: db,
    label: (db + arrayGainDBd).toFixed(1),
  }));

  dbLevels.forEach(({ value, label }) => {
    const circleRadius = radius * Math.pow(10, value / 20);
    ctx.moveTo(centerX + circleRadius, centerY);
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI);

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.font = Math.abs(value) < 10 ? "10px Arial" : "9px Arial";
    const textX = centerX + 5;
    const textY = centerY - circleRadius;
    ctx.fillText(`${label} dBd`, textX, textY);
  });

  // Draw radial lines and add labels every 30°
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.font = "12px Arial";

  for (let i = 0; i < 360; i += 30) {
    const angle = (i * Math.PI) / 180;

    // Draw radial line
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle)
    );
  }
  ctx.stroke();

  // Draw gain pattern
  if (gainChartData.gainValues.length > 0) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let angle = 0; angle < 360; angle++) {
      const radian = ((90 - angle) * Math.PI) / 180;
      const gainLinear = Math.pow(10, gainChartData.gainValues[angle] / 20);
      const x = centerX + radius * gainLinear * Math.cos(radian);
      const y = centerY - radius * gainLinear * Math.sin(radian);

      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    ctx.fill();
  }
}

function drawWidgetGainChart(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gainChartData: { gainValues: number[]; maxGain: number }
) {
  const chartSize = canvas.width / 4;
  const chartX = canvas.width - chartSize - 10;
  const chartY = 10;
  const centerX = chartX + chartSize / 2;
  const centerY = chartY + chartSize / 2;
  const radius = chartSize / 2 - 10;

  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(chartX, chartY, chartSize, chartSize);

  drawGainChartContent(
    ctx,
    centerX,
    centerY,
    radius,
    gainChartData,
    [0.0, -2, -4, -6, -8, -10]
  );

  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(chartX, chartY, chartSize, chartSize);
}

function drawOverlayGainChart(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gainChartData: { gainValues: number[]; maxGain: number },
  antennas: Antenna[]
) {
  const clusterCenter = antennas.reduce(
    (acc, ant) => ({ x: acc.x + ant.x, y: acc.y + ant.y }),
    { x: 0, y: 0 }
  );
  clusterCenter.x /= antennas.length;
  clusterCenter.y /= antennas.length;

  const { x: clusterCenterX, y: clusterCenterY } = worldToCanvas(
    clusterCenter.x,
    clusterCenter.y,
    canvas
  );

  const diameter = Math.min(canvas.width, canvas.height) * 0.75;
  const radius = diameter / 2;

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(clusterCenterX, clusterCenterY, radius, 0, 2 * Math.PI);
  ctx.fill();

  ctx.save();
  ctx.translate(clusterCenterX, clusterCenterY);
  drawGainChartContent(
    ctx,
    0,
    0,
    radius,
    gainChartData,
    [0.0, -0.5, -1, -1.5, -2, -3, -4, -6, -10, -15, -20, -30]
  );
  ctx.restore();

  // Add all direction labels with gain values
  const arrayGainDBd = gainChartData.maxGain;
  const labelPadding = 25;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.font = "10px Arial"; // Smaller font for all labels
  ctx.textAlign = "center";

  // Draw labels for every 30 degrees
  for (let angle = 0; angle < 360; angle += 30) {
    const gainLabel = formatGainLabel(
      gainChartData.gainValues[angle],
      arrayGainDBd
    );

    // Convert angle to radians for position calculation
    const radian = (angle * Math.PI) / 180;

    // Position label outside the circle
    const labelRadius = radius + labelPadding;
    const x = clusterCenterX + labelRadius * Math.sin(radian);
    const y = clusterCenterY - labelRadius * Math.cos(radian);

    // Rotate text based on position for better readability
    ctx.save();
    ctx.translate(x, y);

    ctx.fillText(`${angle}° (${gainLabel})`, 0, 0);

    ctx.restore();
  }
}

export function drawGainChart(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gainChartData: { gainValues: number[]; maxGain: number },
  mode: "widget" | "overlay",
  antennas?: Antenna[]
) {
  if (mode === "widget") {
    drawWidgetGainChart(ctx, canvas, gainChartData);
  } else if (mode === "overlay") {
    drawOverlayGainChart(ctx, canvas, gainChartData, antennas!);
  }
}