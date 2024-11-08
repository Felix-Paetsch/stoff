import { Vector } from "../../../StoffLib/geometry.js";

export default function fit_hulls(hulls, gridWidth = 10) {
    // Compute bounding boxes for each hull
    const hullsWithBounds = hulls.map((hull, index) => {
        const bounds = computeBoundingBox(hull);
        return { index, hull, bounds };
    });

    // Sort hulls by height in descending order (tallest first)
    hullsWithBounds.sort((a, b) => b.bounds.height - a.bounds.height);

    // Initial placement using a simple bin-packing algorithm
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;

    for (const item of hullsWithBounds) {
        if (currentRowWidth + item.bounds.width > gridWidth) {
            // Start a new row
            rows.push(currentRow);
            currentRow = [];
            currentRowWidth = 0;
        }
        currentRow.push(item);
        currentRowWidth += item.bounds.width;
    }
    // Add the last row
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    // Position hulls based on their assigned rows and columns
    let yOffset = 0;
    const positionedHulls = [];
    for (const row of rows) {
        let xOffset = 0;
        let rowHeight = 0;
        for (const item of row) {
            // Translate hull to its position in the grid
            const translatedHull = translateHull(item.hull, xOffset - item.bounds.minX, yOffset - item.bounds.minY);
            positionedHulls[item.index] = translatedHull;

            xOffset += item.bounds.width;
            rowHeight = Math.max(rowHeight, item.bounds.height);
        }
        yOffset += rowHeight;
    }

    // Optimization: Nudge hulls to minimize gaps
    const optimizedHulls = optimizePositions(positionedHulls);

    return optimizedHulls;
}

/**
 * Compute the axis-aligned bounding box of a hull.
 */
function computeBoundingBox(hull) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const point of hull) {
        if (point.x < minX) minX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.x > maxX) maxX = point.x;
        if (point.y > maxY) maxY = point.y;
    }

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY
    };
}

/**
 * Translate a hull by (dx, dy).
 */
function translateHull(hull, dx, dy) {
    return hull.map(point => new Vector(point.x + dx, point.y + dy));
}

/**
 * Optimize positions by nudging hulls closer together.
 */
function optimizePositions(hulls) {
    const maxIterations = 1000;
    const movementStep = 1;

    for (let iter = 0; iter < maxIterations; iter++) {
        let moved = false;
        for (let i = 0; i < hulls.length; i++) {
            for (let j = 0; j < hulls.length; j++) {
                if (i !== j && detectCollision(hulls[i], hulls[j])) {
                    // Nudge hull i away from hull j
                    const direction = computeSeparationVector(hulls[i], hulls[j]);
                    hulls[i] = translateHull(hulls[i], direction.x * movementStep, direction.y * movementStep);
                    moved = true;
                }
            }
        }
        if (!moved) break; // Exit if no hulls were moved
    }

    return hulls;
}

/**
 * Detect if two hulls are colliding.
 */
function detectCollision(hullA, hullB) {
    // Use the Separating Axis Theorem (SAT) for collision detection
    return polygonsIntersect(hullA, hullB);
}

/**
 * Compute a vector to separate two colliding hulls.
 */
function computeSeparationVector(hullA, hullB) {
    // Simple approach: Compute vector from hullB's center to hullA's center
    const centerA = computeCentroid(hullA);
    const centerB = computeCentroid(hullB);
    const direction = centerA.subtract(centerB).normalize();
    return direction;
}

/**
 * Compute the centroid of a hull.
 */
function computeCentroid(hull) {
    let x = 0, y = 0;
    for (const point of hull) {
        x += point.x;
        y += point.y;
    }
    return new Vector(x / hull.length, y / hull.length);
}

/**
 * Check if two convex polygons intersect using SAT.
 */
function polygonsIntersect(hullA, hullB) {
    const axes = [...getAxes(hullA), ...getAxes(hullB)];

    for (const axis of axes) {
        const projectionA = projectHull(hullA, axis);
        const projectionB = projectHull(hullB, axis);
        if (!overlap(projectionA, projectionB)) {
            // Separating axis found, no collision
            return false;
        }
    }
    // No separating axis found, hulls are colliding
    return true;
}

/**
 * Get the axes (normals) of the edges of a hull.
 */
function getAxes(hull) {
    const axes = [];
    for (let i = 0; i < hull.length; i++) {
        const p1 = hull[i];
        const p2 = hull[(i + 1) % hull.length];
        const edge = p2.subtract(p1);
        const normal = new Vector(-edge.y, edge.x).normalize();
        axes.push(normal);
    }
    return axes;
}

/**
 * Project a hull onto an axis.
 */
function projectHull(hull, axis) {
    let min = Infinity;
    let max = -Infinity;
    for (const point of hull) {
        const projection = point.dot(axis);
        if (projection < min) min = projection;
        if (projection > max) max = projection;
    }
    return { min, max };
}

/**
 * Check if two projections on an axis overlap.
 */
function overlap(projA, projB) {
    return projA.max > projB.min && projB.max > projA.min;
}
