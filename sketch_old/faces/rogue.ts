import { Line } from "../line";
import { Point } from "../point";
import { ConnectedFaceComponent } from "./connectedFaceComponent";
import { Face } from "./face";
import { FaceAtlas } from "./faceAtlas";

export class RogueComponent {
    constructor(
        readonly lines: Line[],
        readonly faceAtlas?: FaceAtlas,
    ) {}

    get_lines(): Line[] {
        return this.lines;
    }

    get_points(): Point[] {
        return Array.from(
            new Set(this.lines.flatMap((l) => l.get_endpoints())),
        );
    }

    component(): ConnectedFaceComponent {
        return (
            this.faceAtlas?.connectedComponents.find((c) =>
                c.outer_chains.includes(this),
            ) ||
            this.faceAtlas?.connectedComponents.find((c) =>
                c.component?.contains(this),
            ) ||
            this.own_component()
        );
    }

    face(): Face | null {
        const component = this.component();
        const r =
            component.faces.find((f) => f.contains(this)) ||
            component.component;
        return r;
    }

    own_component(): ConnectedFaceComponent {
        return {
            parent_face: null,
            parent_component: null,
            faces: [],
            component: null,
            outer_chains: [this],
            inner_chains: [],
            subcomponents: [],
        };
    }
}
