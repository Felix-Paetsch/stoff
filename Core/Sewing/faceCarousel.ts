import { FaceEdge } from "./faceEdge.ts";
import { SewingLine } from "./sewingLine.ts";
import { Line } from "../StoffLib/line.js";

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
        return this.faceEdges.filter((edge) => !edge.folded_right).map((edge) => edge.edge);
    }

    right_edges(): FaceEdge[] {
        return this.faceEdges.filter((edge) => edge.folded_right).map((edge) => edge.edge);
    }

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
            end_edge = start_edge + this.faceEdges.length
        }

        for (let j = start_edge; j < end_edge; j++) {
            yield this.faceEdges[j % this.faceEdges.length];
        }
    }

    _swap_orientation(): FaceCarousel {
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
            new_edges.push(other_start_edge);
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
                        new_edges.push(edge);
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
            new_edges.push(edge);
        }

        const update_edges_iterator = carousel1.face_edges(last_used_edge, other_start_edge);
        update_edges_iterator.next();
        for (const edge of update_edges_iterator) {
            new_edges.push(edge);
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
        new_edge_lines.push(...edge2.edge.lines.slice(1));
    } else {
        new_edge_lines.push(...edge2.edge.lines);
    }

    if (edge1.folded_right !== edge2.folded_right) { throw new Error("Folded rightness of edges does not agree"); }

    return {
        edge: new FaceEdge(null as any, new_edge_lines),
        sewOn: edge1.sewOn.concat(edge2.sewOn),
        folded_right: edge1.folded_right
    };
}
