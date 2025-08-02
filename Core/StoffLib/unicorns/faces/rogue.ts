import { Line } from "../../line.js";
import FaceAtlas from "./faceAtlas.js";

export default class RogueChain {
    constructor(readonly lines: Line[], readonly faceAtlas?: FaceAtlas) { }

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
}