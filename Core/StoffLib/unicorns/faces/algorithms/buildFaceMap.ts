import FaceAtlas from "../faceAtlas.js";
import Face from "../face.js";
import RogueChain from "../rogue.js";

export type FacePositionData = {
    face: Face;
    parent_face: Face | null;

    adjacent_faces: Face[];

    subfaces: Face[];
    internal_chain: RogueChain[]
}
type FaceMap = Map<Face, FacePositionData>;

export default function buildFaceMap(faceAtlas: FaceAtlas): FaceMap {
    throw new Error("Not implemented");
}