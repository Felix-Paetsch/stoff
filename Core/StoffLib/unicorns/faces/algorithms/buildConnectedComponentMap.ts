import { ConnectedComponentFaceData } from "./findFaces.js";
import Face from "../face.js";
import RogueChain from "../rogue.js";

export type ConnectedFaceComponent = {
    parent_face: Face | null;
    parent_component: Face | null;

    faces: Face[];
    component: Face | null;

    outer_chains: RogueChain[];
    inner_chains: RogueChain[];

    subcomponents: ConnectedFaceComponent[];
}

export function parseFaceComponents(data: ConnectedComponentFaceData[]): ConnectedFaceComponent[] {

}