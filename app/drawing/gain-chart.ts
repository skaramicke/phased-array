import { Antenna } from "../types";
import { worldToCanvas } from "../utils/canvasUtils";

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

  // Draw chart background
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(chartX, chartY, chartSize, chartSize);

  drawGainChartContent(ctx, centerX, centerY, radius, gainChartData);

  // Draw chart border
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(chartX, chartY, chartSize, chartSize);

  // Add labels
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText("0°", centerX, chartY + 15);
  ctx.fillText("90°", chartX + chartSize - 15, centerY);
  ctx.fillText("180°", centerX, chartY + chartSize - 5);
  ctx.fillText("270°", chartX + 15, centerY);
}

function drawOverlayGainChart(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gainChartData: { gainValues: number[]; maxGain: number },
  antennas: Antenna[]
) {
  // Calculate antenna cluster center
  const clusterCenter = antennas.reduce(
    (acc, ant) => ({ x: acc.x + ant.x, y: acc.y + ant.y }),
    { x: 0, y: 0 }
  );
  clusterCenter.x /= antennas.length;
  clusterCenter.y /= antennas.length;

  // Convert cluster center to canvas coordinates
  const { x: clusterCenterX, y: clusterCenterY } = worldToCanvas(
    clusterCenter.x,
    clusterCenter.y,
    canvas
  );

  // Calculate the diameter of the gain chart
  const diameter = Math.min(canvas.width, canvas.height) * 0.75;
  const radius = diameter / 2;

  // Draw semi-transparent background
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.beginPath();
  ctx.arc(clusterCenterX, clusterCenterY, radius, 0, 2 * Math.PI);
  ctx.fill();

  // Save the current context state
  ctx.save();

  // Translate the context to the cluster center
  ctx.translate(clusterCenterX, clusterCenterY);

  // Draw the gain chart content
  drawGainChartContent(ctx, 0, 0, radius, gainChartData);

  // Restore the context state
  ctx.restore();

  // Add labels
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText("0°", clusterCenterX, clusterCenterY - radius - 5);
  ctx.fillText("90°", clusterCenterX + radius + 5, clusterCenterY);
  ctx.fillText("180°", clusterCenterX, clusterCenterY + radius + 15);
  ctx.fillText("270°", clusterCenterX - radius - 5, clusterCenterY);
}

function drawGainChartContent(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  gainChartData: { gainValues: number[]; maxGain: number }
) {
  // Draw polar grid
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  for (let i = 1; i <= 4; i++) {
    ctx.moveTo(centerX + radius * (i / 4), centerY);
    ctx.arc(centerX, centerY, radius * (i / 4), 0, 2 * Math.PI);
  }
  for (let i = 0; i < 360; i += 30) {
    const angle = (i * Math.PI) / 180;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle)
    );
  }
  ctx.stroke();

  // Calculate and draw the gain pattern
  if (gainChartData.gainValues.length > 0) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let angle = 0; angle < 360; angle++) {
      const radian = (angle * Math.PI) / 180;
      const gain = gainChartData.gainValues[angle] / gainChartData.maxGain; // Normalize gain
      const x = centerX + radius * gain * Math.cos(radian);
      const y = centerY + radius * gain * Math.sin(radian);

      if (angle === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();

    // Fill the gain pattern
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    ctx.fill();
  }
}
