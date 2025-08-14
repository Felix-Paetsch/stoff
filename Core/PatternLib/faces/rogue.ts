import { Line } from "../../StoffLib/line.js";
import FaceAtlas from "./faceAtlas.js";
import Point from "../../StoffLib/point.js";
import Face from "./face.js";
import { ConnectedFaceComponent } from "./connectedFaceComponent.js";

export default class RogueChain {
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

    get p1(): Point {
        if (this.lines.length == 1) return this.lines[0].p1;
        const middle_point = this.lines[0].common_endpoint(this.lines[1]);
        return this.lines[0].other_endpoint(middle_point);
    }

    get p2(): Point {
        if (this.lines.length == 1) return this.lines[0].p2;
        const middle_point = this.lines[this.lines.length - 1]
            .common_endpoint(this.lines[this.lines.length - 2]);
        return this.lines[this.lines.length - 1].other_endpoint(middle_point);
    }

    endpoints(): [Point, Point] {
        return [this.p1, this.p2];
    }

    orientations(): boolean[] {
        // true: We go the line p1 -> p2
        let last_point = this.p1;
        const orientations: boolean[] = [];

        for (const line of this.lines) {
            orientations.push(line.p1 === last_point);
            last_point = line.other_endpoint(last_point);
        }
        return orientations;
    }

    handedness(): boolean[] {
        // true: Same handedness as first line
        const handedness: boolean[] = [true];
        for (let i = 1; i < this.lines.length; i++) {
            handedness.push(
                this.lines[i].same_handedness(this.lines[i - 1])
                === handedness[i - 1]
            );
        }
        return handedness;
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