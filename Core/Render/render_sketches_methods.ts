import { Sketch } from "@/Core/StoffLib/sketch";
import { Line, LineRenderAttributes } from "@/Core/StoffLib/line";
import { Json } from "@/Core/utils/json";
import { Point, PointRenderAttributes } from "@/Core/StoffLib/point";
import { FaceRenderAttributes, Renderer } from "./renderer";
import { default_line_attributes, default_point_attributes } from "./defaults/base";

export type SketchRenderStyling = {
    lines: Partial<LineRenderAttributes>,
    points: Partial<PointRenderAttributes>,
    faces: Partial<FaceRenderAttributes>
}

export function render_sketches(r: Renderer, styles: Partial<SketchRenderStyling> = {}) {
    r.sewing.sketches.forEach(s => {
        render_sketch(r, s, styles);
    });
}

export function render_sketch(r: Renderer, s: Sketch, styles: Partial<SketchRenderStyling> = {}) {
    r.render_bg(
        s, ["base"], [],
        get_sketch_render_data(s)
    );

    let lineStyles: LineRenderAttributes | null = null;
    if (styles.lines) {
        lineStyles = {
            ...default_line_attributes,
            ...styles.lines
        }
    }

    s.get_lines().forEach(line => {
        r.render_partial_line(
            line,
            [0, 1],
            lineStyles ? lineStyles : line.get_attributes(),
            ["base"],
            [],
            get_line_render_data(line)
        )
    });

    let pointStyles: PointRenderAttributes | null = null;
    if (styles.points) {
        pointStyles = {
            ...default_point_attributes,
            ...styles.points
        }
    }

    s.get_points().forEach(pt => {
        r.render_point(
            pt,
            pointStyles ? pointStyles : pt.get_attributes(),
            ["base"],
            [],
            get_point_render_data(pt)
        )
    });

    r.get_face_atlas(s).faces.forEach(f => {
        r.render_face(
            f,
            styles.faces || {},
            ["base"],
            [],
            {
                _area: f.area()
            }
        );
    });
}

export function get_line_render_data(line: Line, extra_data: Record<string, Json> = {}) {
    return Object.assign({}, line.data, {
        _length: Math.round(line.get_length() * 1000) / 1000,
        _right_handed: line.right_handed,
        ...(extra_data),
    });
}


export function get_point_render_data(point: Point, extra_data: Record<string, Json> = {}) {
    return Object.assign({}, point.data, {
        _x: Math.round(point.x * 1000) / 1000,
        _y: Math.round(point.y * 1000) / 1000,
        ...(extra_data),
    });
}

export function get_sketch_render_data(s: Sketch, extra_data: Record<string, Json> = {}) {
    const bb = s.get_bounding_box();

    return Object.assign({}, s.data, {
        _x: bb.min_x,
        _y: bb.min_y,
        _width: bb.width,
        _height: bb.height,
        ...(extra_data),
    });
}
