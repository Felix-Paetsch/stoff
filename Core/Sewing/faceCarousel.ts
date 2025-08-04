import Face from "../PatternLib/faces/face.ts";
import { FaceEdge } from "./faceEdge.ts";
import { SewingLine } from "./sewingLine.ts";

type FaceEdgeWithPosition = {
    edge: FaceEdge,
    start_position_at_sewing_line: number, // Between 0 and 1 in line direction, beginning of edge
    end_position_at_sewing_line: number, // Between 0 and 1 in line direction, end of edge
    folded_right: boolean;
}

export class FaceCarousel {
    constructor(
        readonly sewingLine: SewingLine,
        readonly faceEdges: FaceEdgeWithPosition[]
    ) { }

    get outdated(): boolean {
        return this.sewingLine.outdated;
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
            end_edge = (start_edge - 1 + this.faceEdges.length) % this.faceEdges.length;
        }

        for (let j = start_edge; j < end_edge; j++) {
            yield this.faceEdges[j % this.faceEdges.length];
        }
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
        const new_edges: FaceEdgeWithPosition[] = [];
        let start_edge: FaceEdgeWithPosition | null = null;
        let other_start_edge: FaceEdgeWithPosition | null = null;

        for (const edge of carousel1.face_edges()) {
            for (const other_edge of carousel2.face_edges()) {
                if (edge.edge.connected_horizontally(other_edge.edge)) {
                    start_edge = edge;
                    other_start_edge = other_edge;

                    new_edges.push(merge_face_edges_horizontally(
                        carousel1.sewingLine,
                        carousel2.sewingLine,
                        start_edge,
                        other_start_edge
                    ));
                    break;
                }
            }
        }

        const first_carousel_edges = carousel1.face_edges(start_edge || 0);
        start_edge && first_carousel_edges.next();
        if (!other_start_edge) {
            other_start_edge = carousel2.faceEdges[0];
            new_edges.push(rescaled_face_edge(carousel1.sewingLine, carousel2.sewingLine, other_start_edge));
        }

        let last_used_edge: FaceEdgeWithPosition = other_start_edge!;

        for (const edge of first_carousel_edges) {
            const other_edge_iterator = carousel2.face_edges(last_used_edge, other_start_edge);
            other_edge_iterator.next();
            for (const other_edge of other_edge_iterator) {
                if (edge.edge.connected_horizontally(other_edge.edge)) {
                    const update_edges_iterator = carousel1.face_edges(last_used_edge, other_edge);
                    update_edges_iterator.next();
                    for (const edge of update_edges_iterator) {
                        new_edges.push(rescaled_face_edge(carousel1.sewingLine, carousel2.sewingLine, edge));
                    }

                    new_edges.push(merge_face_edges_horizontally(
                        carousel1.sewingLine,
                        carousel2.sewingLine,
                        edge,
                        other_edge
                    ));
                    last_used_edge = other_edge;
                }
            }
            new_edges.push(rescaled_face_edge(carousel1.sewingLine, carousel2.sewingLine, edge));
        }

        const update_edges_iterator = carousel1.face_edges(last_used_edge, other_start_edge);
        update_edges_iterator.next();
        for (const edge of update_edges_iterator) {
            new_edges.push(rescaled_face_edge(carousel1.sewingLine, carousel2.sewingLine, edge));
        }

        const fc = new FaceCarousel(sewingLine, new_edges);
        new_edges.forEach((edge) => (edge as any).face_carousel = fc);
        return fc;
    }
}

function merge_face_edges_horizontally(sewingLine1: SewingLine, sewingLine2: SewingLine, edge1: FaceEdgeWithPosition, edge2: FaceEdgeWithPosition): FaceEdgeWithPosition {
    // We assume edge1 and edge2 are connected horizontally, having correct orientation and belong to those sewing lines
    const new_edge_lines = [...edge1.edge.lines];
    if (
        new_edge_lines.length > 0 && new_edge_lines[new_edge_lines.length - 1].line === edge2.edge.lines[0].line
    ) {
        new_edge_lines[new_edge_lines.length - 1].position[1] = edge2.edge.lines[0].position[1];
        new_edge_lines.push(...edge2.edge.lines.slice(1));
    } else {
        new_edge_lines.push(...edge2.edge.lines);
    }

    if (edge1.folded_right !== edge2.folded_right) { throw new Error("Folded rightness of edges does not agree"); }

    return {
        edge: new FaceEdge(null as any, new_edge_lines),
        start_position_at_sewing_line: SewingLine.position_at_merged_sewing_line(
            sewingLine1,
            sewingLine2,
            true,
            edge1.start_position_at_sewing_line
        ),
        end_position_at_sewing_line: SewingLine.position_at_merged_sewing_line(
            sewingLine1,
            sewingLine2,
            false,
            edge2.end_position_at_sewing_line
        ),
        folded_right: edge1.folded_right
    };
}

function rescaled_face_edge(sewingLine1: SewingLine, sewingLine2: SewingLine, edge1: FaceEdgeWithPosition): FaceEdgeWithPosition {
    return {
        edge: new FaceEdge(null as any, edge1.edge.lines),
        start_position_at_sewing_line: SewingLine.position_at_merged_sewing_line(
            sewingLine1,
            sewingLine2,
            true,
            edge1.start_position_at_sewing_line
        ),
        end_position_at_sewing_line: SewingLine.position_at_merged_sewing_line(
            sewingLine1,
            sewingLine2,
            false,
            edge1.end_position_at_sewing_line
        ),
        folded_right: edge1.folded_right
    }
}
