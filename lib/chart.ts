
/**
 * Calculates a Catmull-Rom spline path for a set of points.
 * @param points Array of {x, y} points
 * @param k Tension factor (default 1)
 * @returns SVG path string
 */
export function getCatmullRomPath(points: { x: number; y: number }[], k: number = 1): string {
    if (points.length === 0) return "";

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];

        const cp1x = p1.x + (p2.x - p0.x) / 6 * k;
        const cp1y = p1.y + (p2.y - p0.y) / 6 * k;

        const cp2x = p2.x - (p3.x - p1.x) / 6 * k;
        const cp2y = p2.y - (p3.y - p1.y) / 6 * k;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
}
