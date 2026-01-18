import { SewingLine } from "@/Core/Sewing/sewingLine";
import {
    get_line_render_data,
    get_point_render_data
} from "./render_sketches_methods";
import { SewingPoint } from "@/Core/Sewing/sewingPoint";
import { Gradient, interpolate_colors, is_gradient } from "@/Core/utils/colors";
import { FaceEdgeWithPosition } from "@/Core/Sewing/faceCarousel";
import { FaceRenderAttributes, Renderer } from "./renderer";
import { PointRenderAttributes } from "@/Core/StoffLib/point";
import {
    default_active_sewing_line_other_attributes,
    default_active_sewing_line_primary_attributes,
    default_active_sewing_line_start_point,
    default_active_sewing_line_end_point,
    default_active_sewing_line_up_face,
    default_active_sewing_line_down_face,
    default_active_sewing_point_attributes,
    default_inactive_sewing_line_other_attributes,
    default_inactive_sewing_line_primary_attributes,
    default_inactive_sewing_point_attributes,
    default_non_sewing_line_attributes,
    default_non_sewing_point_attributes,
    default_active_sewing_line_middle_point
} from "./defaults/sewing";
import { LineRenderAttributes } from "@/Core/StoffLib/line";

export function render_inactive_sewing(r: Renderer) {
    r.sewing.sketches.forEach(s => {
        s.get_lines().forEach(line => {
            r.render_line(
                line,
                default_non_sewing_line_attributes,
                ["base"],
                [],
                get_line_render_data(line)
            );
        });

        s.get_points().forEach(pt => {
            r.render_point(
                pt,
                default_non_sewing_point_attributes,
                ["base"],
                [],
                get_point_render_data(pt)
            );
        });

        r.get_face_atlas(s).faces.forEach(f => {
            r.render_face(f, {}, ["base"], [], {
                _area: f.area()
            });
        });
    });

    r.sewing.sewing_lines.forEach(sl => {
        render_inactive_sewing_line(
            r,
            sl,
            {},
        );
    });

    r.sewing.sewing_points.forEach(sp => {
        render_sewing_point(
            r,
            sp,
            default_inactive_sewing_point_attributes
        );
    });
}

export function render_sewing(r: Renderer) {
    r.sewing.sketches.forEach(s => {
        s.get_lines().forEach(line => {
            r.render_line(
                line,
                default_non_sewing_line_attributes,
                ["base"],
                [],
                get_line_render_data(line)
            );
        });

        s.get_points().forEach(pt => {
            r.render_point(
                pt,
                default_non_sewing_point_attributes,
                ["base"],
                [],
                get_point_render_data(pt)
            );
        });

        r.get_face_atlas(s).faces.forEach(f => {
            r.render_face(f, {}, ["base"], [], {
                _area: f.area()
            });
        });
    });

    r.sewing.sewing_points.forEach(sp => {
        const id = "sewing_point" + Math.random();

        render_sewing_point(
            r,
            sp,
            default_inactive_sewing_point_attributes,
            ["base"],
            [id]
        );

        render_sewing_point(
            r,
            sp,
            default_active_sewing_point_attributes,
            [id],
            [id]
        );
    });

    r.sewing.sewing_lines.forEach(sl => {
        const id = "sewing_line" + Math.random();

        render_inactive_sewing_line(
            r,
            sl,
            {},
            ["base"],
            [id]
        );

        render_active_sewing_line(
            r,
            sl,
            {},
            [id],
            [id]
        );
    });
}

/* ============================================================================
 * Sewing points
 * ==========================================================================*/

export function render_sewing_point(
    r: Renderer,
    pt: SewingPoint,
    styling: Partial<PointRenderAttributes> = {},
    belongs_to_render_groups: string[] = ["base"],
    show_render_groups_on_hover: string[] = []
) {
    const attr: PointRenderAttributes = {
        ...default_inactive_sewing_point_attributes,
        ...styling
    };

    pt.points.forEach(p => {
        r.render_point(
            p,
            attr,
            belongs_to_render_groups,
            show_render_groups_on_hover,
            get_point_render_data(p)
        );
    });
}

/* ============================================================================
 * Sewing lines (passive)
 * ==========================================================================*/

export type PassiveSewingLineStyling = {
    primary: Partial<LineRenderAttributes>;
    other: Partial<LineRenderAttributes>;
};

export function render_inactive_sewing_line(
    r: Renderer,
    sl: SewingLine,
    styling: Partial<PassiveSewingLineStyling> = {},
    belongs_to_render_groups: string[] = ["base"],
    show_render_groups_on_hover: string[] = []
) {
    const style: PassiveSewingLineStyling = {
        primary: default_inactive_sewing_line_primary_attributes,
        other: default_inactive_sewing_line_other_attributes,
        ...styling
    };

    sl.primary_component.forEach(component => {
        r.render_line(
            component.line,
            {
                ...default_inactive_sewing_line_primary_attributes,
                ...style.primary
            },
            belongs_to_render_groups,
            show_render_groups_on_hover,
            {
                _sewing_line_handedness:
                    component.has_sewing_line_handedness,
                _sewing_line_orientation:
                    component.has_sewing_line_orientation,
                ...get_line_render_data(component.line)
            }
        );
    });

    sl.other_components.forEach(component => {
        r.render_line(
            component.line,
            {
                ...default_inactive_sewing_line_other_attributes,
                ...style.other
            },
            belongs_to_render_groups,
            show_render_groups_on_hover,
            {
                _sewing_line_handedness:
                    component.has_sewing_line_handedness,
                _sewing_line_orientation:
                    component.has_sewing_line_orientation,
                ...get_line_render_data(component.line)
            }
        );
    });
}

