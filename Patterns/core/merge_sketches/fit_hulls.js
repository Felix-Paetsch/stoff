// Import the Vector class
import { Vector } from "../../../StoffLib/geometry.js";

export default function fit_hulls(hulls, grid_size = 10, direction = false) {
    // Direction false (default): Fixed width (grid_size), minimize height (n)
    // Direction true: Fixed height (grid_size), minimize width (n)

    // Compute the bounding box for each hull
    const hullsData = hulls.map((hull, index) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let vertex of hull) {
            if (vertex.x < minX) minX = vertex.x;
            if (vertex.x > maxX) maxX = vertex.x;
            if (vertex.y < minY) minY = vertex.y;
            if (vertex.y > maxY) maxY = vertex.y;
        }
        const width = maxX - minX;
        const height = maxY - minY;
        return {
            index,
            hull,
            minX,
            minY,
            maxX,
            maxY,
            width,
            height
        };
    });

    // Check that each hull can fit within the fixed dimension
    for (let data of hullsData) {
        if (!direction) {
            // Fixed width
            if (data.width > grid_size) {
                throw new Error(`Hull at index ${data.index} cannot fit within the fixed width ${grid_size}. Hull width: ${data.width.toFixed(2)}, height: ${data.height.toFixed(2)}`);
            }
        } else {
            // Fixed height
            if (data.height > grid_size) {
                throw new Error(`Hull at index ${data.index} cannot fit within the fixed height ${grid_size}. Hull width: ${data.width.toFixed(2)}, height: ${data.height.toFixed(2)}`);
            }
        }
    }

    const adjustedHulls = [];

    if (!direction) {
        // Fixed width, minimize height
        let currentX = 0;
        let currentY = 0;
        let currentShelfHeight = 0;

        for (let data of hullsData) {
            // Check if the hull fits in the current shelf
            if (currentX + data.width <= grid_size) {
                // Place the hull at currentX, currentY
                data.position = new Vector(currentX - data.minX, currentY - data.minY);
                currentX += data.width;
                if (data.height > currentShelfHeight) {
                    currentShelfHeight = data.height;
                }
            } else {
                // Start new shelf
                currentX = 0;
                currentY += currentShelfHeight;
                currentShelfHeight = data.height;
                data.position = new Vector(currentX - data.minX, currentY - data.minY);
                currentX += data.width;
            }

            // Adjust the hull's vertices
            const adjustedHull = data.hull.map(vertex => vertex.add(data.position));
            adjustedHulls.push(adjustedHull);
        }
    } else {
        // Fixed height, minimize width
        let currentX = 0;
        let currentY = 0;
        let currentColumnWidth = 0;

        for (let data of hullsData) {
            // Check if the hull fits in the current column
            if (currentY + data.height <= grid_size) {
                // Place the hull at currentX, currentY
                data.position = new Vector(currentX - data.minX, currentY - data.minY);
                currentY += data.height;
                if (data.width > currentColumnWidth) {
                    currentColumnWidth = data.width;
                }
            } else {
                // Start new column
                currentX += currentColumnWidth;
                currentY = 0;
                currentColumnWidth = data.width;
                data.position = new Vector(currentX - data.minX, currentY - data.minY);
                currentY += data.height;
            }

            // Adjust the hull's vertices
            const adjustedHull = data.hull.map(vertex => vertex.add(data.position));
            adjustedHulls.push(adjustedHull);
        }
    }

    return adjustedHulls;
}
