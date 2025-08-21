import Face from "./face";
import RogueComponent from "./rogue";

export type ConnectedFaceComponent = {
    parent_face: Face | null;
    parent_component: Face | null;

    faces: Face[];
    component: Face | null;

    outer_chains: RogueComponent[];
    inner_chains: RogueComponent[];

    subcomponents: ConnectedFaceComponent[];
}