import { PartialSewingLineComponent, SewingLine } from "../sewingLine.js";
import { Sewing } from "../sewing.js";
import { PartialStackLine, StackLine } from "./stackLine.js";
import { EPS, eps_equal } from "@/Core/StoffLib/geometry.js";
import { FaceEdgeComponent } from "../faceEdge.js";
import { FaceEdgeWithPosition } from "../faceCarousel.js";
import { create_and_wire_line, FaceEdgeBuildingBlock } from "./create_and_wire_line.js";
import { SewingPoint } from "../sewingPoint.js";

export function merge_lines_vertically(sewing: Sewing, guide: SewingLine, sewOn: StackLine[]): SewingLine {
    const sewOnComponents: PartialStackLine[] = sewOn.map(so => ({
        guideLineRange: [0, 1],
        stackLineRange: [0, 1],
        ...so
    }))

    const primary_component = guide.primary_component;
    const other_components = guide.other_components.concat(
        sewOnComponents.flatMap(sl => stackLineComponents(guide, sl))
    )

    const left_right_building_blocks: [FaceEdgeBuildingBlock[], FaceEdgeBuildingBlock[]][] = [[[], []]];
    for (const fe of guide.face_carousel.face_edges()) {
        const febb: FaceEdgeBuildingBlock = {
            lines: fe.edge.lines,
            position_at_sewing_line: fe.position_at_sewing_line,
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
    )))

    const edges = left_right_building_blocks.flatMap(([l, r]) => l);
    left_right_building_blocks.reverse().forEach(([l, r]) => {
        edges.push(...r.reverse())
    })

    // merge points
    // remove all! sewing lines..
    let endpoints = guide.get_endpoints();
    guide.remove();
    sewOn.forEach(so => {
        if (!("guideLineRange" in so)) {
            let soEndpoints = so.line.get_endpoints();
            so.line.remove();
            if (!so.same_orientation) {
                endpoints.reverse();
            }
            endpoints[0] = endpoints[0].merge(soEndpoints[0]);
            endpoints[1] = endpoints[1].merge(soEndpoints[1]);
            return;
        }

        let soEndpoints = so.line.get_endpoints();
        so.line.mark_as_partially_sewn();
        if (so.stackLineRange[0] < EPS.COARSE) {
            let merge_point: null | SewingPoint = null;
            if (so.same_orientation && so.guideLineRange[0] < EPS.COARSE) {
                merge_point = soEndpoints[0];
            } else if (!so.same_orientation && so.guideLineRange[1] > 1 - EPS.COARSE) {
                merge_point = soEndpoints[1];
            }
            if (merge_point) {
                const index = endpoints.findIndex(e => e.is(merge_point));
                endpoints[index] = endpoints[index].merge(merge_point);
            } else {
                so.line.p1.mark_as_inaccessible();
            }
        } else {
            so.line.p1.mark_as_inaccessible();
        }
        if (so.stackLineRange[1] > 1 - EPS.COARSE) {
            let merge_point: null | SewingPoint = null;
            if (so.same_orientation && so.guideLineRange[1] > 1 - EPS.COARSE) {
                merge_point = soEndpoints[1];
            } else if (!so.same_orientation && so.guideLineRange[0] < EPS.COARSE) {
                merge_point = soEndpoints[0];
            }
            if (merge_point) {
                const index = endpoints.findIndex(e => e.is(merge_point));
                endpoints[index] = endpoints[index].merge(merge_point);
            } else {
                so.line.p2.mark_as_inaccessible();
            }
        } else {
            so.line.p2.mark_as_inaccessible();
        }
    })

    return create_and_wire_line({
        sewing,
        primary_component,
        other_components,
        face_edge_building_blocks: edges
    });
}

