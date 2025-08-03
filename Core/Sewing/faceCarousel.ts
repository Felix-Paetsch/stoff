import { FaceEdge } from "./faceEdge.ts";
import { SewingLine } from "./sewingLine.ts";

export class FaceCarousel {
    constructor(
        readonly sewingLine: SewingLine,
        readonly faceEdges: {
            edge: FaceEdge,
            start_position_at_sewing_line: number, // Between 0 and 1 in line direction
            end_position_at_sewing_line: number, // Between 0 and 1 in line direction
        }[]
    ) {

    }

    _swap_orientation(): FaceCarousel {
        this.faceEdges.forEach((edge) => {
            const start_position = edge.start_position_at_sewing_line;
            edge.start_position_at_sewing_line = 1 - edge.end_position_at_sewing_line;
            edge.end_position_at_sewing_line = 1 - start_position;
        });
        this.faceEdges.reverse();
        return this;
    }

    updated(): FaceCarousel {
        return this.sewingLine.updated().face_carousel;
    }

    static merge_horizontally(sewingLine: SewingLine, carousel1: FaceCarousel, carousel2: FaceCarousel): FaceCarousel {
        // We assume carousels have same orientation (i.e. their sewing lines do)
        const faceEdges = carousel1.faceEdges.concat(carousel2.faceEdges);
        return new FaceCarousel(carousel1.sewingLine, faceEdges);
    }
}