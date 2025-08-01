import { FaceEdge } from "./faceEdge.ts";
import { SewingLine } from "./sewingLine.ts";

export class FaceCarousel {
    constructor(
        readonly sewingLine: SewingLine,
        readonly faceEdges: FaceEdge[],
    ) {

    }

    updated(): FaceCarousel {
        return this.sewingLine.updated().face_carousel;
    }
}