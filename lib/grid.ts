export function renderGrid(
  ctx: CanvasRenderingContext2D,
  config: {
    width: number;
    height: number;
    color: string;
    panX: number;
    panY: number;
    zoom: number;
    size: number;
  }
) {
  const { width, height, color, panX, panY, zoom, size } = config;

  console.log("Rendering grid", config, ctx.canvas.width, ctx.canvas.height);
  // const gridSize = (zoom > 1 ? 15 : zoom === 0.5 ? 60 : 30) * zoom;
  const gridSize = size * zoom;

  const physicalPanX = panX * size * zoom + width / 2;
  const physicalPanY = panY * size * zoom + height / 2;

  // Clear the canvas
  ctx.clearRect(0, 0, width, height);

  // Draw the grid
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  // Apply panning and zooming
  ctx.save();
  ctx.translate(
    (physicalPanX % gridSize) - gridSize,
    (physicalPanY % gridSize) - gridSize
  );

  // Vertical lines
  for (let x = 0; x <= width + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height + gridSize * 2);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= height + gridSize * 2; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width + gridSize, y);
    ctx.stroke();
  }

  ctx.restore();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff6";

  // Center lines

  if (physicalPanX > 0 && physicalPanX < width) {
    const centerX = physicalPanX;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
  }

  if (physicalPanY > 0 && physicalPanY < height) {
    const centerY = physicalPanY;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }
}
