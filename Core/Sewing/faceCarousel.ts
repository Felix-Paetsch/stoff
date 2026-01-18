import { FaceEdge } from "./faceEdge.ts";
import { SewingLine } from "./sewingLine.ts";
import { Line } from "../StoffLib/line.js";
import { assert } from "../assert.ts";

export type FaceEdgeWithPosition = {
    readonly edge: FaceEdge,
    sewOn: Line[],
    folded_right: boolean;
}

export class FaceCarousel {
    constructor(
        readonly sewingLine: SewingLine,
        readonly faceEdges: FaceEdgeWithPosition[]
    ) { }

    fold(left: FaceEdge[], right: FaceEdge[]): void {
        assert(!this._is_outdated);
        // With p1 bottom and p2 top; which things to put at the left or right when looking from the front side
        // Later we will test that is can be folded
        this.faceEdges.forEach((edge) => {
            if (left.includes(edge.edge)) {
                edge.folded_right = false;
            } else if (right.includes(edge.edge)) {
                edge.folded_right = true;
            } else {
                throw new Error("Didn't specify what should happen with a faceEdge");
            }
        });
    }

    left_edges(): FaceEdge[] {
        assert(!this._is_outdated);
        return this.faceEdges.filter((edge) => !edge.folded_right).map((edge) => edge.edge);
    }

    right_edges(): FaceEdge[] {
        assert(!this._is_outdated);
        return this.faceEdges.filter((edge) => edge.folded_right).map((edge) => edge.edge);
    }

    edges(): FaceEdge[] {
        return this.faceEdges.map(e => e.edge);
    }

    get _is_outdated(): boolean {
        return this.sewingLine._is_outdated;
    }

    *face_edges(start_edge: number | FaceEdgeWithPosition = 0, end_edge?: number | FaceEdgeWithPosition): Generator<FaceEdgeWithPosition> {
        if (typeof start_edge !== "number") {
            start_edge = this.faceEdges.findIndex((edge) => edge === start_edge) || 0;
        }

        if (end_edge) {
            if (typeof end_edge !== "number") {
                end_edge = this.faceEdges.findIndex((edge) => edge === end_edge) || 0;
            }
        } else {
            end_edge = start_edge + this.faceEdges.length
        }

        for (let j = start_edge; j < end_edge; j++) {
            yield this.faceEdges[j % this.faceEdges.length];
        }
    }

    _swap_orientation(): FaceCarousel {
        assert(!this._is_outdated);
        this.faceEdges.forEach((edge) => {
            edge.edge.lines.forEach((line) => {
                line.standard_orientation = !line.standard_orientation;
            });
        });
        this.faceEdges.reverse();
        return this;
    }

    updated(): FaceCarousel {
        return this.sewingLine.updated().face_carousel;
    }

}
