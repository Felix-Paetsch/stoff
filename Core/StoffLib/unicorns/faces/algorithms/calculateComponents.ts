import FaceAtlas from "../faceAtlas.js";
import Face from "../face.js";
import Line from "../../../line.js";

export default function calculateFaceComponents(faceAtlas: FaceAtlas): Face[] {
    const components: Face[] = [];
    const visited = new Set<Face>();

    for (const topLevelFace of faceAtlas.topLevelFaces) {
        if (visited.has(topLevelFace)) continue;

        const component = findConnectedComponent(topLevelFace, faceAtlas, visited);
        const outerBoundary = findOuterBoundary(component);
        components.push(new Face(outerBoundary, faceAtlas));
    }

    return components;
}

function findConnectedComponent(startFace: Face, faceAtlas: FaceAtlas, visited: Set<Face>): Face[] {
    const component: Face[] = [];
    const stack = [startFace];

    while (stack.length > 0) {
        const face = stack.pop()!;
        if (visited.has(face)) continue;

        visited.add(face);
        component.push(face);

        const faceData = faceAtlas.faceMap.get(face)!;
        for (const adjacentFace of faceData.adjacent_faces) {
            if (!visited.has(adjacentFace)) {
                stack.push(adjacentFace);
            }
        }
    }

    return component;
}

function findOuterBoundary(faces: Face[]): Line[] {
    const lineCount = new Map<Line, number>();

    for (const face of faces) {
        for (const line of face.boundary) {
            lineCount.set(line, (lineCount.get(line) || 0) + 1);
        }
    }

    const externalLines = Array.from(lineCount.entries())
        .filter(([, count]) => count === 1)
        .map(([line]) => line);

    return Line.order_by_endpoints(...externalLines);
}

