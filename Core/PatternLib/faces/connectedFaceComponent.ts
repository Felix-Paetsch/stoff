import Face from "./face";
import RogueChain from "./rogue";

export type ConnectedFaceComponent = {
    parent_face: Face | null;
    parent_component: Face | null;

    faces: Face[];
    component: Face | null;

    outer_chains: RogueChain[];
    inner_chains: RogueChain[];

    subcomponents: ConnectedFaceComponent[];
}