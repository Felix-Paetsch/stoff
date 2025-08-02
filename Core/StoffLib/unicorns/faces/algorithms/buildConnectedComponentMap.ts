import FaceAtlas from "../faceAtlas.js";
import Face from "../face.js";
import RogueChain from "../rogue.js";
import { BoundingBox } from "../../../geometry.js";

export type FacePositionData = {
    face: Face;
    parent_face: Face | null;

    adjacent_faces: Face[];

    subfaces: Face[];
    internal_chain: RogueChain[]
}
type FaceMap = Map<Face, FacePositionData>;

export default function buildFaceMap(faceAtlas: FaceAtlas): FaceMap {
    const faceMap: FaceMap = new Map();

    // Pre-compute bounding boxes for fast intersection tests
    const faceBoundingBoxes = new Map<Face, BoundingBox>();
    for (const face of faceAtlas.faces) {
        const hull = face.point_hull();
        faceBoundingBoxes.set(face, BoundingBox.from_points(hull));
    }

    // Initialize all faces with empty data
    for (const face of faceAtlas.faces) {
        faceMap.set(face, {
            face: face,
            parent_face: null,
            adjacent_faces: [],
            subfaces: [],
            internal_chain: []
        });
    }

    // Find adjacent faces and containment relationships in one pass
    for (let i = 0; i < faceAtlas.faces.length; i++) {
        const faceA = faceAtlas.faces[i];
        const dataA = faceMap.get(faceA)!;
        const bbA = faceBoundingBoxes.get(faceA)!;

        for (let j = i + 1; j < faceAtlas.faces.length; j++) {
            const faceB = faceAtlas.faces[j];
            const dataB = faceMap.get(faceB)!;
            const bbB = faceBoundingBoxes.get(faceB)!;

            // Check adjacency (faces that share boundary lines)
            if (faceA.is_adjacent(faceB)) {
                dataA.adjacent_faces.push(faceB);
                dataB.adjacent_faces.push(faceA);
            }

            // Fast bounding box check before expensive containment test
            if (bbA.intersects(bbB)) {
                // Check containment relationships
                if (faceA.contains(faceB, true)) {
                    dataA.subfaces.push(faceB);
                } else if (faceB.contains(faceA, true)) {
                    dataB.subfaces.push(faceA);
                }
            }
        }
    }

    // Determine parent faces using containment hierarchy (most immediate parent)
    for (const face of faceAtlas.faces) {
        const data = faceMap.get(face)!;

        // Find all faces that have this face as a subface
        const containingFaces = faceAtlas.faces.filter(otherFace => {
            const otherData = faceMap.get(otherFace)!;
            return otherData.subfaces.includes(face);
        });

        // Find the most immediate parent (containing face not contained by another containing face)
        if (containingFaces.length > 0) {
            data.parent_face = containingFaces.find(containingFace => {
                // Check if this containing face is contained by any other containing face
                return !containingFaces.some(otherContaining =>
                    otherContaining !== containingFace &&
                    faceMap.get(otherContaining)!.subfaces.includes(containingFace)
                );
            }) || null;
        }
    }

    // Find internal rogue chains with bounding box pre-filtering
    for (const chain of faceAtlas.chains) {
        // Create bounding box for chain
        const chainPoints = chain.lines.flatMap(line => line.get_absolute_sample_points());
        const chainBB = BoundingBox.from_points(chainPoints);

        // Find all faces that contain this chain
        const containingFaces: Face[] = [];
        for (const face of faceAtlas.faces) {
            const faceBB = faceBoundingBoxes.get(face)!;

            // Fast bounding box check first
            if (faceBB.intersects(chainBB)) {
                if (face.contains(chain, true)) {
                    containingFaces.push(face);
                }
            }
        }

        // Find the most immediate containing face (not contained by another containing face)
        if (containingFaces.length > 0) {
            const immediateParent = containingFaces.find(containingFace => {
                // Check if this containing face is contained by any other containing face
                return !containingFaces.some(otherContaining =>
                    otherContaining !== containingFace &&
                    otherContaining.contains(containingFace, true)
                );
            });

            if (immediateParent) {
                const data = faceMap.get(immediateParent)!;
                data.internal_chain.push(chain);
            }
        }
    }

    return faceMap;
}