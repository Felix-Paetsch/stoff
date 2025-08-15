import { FaceCarousel, FaceEdgeWithPosition } from "../faceCarousel";
import { FaceEdge, FaceEdgeComponent } from "../faceEdge";
import { Sewing } from "../sewing";
import { PartialSewingLineComponent, SewingLine, SewingLineComponent } from "../sewingLine";
import { Line } from "../../StoffLib/line.js";

export type FaceEdgeBuildingBlock = {
    lines: FaceEdgeComponent[],
    sewOn: Line[],
    folded_right: boolean
}

export type lineConstructionData = {
    sewing: Sewing,
    primary_component: SewingLineComponent[],
    other_components: PartialSewingLineComponent[],
    face_edge_building_blocks: FaceEdgeBuildingBlock[]
}

export function create_and_wire_line(data: lineConstructionData): SewingLine {
    const newSewingLine = new SewingLine(
        data.sewing,
        data.primary_component,
        data.other_components,
        null as any
    );

    const face_edges: FaceEdgeWithPosition[] = data.face_edge_building_blocks.map(bb => {
        return {
            edge: new FaceEdge(null as any, bb.lines),
            folded_right: bb.folded_right,
            sewOn: bb.sewOn
        }
    });

    const fc = new FaceCarousel(newSewingLine, face_edges);
    face_edges.forEach(fe => (fe as any).edge.face_carousel = fc);
    (newSewingLine as any).face_carousel = fc;

    newSewingLine.get_endpoints().forEach((endpoint) => {
        endpoint.sewingLines.push(newSewingLine);
    });

    data.sewing.sewing_lines.push(newSewingLine);
    return newSewingLine;
}