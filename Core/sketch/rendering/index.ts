import { SVG_Builder } from "@/Core/files/svg/svg_builder";

import {
    LineRenderAttributes,
    PointRenderAttributes,
} from "@/Core/files/svg/render_attributes";
import { BoundingBox, FiniteGeometry, Polygon, Vector } from "@/Core/geometry";
import { Line } from "@/Core/sketch/line";
import { Point } from "@/Core/sketch/point";
import { Sketch } from "@/Core/sketch/sketch";
import { Json } from "@/Core/types";
import { line_attributes, point_attributes } from "./defaults";

export function render_sketch(
    s: Sketch,
    width: number | null = null,
    height: number | null = null,
    padding: number = 0,
    debug: boolean = false,
): SVG_Builder {
    function if_debug<T>(fn: () => T) {
        if (debug) return fn();
        return null;
    }

    const bb = s.bounding_box();
    const real_render_dimensions = recalculate_render_dimensions(
        width,
        height,
        bb,
    );

    const px_to_unit = (x: number) =>
        (x * real_render_dimensions.bounding_box.width) /
        real_render_dimensions.width;

    const svg = new SVG_Builder(
        real_render_dimensions.width,
        real_render_dimensions.height,
        [
            real_render_dimensions.bounding_box.top_left,
            real_render_dimensions.bounding_box.bottom_right,
        ],
        padding,
    );

    // This doesnt necc cover the whole svg, but _enought_ for out purposes currently
    const offset = new Vector(px_to_unit(padding * 2), px_to_unit(padding * 2));
    svg.render_polygon(
        FiniteGeometry.rectangle(
            real_render_dimensions.bounding_box.top_left.subtract(offset),
            real_render_dimensions.bounding_box.bottom_right.add(offset),
        ),
        {
            fill: "white",
            stroke: null,
        },
        if_debug(() => get_sketch_render_data(s)),
    );

    s.lines().forEach((line) => {
        const lineStyles: Partial<LineRenderAttributes> = {
            ...line_attributes,
            stroke_width: px_to_unit(line_attributes.stroke_width),
        };

        if (line.right_handed) {
            lineStyles.stroke = line_attributes.lh_stroke;
        } else {
            lineStyles.stroke = line_attributes.rh_stroke;
        }

        const shape = line.shape;
        if (shape instanceof Polygon) {
            svg.render_polygon(
                shape,
                lineStyles,
                if_debug(() => get_line_render_data(line)),
            );
        } else {
            svg.render_polyline(
                shape,
                lineStyles,
                if_debug(() => get_line_render_data(line)),
            );
        }
    });

    const pointStyles: Partial<PointRenderAttributes> = {
        ...point_attributes,
        radius: px_to_unit(point_attributes.radius),
        stroke_width: px_to_unit(point_attributes.stroke_width),
    };

    s.points().forEach((pt) => {
        svg.render_point(
            pt,
            pointStyles,
            if_debug(() => get_point_render_data(pt)),
        );
    });

    return svg;
}

export function get_line_render_data(
    line: Line,
    extra_data: Record<string, Json> = {},
) {
    return Object.assign({}, line.data, {
        _length: Math.round(line.length() * 1000) / 1000,
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
    const bb = s.bounding_box();

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
    if (bounding_box.width == 0 || bounding_box.height == 0) {
        const bb_w = bounding_box.width || 1;
        const bb_h = bounding_box.height || 1;
        const bb_center = bounding_box.center().is_finite()
            ? bounding_box.center()
            : Vector.ZERO;
        const offset = new Vector(bb_w / 2, bb_h / 2);
        bounding_box = BoundingBox.from_points([
            bb_center.add(offset),
            bb_center.subtract(offset),
        ]);
    }

    if (bounding_box.height == 0) {
        bounding_box = new BoundingBox(0, 0, 1, 1);
    }

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

    if (source_aspect_ratio < target_aspect_ratio) {
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