function stackLineComponents(guide: SewingLine, sl: PartialStackLine): PartialSewingLineComponent[] {
    const old_components = sl.line.primary_component.concat(sl.line.other_components);
    const partial_components: PartialSewingLineComponent[] = old_components.map(c => ({
        edge_sewn_range: [0, 1],
        ...c
    }));

    const new_comps: PartialSewingLineComponent[] = []
    partial_components.forEach(comp => {
        const merged_intervals = get_clamp_merged_intervals(
            sl.guideLineRange, sl.stackLineRange, sl.same_orientation,
            comp.position_at_sewing_line, comp.edge_sewn_range, comp.has_sewing_line_orientation
        )

        if (eps_equal(merged_intervals.source[0], merged_intervals.source[1], EPS.COARSE)) {
            return;
        }

        new_comps.push({
            line: comp.line,
            has_sewing_line_orientation: comp.has_sewing_line_orientation == sl.same_orientation,
            has_sewing_line_handedness: comp.has_sewing_line_handedness == sl.same_handedness,

            position_at_sewing_line: merged_intervals.target,
            edge_sewn_range: merged_intervals.source
        })
    })

    return new_comps;
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
    const {
        target: new_edge_range_at_guide_line,
        source: new_edge_range_at_edge
    } = get_clamp_merged_intervals(
        sl.guideLineRange, sl.stackLineRange, sl.same_orientation,
        fe.position_at_sewing_line, [0, 1], true
    )

    if (eps_equal(new_edge_range_at_guide_line[0], new_edge_range_at_guide_line[1])) {
        return null;
    }
    const faceEdgeComponents: FaceEdgeComponent[] = [];

    const oldEdgeComponents = fe.edge.lines;
    for (let i = 0; i < oldEdgeComponents.length; i++) {
        const old_position_at_edge = fe.edge.position(oldEdgeComponents[i]);
        if (old_position_at_edge[1] <= new_edge_range_at_edge[0]) continue;
        if (old_position_at_edge[0] >= new_edge_range_at_edge[1]) break;
        const new_position_at_edge = [
            Math.max(old_position_at_edge[0], new_edge_range_at_edge[0]),
            Math.min(old_position_at_edge[1], new_edge_range_at_edge[1])
        ];
        const edgePosition_toLineOfEdgePosition = liner_transform_position_at_interval(
            oldEdgeComponents[i].position, old_position_at_edge, oldEdgeComponents[i].standard_orientation
        );
        faceEdgeComponents.push({
            ...oldEdgeComponents[i],
            position: new_position_at_edge.map(edgePosition_toLineOfEdgePosition) as [number, number]
        });
    }

    return {
        folded_right: fe.folded_right,
        lines: faceEdgeComponents,
        position_at_sewing_line: new_edge_range_at_guide_line
    }
}

type LinearTransform = ((position_at_source: number) => number) & {
    inverse: LinearTransform
}

function liner_transform_position_at_interval(interval_at_target: [number, number], interval_at_source: [number, number], sameOrientation = true): LinearTransform {
    const [x, y] = interval_at_source;
    let [fx, fy] = interval_at_target;
    if (!sameOrientation) {
        [fx, fy] = [fy, fx];
    }

    const fn = (a: number) => {
        const m = (fx - fy) / (x - y);
        return m * a + fy - m * y;
    }

    return Object.assign(
        fn, {
        get inverse() {
            return liner_transform_position_at_interval(interval_at_target, interval_at_source, sameOrientation)
        }
    })
}

function get_clamp_merged_intervals(
    interval1_at_FINAL_target: [number, number],
    interval1_at_MID: [number, number],
    same_orientation1: boolean,
    interval2_at_MID: [number, number],
    interval2_at_FINAL_source: [number, number],
    same_orientation2: boolean
) {
    const position_mid_to_final = liner_transform_position_at_interval(
        interval1_at_FINAL_target, interval1_at_MID, same_orientation1
    );
    const position_source_to_mid = liner_transform_position_at_interval(
        interval2_at_MID, interval2_at_FINAL_source, same_orientation2
    );

    const position_targetF_to_sourceF = (a: number) => position_source_to_mid.inverse(position_mid_to_final.inverse(a));

    const new_at_target: [number, number] = [
        Math.max(
            interval1_at_FINAL_target[0],
            position_mid_to_final(interval2_at_MID[0])
        ),
        Math.min(
            interval1_at_FINAL_target[1],
            position_mid_to_final(interval2_at_MID[1])
        )
    ]

    const new_at_source: [number, number] = new_at_target.map(position_targetF_to_sourceF) as [number, number];
    return {
        source: new_at_source,
        target: new_at_target
    }
}