export function canvasToWorld(
  canvasX: number,
  canvasY: number,
  canvas: HTMLCanvasElement
) {
  const gridSize = 10;
  const wavelengthPixels = canvas.width / gridSize;
  const worldX = (canvasX - canvas.width / 2) / wavelengthPixels;
  const worldY = (canvas.height / 2 - canvasY) / wavelengthPixels;
  return { x: worldX, y: worldY };
}

export function worldToCanvas(
  worldX: number,
  worldY: number,
  canvas: HTMLCanvasElement
) {
  const gridSize = 10;
  const wavelengthPixels = canvas.width / gridSize;
  const canvasX = worldX * wavelengthPixels + canvas.width / 2;
  const canvasY = canvas.height / 2 - worldY * wavelengthPixels;
  return { x: canvasX, y: canvasY };
}

export function isOverToolbox(
  x: number,
  y: number,
  canvas: HTMLCanvasElement
): boolean {
  const toolboxSize = canvas.width / 8;
  const margin = 16;
  return (
    x >= canvas.width - toolboxSize - margin &&
    x <= canvas.width - margin &&
    y >= canvas.height - toolboxSize - margin &&
    y <= canvas.height - margin
  );
}
