import { Point } from "@/Core/StoffLib/point";
import { FaceEdgeWithPosition } from "../../faceCarousel";
import { Sewing } from "../../sewing";
import { SewingLine } from "../../sewingLine";
import { create_and_wire_line, FaceEdgeBuildingBlock } from "./create_and_wire_line";
import { PartialStackLine, StackLine } from "./stackLine";
import { SewingPoint } from "../../sewingPoint";

export function merge_lines_vertically(sewing: Sewing, guide: SewingLine, sewOn: StackLine[]): SewingLine {
    const merged_line_endpoints = guide.get_endpoints();

    const sewOnComponents: PartialStackLine[] = sewOn.map(so => ({
        sewTo: guide.primary_component.map(c => c.line),
        ...so
    } as PartialStackLine))

    const primary_component = guide.primary_component;
    const other_components = guide.other_components.concat(
        sewOnComponents.flatMap(sl => {
            return sl.line.primary_component.concat(sl.line.other_components).map(c => ({
                line: c.line,
                has_sewing_line_orientation: c.has_sewing_line_orientation == sl.same_orientation,
                has_sewing_line_handedness: c.has_sewing_line_handedness == sl.same_handedness,
                sewTo: sl.sewTo
            }))
        })
    )

    const left_right_building_blocks: [FaceEdgeBuildingBlock[], FaceEdgeBuildingBlock[]][] = [[[], []]];

    for (const fe of guide.face_carousel.face_edges()) {
        const febb: FaceEdgeBuildingBlock = {
            lines: fe.edge.lines,
            sewOn: fe.sewOn,
            folded_right: fe.folded_right
        }

        if (febb.folded_right) {
            left_right_building_blocks[0][0].push(febb);
        } else {
            left_right_building_blocks[0][1].push(febb);
        }
    }

    left_right_building_blocks.push(...sewOnComponents.map(so => edge_buidling_blocks(
        guide, so
    )));

    const edges = left_right_building_blocks.flatMap(([l, r]) => l);
    left_right_building_blocks.reverse().forEach(([l, r]) => {
        edges.push(...r.reverse())
    })

    // merge points
    // remove all! sewing lines..
    sewOnComponents.forEach(so => {
        const firstPointInGuideOrientation = so.line.endpoint_from_orientation(so.same_orientation);
        const secondPointInGuideOrientation = so.line.endpoint_from_orientation(!so.same_orientation);

        const structured_guide_sublines = guide.structured_sublines(so.sewTo);
        const first_guide_point: Point = structured_guide_sublines[0].line.endpoint_from_orientation(
            structured_guide_sublines[0].orientation
        );
        const second_guide_point: Point = structured_guide_sublines[structured_guide_sublines.length - 1].line.endpoint_from_orientation(
            !structured_guide_sublines[structured_guide_sublines.length - 1].orientation
        );

        so.line.__mark_outdated();

        firstPointInGuideOrientation.merge(first_guide_point);
        secondPointInGuideOrientation.merge(second_guide_point);
    })

    guide.__mark_outdated();
    const res = create_and_wire_line({
        endpoints: merged_line_endpoints.map(p => p.updated()) as [SewingPoint, SewingPoint],
        primary_component,
        other_components,
        face_edge_building_blocks: edges
    });

    guide._update_to = res;
    sewOnComponents.forEach(so => so.line._update_to = res);

    return res;
}

function edge_buidling_blocks(
    guide: SewingLine,
    sl: PartialStackLine
): [FaceEdgeBuildingBlock[], FaceEdgeBuildingBlock[]] {
    const left: FaceEdgeBuildingBlock[] = [];
    const right: FaceEdgeBuildingBlock[] = [];
    for (const fe of sl.line.face_carousel.face_edges()) {
        const febb = single_edge_building_block(guide, sl, fe)

        if (!febb) continue;
        if (febb.folded_right) {
            right.push(febb);
        } else (left.push(febb))
    }

    return [left, right];
}

function single_edge_building_block(
    guide: SewingLine,
    sl: PartialStackLine,
    fe: FaceEdgeWithPosition
): FaceEdgeBuildingBlock | null {
    return {
        folded_right: fe.folded_right,
        lines: fe.edge.lines,
        sewOn: sl.sewTo
    }
}
