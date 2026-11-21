import type { CanvasElement } from "../types/canvas";

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates Euclidean distance from point (px, py) to line segment (x1, y1) -> (x2, y2).
 */
export function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

/**
 * Determines whether a 2D world coordinate (px, py) touches, resides within, or connects to the boundary of an element.
 * 
 * Boundary Metrics:
 * - Rectangles: checks boundary distance & interior with generous tolerance (+/- 24px)
 * - Ellipse / Circles: checks normalized radial distance to perimeter with tolerance
 * - Text: checks multi-line typographic bounding box
 * - Lines & Freehand: checks distance to all polyline segments
 */
export function isPointConnectedToElement(
  px: number,
  py: number,
  el: CanvasElement,
  tolerance: number = 24
): boolean {
  if (el.type === "rect") {
    const elX = el.x;
    const elY = el.y;
    const w = el.width || 100;
    const h = el.height || 60;
    const minX = Math.min(elX, elX + w) - tolerance;
    const maxX = Math.max(elX, elX + w) + tolerance;
    const minY = Math.min(elY, elY + h) - tolerance;
    const maxY = Math.max(elY, elY + h) + tolerance;

    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }

  if (el.type === "circle") {
    const rx = (el.radiusX || 40) + tolerance;
    const ry = (el.radiusY || 40) + tolerance;
    const dx = px - el.x;
    const dy = py - el.y;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  }

  if (el.type === "text") {
    const fontSize = el.fontSize || 22;
    const lines = (el.text || "").split("\n");
    const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
    const w = maxLineLen * (fontSize * 0.6) + 24;
    const h = lines.length * (fontSize * 1.3) + 12;

    const minX = el.x - tolerance;
    const maxX = el.x + w + tolerance;
    const minY = el.y - tolerance;
    const maxY = el.y + h + tolerance;

    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }

  if ((el.type === "line" || el.type === "freehand") && el.points && el.points.length >= 2) {
    for (let i = 0; i < el.points.length - 2; i += 2) {
      const p1x = el.x + el.points[i]!;
      const p1y = el.y + el.points[i + 1]!;
      const p2x = el.x + el.points[i + 2]!;
      const p2y = el.y + el.points[i + 3]!;
      if (distToSegment(px, py, p1x, p1y, p2x, p2y) <= tolerance) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extracts the absolute world-coordinate start and end points of a directional arrow or connecting line.
 */
export function getArrowEndpoints(arrow: CanvasElement): { start: Point; end: Point } | null {
  if (arrow.type !== "arrow" && arrow.type !== "line") return null;
  if (!arrow.points || arrow.points.length < 4) return null;

  const start: Point = {
    x: arrow.x + arrow.points[0]!,
    y: arrow.y + arrow.points[1]!,
  };
  const end: Point = {
    x: arrow.x + arrow.points[arrow.points.length - 2]!,
    y: arrow.y + arrow.points[arrow.points.length - 1]!,
  };
  return { start, end };
}

/**
 * Discovers all elements belonging to the same connected component / cluster as targetId.
 * When Figure A is connected via an arrow to Figure B, moving A moves B and the arrow.
 */
export function getConnectedCluster(
  targetId: string,
  elements: CanvasElement[],
  tolerance: number = 24
): CanvasElement[] {
  const target = elements.find((e) => e.id === targetId);
  if (!target) return [];

  // Build bidirectional adjacency graph
  const adj = new Map<string, Set<string>>();
  for (const el of elements) {
    adj.set(el.id, new Set());
  }

  const arrows = elements.filter((el) => el.type === "arrow" || el.type === "line");
  const shapes = elements.filter((el) => el.type !== "arrow" && el.type !== "line");

  for (const arrow of arrows) {
    const endpoints = getArrowEndpoints(arrow);
    if (!endpoints) continue;

    let startShape: CanvasElement | null = null;
    let endShape: CanvasElement | null = null;

    for (const shape of shapes) {
      if (!startShape && isPointConnectedToElement(endpoints.start.x, endpoints.start.y, shape, tolerance)) {
        startShape = shape;
      }
      if (!endShape && isPointConnectedToElement(endpoints.end.x, endpoints.end.y, shape, tolerance)) {
        endShape = shape;
      }
    }

    // Connect arrow <-> startShape
    if (startShape) {
      adj.get(arrow.id)?.add(startShape.id);
      adj.get(startShape.id)?.add(arrow.id);
    }

    // Connect arrow <-> endShape
    if (endShape) {
      adj.get(arrow.id)?.add(endShape.id);
      adj.get(endShape.id)?.add(arrow.id);
    }

    // If both ends are connected, connect startShape <-> endShape
    if (startShape && endShape && startShape.id !== endShape.id) {
      adj.get(startShape.id)?.add(endShape.id);
      adj.get(endShape.id)?.add(startShape.id);
    }
  }

  // BFS traversal to collect all connected elements in the cluster
  const visited = new Set<string>();
  const queue: string[] = [targetId];
  visited.add(targetId);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj.get(curr);
    if (neighbors) {
      for (const nbr of neighbors) {
        if (!visited.has(nbr)) {
          visited.add(nbr);
          queue.push(nbr);
        }
      }
    }
  }

  return elements.filter((el) => visited.has(el.id));
}
