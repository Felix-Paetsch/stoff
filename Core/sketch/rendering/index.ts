import { SVG_Builder } from "@/Core/files/svg/svg_builder";

import { default_line_attributes, default_point_attributes } from "./defaults";
import {
    LineRenderAttributes,
    PointRenderAttributes,
} from "@/Core/files/svg/render_attributes";
import { Sketch } from "@/Core/sketch/sketch";
import { Polygon } from "@/Core/geometry/shapes/polygon";
import { is_polygon } from "@/Core/geometry/shapes";
import { Line } from "@/Core/sketch/line";
import { Json } from "@/Core/utils/json";
import { Point } from "@/Core/sketch/point";
import { BoundingBox } from "@/Core/geometry";

export type SketchRenderStyling = {
    lines: Partial<LineRenderAttributes>;
    points: Partial<PointRenderAttributes>;
    faces: Partial<LineRenderAttributes>;
};

export function render_debug_sketch(
    s: Sketch,
    styles: Partial<SketchRenderStyling> = {},
    width: number | null = null,
    height: number | null = null,
    padding: number = 0,
): SVG_Builder {
    const bb = s.get_bounding_box();
    const real_render_dimensions = recalculate_render_dimensions(
        width,
        height,
        bb,
    );

    const svg = new SVG_Builder(
        real_render_dimensions.width,
        real_render_dimensions.height,
        [
            real_render_dimensions.bounding_box.top_right,
            real_render_dimensions.bounding_box.top_left,
        ],
        padding,
    );

    svg.render_polygon(
        new Polygon([
            bb.top_left,
            bb.top_right,
            bb.bottom_right,
            bb.bottom_left,
        ]),
        {
            fill: "white",
            stroke: null,
        },
        get_sketch_render_data(s),
    );

    let lineStyles: LineRenderAttributes = default_line_attributes;
    if (styles.lines) {
        lineStyles = {
            ...default_line_attributes,
            ...styles.lines,
        };

        if (Array.isArray(lineStyles.stroke)) {
            lineStyles.stroke = svg.create_gradient(lineStyles.stroke, 2);
        }
    }

    s.get_lines().forEach((line) => {
        const shape = line.shape;
        if (is_polygon(shape)) {
            svg.render_polygon(shape, lineStyles, get_line_render_data(line));
        } else {
            svg.render_polyline(shape, lineStyles, get_line_render_data(line));
        }
    });

    let pointStyles: PointRenderAttributes = default_point_attributes;
    if (styles.points) {
        pointStyles = {
            ...default_point_attributes,
            ...styles.points,
        };
    }

    s.get_points().forEach((pt) => {
        svg.render_point(pt, pointStyles, get_point_render_data(pt));
    });

    return svg;
}

export function render_sketch(
    s: Sketch,
    styles: Partial<SketchRenderStyling> = {},
    width: number | null = null,
    height: number | null = null,
    padding: number = 0,
): SVG_Builder {
    const bb = s.get_bounding_box();
    const real_render_dimensions = recalculate_render_dimensions(
        width,
        height,
        bb,
    );

    const svg = new SVG_Builder(
        real_render_dimensions.width,
        real_render_dimensions.height,
        [
            real_render_dimensions.bounding_box.top_right,
            real_render_dimensions.bounding_box.top_left,
        ],
        padding,
    );

    let lineStyles: LineRenderAttributes = default_line_attributes;
    if (styles.lines) {
        lineStyles = {
            ...default_line_attributes,
            ...styles.lines,
        };

        if (Array.isArray(lineStyles.stroke)) {
            lineStyles.stroke = svg.create_gradient(lineStyles.stroke, 2);
        }
    }

    s.get_lines().forEach((line) => {
        const shape = line.shape;
        if (is_polygon(shape)) {
            svg.render_polygon(shape, lineStyles);
        } else {
            svg.render_polyline(shape, lineStyles);
        }
    });

    let pointStyles: PointRenderAttributes = default_point_attributes;
    if (styles.points) {
        pointStyles = {
            ...default_point_attributes,
            ...styles.points,
        };
    }

    s.get_points().forEach((pt) => {
        svg.render_point(pt, pointStyles);
    });

    return svg;
}

export function get_line_render_data(
    line: Line,
    extra_data: Record<string, Json> = {},
) {
    return Object.assign({}, line.data, {
        _length: Math.round(line.get_length() * 1000) / 1000,
        _right_handed: line.right_handed,
        ...extra_data,
    });
}

export function get_point_render_data(
    point: Point,
    extra_data: Record<string, Json> = {},
) {
    return Object.assign({}, point.data, {
        _x: Math.round(point.x * 1000) / 1000,
        _y: Math.round(point.y * 1000) / 1000,
        ...extra_data,
    });
}

export function get_sketch_render_data(
    s: Sketch,
    extra_data: Record<string, Json> = {},
) {
    const bb = s.get_bounding_box();

    return Object.assign({}, s.data, {
        _x: bb.min_x,
        _y: bb.min_y,
        _width: bb.width,
        _height: bb.height,
        ...extra_data,
    });
}

function recalculate_render_dimensions(
    width: number | null,
    height: number | null,
    bounding_box: BoundingBox,
): {
    width: number;
    height: number;
    bounding_box: BoundingBox;
} {
    if (width == null && height == null) {
        return {
            width: bounding_box.width,
            height: bounding_box.height,
            bounding_box: bounding_box,
        };
    }

    if (height == null) {
        return {
            width: width!,
            height: (width! * bounding_box.height) / bounding_box.width,
            bounding_box: bounding_box,
        };
    }

    if (width == null) {
        return {
            height: height!,
            width: (height! * bounding_box.width) / bounding_box.height,
            bounding_box: bounding_box,
        };
    }

    let source_aspect_ratio = bounding_box.width / bounding_box.height;
    const target_aspect_ratio = width / height;
    if (Number.isNaN(source_aspect_ratio)) {
        source_aspect_ratio = target_aspect_ratio;
    }

    if (source_aspect_ratio > target_aspect_ratio) {
        const delta_w_source =
            target_aspect_ratio * bounding_box.height - bounding_box.width;
        return {
            width,
            height,
            bounding_box: new BoundingBox(
                bounding_box.min_x - delta_w_source / 2,
                bounding_box.min_y,
                bounding_box.max_x + delta_w_source / 2,
                bounding_box.max_y,
            ),
        };
    }

    const delta_h_source =
        (1 / target_aspect_ratio) * bounding_box.width - bounding_box.height;
    return {
        width,
        height,
        bounding_box: new BoundingBox(
            bounding_box.min_x,
            bounding_box.min_y - delta_h_source / 2,
            bounding_box.max_x,
            bounding_box.max_y + delta_h_source / 2,
        ),
    };
}