/* ============================================================================
 * Sewing lines (active)
 * ==========================================================================*/

export type ActiveSewingLineStyling = {
    primary_attributes: Partial<LineRenderAttributes>;
    other_attributes: Partial<LineRenderAttributes>;
    start_point_attributes: Partial<PointRenderAttributes>;
    end_point_attributes: Partial<PointRenderAttributes>;
    middle_point_attributes: Partial<PointRenderAttributes>;
    up_face_attributes: Partial<FaceRenderAttributes>;
    down_face_attributes: Partial<FaceRenderAttributes>;
};

export function render_active_sewing_line(
    r: Renderer,
    sl: SewingLine,
    styling: Partial<ActiveSewingLineStyling> = {},
    belongs_to_render_groups: string[] = ["base"],
    show_render_groups_on_hover: string[] = []
) {
    const resolved: ActiveSewingLineStyling = {
        primary_attributes: default_active_sewing_line_primary_attributes,
        other_attributes: default_active_sewing_line_other_attributes,
        middle_point_attributes: default_active_sewing_line_middle_point,
        start_point_attributes: default_active_sewing_line_start_point,
        end_point_attributes: default_active_sewing_line_end_point,
        up_face_attributes: default_active_sewing_line_up_face,
        down_face_attributes: default_active_sewing_line_down_face,
        ...styling
    };

    const full_resolved = {
        primary_attributes: {
            ...default_active_sewing_line_primary_attributes,
            ...resolved.primary_attributes
        },
        other_attributes: {
            ...default_active_sewing_line_other_attributes,
            ...resolved.other_attributes
        },
        middle_point_attributes: {
            ...default_active_sewing_line_middle_point,
            ...resolved.middle_point_attributes
        },
        start_point_attributes: {
            ...default_active_sewing_line_start_point,
            ...resolved.start_point_attributes
        },
        end_point_attributes: {
            ...default_active_sewing_line_end_point,
            ...resolved.end_point_attributes
        },
        up_face_attributes: {
            ...default_active_sewing_line_up_face,
            ...resolved.up_face_attributes
        },
        down_face_attributes: {
            ...default_active_sewing_line_down_face,
            ...resolved.down_face_attributes
        }
    } as const;

    const color_primary_line = full_resolved.primary_attributes.stroke
    const color_primary_line_gradient: Gradient = is_gradient(color_primary_line) ? color_primary_line : [color_primary_line, color_primary_line];

    sl.primary_component.forEach(component => {
        const pos = sl.position(component.line);
        if (!component.has_sewing_line_orientation) {
            pos.reverse();
        }

        r.render_line(
            component.line,
            {
                ...resolved.primary_attributes,
                stroke: [
                    interpolate_colors(
                        color_primary_line_gradient[0],
                        color_primary_line_gradient[1],
                        pos[0]
                    ),
                    interpolate_colors(
                        color_primary_line_gradient[0],
                        color_primary_line_gradient[1],
                        pos[1]
                    )
                ]
            },
            belongs_to_render_groups,
            show_render_groups_on_hover,
            {
                _sewing_line_handedness:
                    component.has_sewing_line_handedness,
                _sewing_line_orientation:
                    component.has_sewing_line_orientation,
                ...get_line_render_data(component.line)
            }
        );
    });

    const color_other_components = full_resolved.other_attributes.stroke
    const color_other_components_gradients: Gradient = is_gradient(color_other_components) ? color_other_components : [color_other_components, color_other_components];

    sl.other_components.forEach(component => {
        const pos = sl.position(component.line);
        if (!component.has_sewing_line_orientation) {
            pos.reverse();
        }

        r.render_line(
            component.line,
            {
                ...resolved.other_attributes,
                stroke: [
                    interpolate_colors(
                        color_other_components_gradients[0],
                        color_other_components_gradients[1],
                        pos[0]
                    ),
                    interpolate_colors(
                        color_other_components_gradients[0],
                        color_other_components_gradients[1],
                        pos[1]
                    )
                ]
            },
            belongs_to_render_groups,
            show_render_groups_on_hover,
            {
                _sewing_line_handedness:
                    component.has_sewing_line_handedness,
                _sewing_line_orientation:
                    component.has_sewing_line_orientation,
                ...get_line_render_data(component.line)
            }
        );
    });

    sl.face_carousel.faceEdges.forEach(
        (edge: FaceEdgeWithPosition) => {
            edge.edge.lines.forEach(fec => {
                const p =
                    Number(fec.standard_handedness) +
                    Number(edge.folded_right) +
                    Number(fec.line.right_handed);

                const upside_down = p % 2 === 0;

                r.render_face_edge_component(
                    fec,
                    upside_down
                        ? full_resolved.down_face_attributes
                        : full_resolved.up_face_attributes,
                    belongs_to_render_groups,
                    show_render_groups_on_hover,
                    {
                        _standard_handedness:
                            fec.standard_handedness,
                        _standard_orientation:
                            fec.standard_orientation,
                        _upside_down: upside_down
                    }
                );
            });
        }
    );

    sl.get_points().filter(p => !sl.has_endpoint(p)).map(p => {
        r.render_point(p, full_resolved.middle_point_attributes, belongs_to_render_groups, show_render_groups_on_hover)
    });

    render_sewing_point(r, sl.p1, full_resolved.start_point_attributes, belongs_to_render_groups, show_render_groups_on_hover);
    render_sewing_point(r, sl.p2, full_resolved.end_point_attributes, belongs_to_render_groups, show_render_groups_on_hover);
}
