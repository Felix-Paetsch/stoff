import { Line } from "../../StoffLib/line.js";
import FaceAtlas from "./faceAtlas.js";
import Point from "../../StoffLib/point.js";
import Face from "./face.js";
import { ConnectedFaceComponent } from "./connectedFaceComponent.js";

export default class RogueComponent {
    constructor(readonly lines: Line[], readonly faceAtlas?: FaceAtlas) { }

    get_lines(): Line[] {
        return this.lines;
    }

    get_points(): Point[] {
        return Array.from(new Set(this.lines.flatMap(l => l.get_endpoints())));
    }

    component(): ConnectedFaceComponent {
        return this.faceAtlas?.connectedComponents.find(c => c.outer_chains.includes(this))
            || this.faceAtlas?.connectedComponents.find(c => c.component?.contains(this))
            || this.own_component()
    }

    face(): Face | null {
        const component = this.component();
        return component.faces.find(f => f.contains(this)) || component.component;
    }

    own_component(): ConnectedFaceComponent {
        return {
            parent_face: null,
            parent_component: null,
            faces: [],
            component: null,
            outer_chains: [this],
            inner_chains: [],
            subcomponents: []
        }
    }
}