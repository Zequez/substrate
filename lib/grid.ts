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

  // const gridSize = (zoom > 1 ? 15 : zoom === 0.5 ? 60 : 30) * zoom;
  const gridSize = size * zoom;

  const physicalPanX = panX * zoom + width / 2;
  const physicalPanY = panY * zoom + height / 2;

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

type Rect = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};
export function adjustRectToGrid(
  rect: Rect,
  gridConfig: {
    size: number;
    zoom: number;
    panX: number;
    panY: number;
  }
): Rect {
  const { startX, startY, endX, endY } = rect;
  const { size, zoom, panX, panY } = gridConfig;
  const gridSize = size * zoom;
  const physicalPanX = panX * zoom;
  const physicalPanY = panY * zoom;
  return {
    startX: Math.floor((startX - physicalPanX) / gridSize) * gridSize,
    startY: Math.floor((startY - physicalPanY) / gridSize) * gridSize,
    endX: Math.ceil((endX - physicalPanX) / gridSize) * gridSize,
    endY: Math.ceil((endY - physicalPanY) / gridSize) * gridSize,
  };
}
