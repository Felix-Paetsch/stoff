import { SewingLine } from "../../sewingLine";
import { FaceCarousel, FaceEdgeWithPosition } from "../../faceCarousel";
import { FaceEdge } from "../../faceEdge";
import { assert } from "../../../assert";
import { same_sewing } from "../../assert_methods";

export function merge_lines_horizontally(...lines: SewingLine[]): SewingLine {
    assert(same_sewing(...lines));

    if (lines.length === 0) {
        throw new Error("No lines to merge");
    }

    if (lines.length === 1) {
        return lines[0]!;
    }

    if (lines.length > 2) {
        return merge_lines_horizontally(
            merge_lines_horizontally(lines[0]!, lines[1]!),
            ...lines.slice(2)
        );
    }

    const line1: SewingLine = lines[0]!;
    const line2: SewingLine = lines[1]!;

    line2.set_orientation(line1);
    line2.set_handedness(line1);

    // Combine components
    const primary = line1.primary_component.concat(line2.primary_component)
    const other = line1.other_components.concat(line2.other_components)

    const newSewingLine = new SewingLine(
        [line1.p1, line2.p2],
        primary,
        other,
        null
    );

    newSewingLine._face_carousel = merge_face_carousels_horizontally(newSewingLine, line1.face_carousel, line2.face_carousel);

    // Remove lines from sewing_lines array
    line1.__mark_outdated(newSewingLine);
    line2.__mark_outdated(newSewingLine);

    return newSewingLine;
}


function merge_face_carousels_horizontally(sewingLine: SewingLine, carousel1: FaceCarousel, carousel2: FaceCarousel): FaceCarousel {
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
        other_start_edge = carousel2.faceEdges[0]!;
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
    new_edges.forEach((edge) => (edge.edge as any).face_carousel = fc);
    return fc;
}


function merge_face_edges_horizontally(edge1: FaceEdgeWithPosition, edge2: FaceEdgeWithPosition): FaceEdgeWithPosition {
    // We assume edge1 and edge2 are connected horizontally, having correct orientation
    const new_edge_lines = [...edge1.edge.lines];
    if (
        new_edge_lines.length > 0 && new_edge_lines[new_edge_lines.length - 1]!.line === edge2.edge.lines[0]!.line
    ) {
        new_edge_lines.push(...edge2.edge.lines.slice(1));
    } else {
        new_edge_lines.push(...edge2.edge.lines);
    }

    if (edge1.folded_right !== edge2.folded_right) { throw new Error("Folded rightness of edges does not agree"); }

    return {
        edge: new FaceEdge(null, new_edge_lines),
        sewOn: edge1.sewOn.concat(edge2.sewOn),
        folded_right: edge1.folded_right
    };
}
