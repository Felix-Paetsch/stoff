import {
    BoundingBox,
    FiniteGeometry,
    LinearTransform,
    Polygon,
    Vector,
} from "@/Core/geometry";
import { Line, Point, Sketch } from "@/Core/sketch";
import { SVG_Builder } from "@/Core/svg";
import { Json } from "@/Core/utils";

import {
    compute_line_render_attributes,
    compute_point_render_attributes,
} from "./get_render_attributes";

export type RenderSketchArgs = {
    width?: number;
    height?: number;
    padding?: number;
};

export function render(s: Sketch, args: RenderSketchArgs = {}): SVG_Builder {
    return render_sketch_maybe_debug(s, args, false);
}

export function render_dev(
    s: Sketch,
    args: RenderSketchArgs = {},
): SVG_Builder {
    return render_sketch_maybe_debug(s, args, true);
}

function render_sketch_maybe_debug(
    s: Sketch,
    args: RenderSketchArgs = {},
    debug: boolean,
): SVG_Builder {
    function if_debug<T>(fn: () => T) {
        if (debug) return fn();
        return null;
    }

    const sketch_bounding_box = s.bounding_box();
    const sketch_render_box = compute_sketch_render_box(
        args.width ?? null,
        args.height ?? null,
        sketch_bounding_box,
    );

    if (!args.width) {
        args.width = sketch_render_box.width;
    }
    if (!args.height) {
        args.height = sketch_render_box.height;
    }
    if (!args.padding) {
        args.padding = 5;
    }

    const render_attributes_scale = 0.5;
    const sketch_vec_to_svg_vec = LinearTransform.affine_orthogonal(
        [sketch_bounding_box.top_left, sketch_bounding_box.top_right],
        [sketch_render_box.top_left, sketch_render_box.top_right],
    );

    const padding = args.padding ?? 0;
    const svg = new SVG_Builder(
        args.width!,
        args.height!,
        [new Vector(0, 0), new Vector(args.width, args.height)],
        padding,
    );

    svg.render_polygon(
        FiniteGeometry.rectangle(
            sketch_render_box.top_left,
            sketch_render_box.bottom_right,
        ),
        {
            fill: "white",
            stroke: null,
        },
        if_debug(() => get_sketch_render_data(s)),
    );

    s.lines().forEach((line) => {
        const line_attributes = compute_line_render_attributes(line);
        const lineStyles: Partial<SVG_Builder.LineRenderAttributes> = {
            ...line_attributes,
            stroke_width:
                line_attributes.stroke_width * render_attributes_scale,
        };

        const shape = line.shape.map((v) => sketch_vec_to_svg_vec(v));
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

    s.points().forEach((pt) => {
        const point_attributes = compute_point_render_attributes(pt);
        const pointStyles: Partial<SVG_Builder.PointRenderAttributes> = {
            ...point_attributes,
            radius: point_attributes.radius * render_attributes_scale,
            stroke_width:
                point_attributes.stroke_width * render_attributes_scale,
        };

        svg.render_point(
            sketch_vec_to_svg_vec(pt.vec),
            pointStyles,
            if_debug(() => get_point_render_data(pt)),
        );
    });

    return svg;
}

export function get_line_render_data(
    line: Line,
    extra_data: Record<string, Json> = {},
): string {
    return stringify_record(
        Object.assign({}, line.data, {
            _length: Math.round(line.length() * 1000) / 1000,
            _right_handed: line.right_handed,
            ...extra_data,
        }),
    );
}

export function get_point_render_data(
    point: Point,
    extra_data: Record<string, Json> = {},
): string {
    return stringify_record(
        Object.assign({}, point.data, {
            _x: Math.round(point.vec.x * 1000) / 1000,
            _y: Math.round(point.vec.y * 1000) / 1000,
            ...extra_data,
        }),
    );
}

export function get_sketch_render_data(
    s: Sketch,
    extra_data: Record<string, Json> = {},
): string {
    const bb = s.bounding_box();

    return stringify_record(
        Object.assign({}, s.data, {
            _x: bb.min_x,
            _y: bb.min_y,
            _width: bb.width,
            _height: bb.height,
            ...extra_data,
        }),
    );
}

type StringRecordValue = string | number;
type StringRecord = Record<string, StringRecordValue>;

function sortKeysForStringRecord(keys: string[]): string[] {
    return [...keys].sort((a, b) => {
        const aIsUnderscore = a.startsWith("_");
        const bIsUnderscore = b.startsWith("_");

        if (aIsUnderscore !== bIsUnderscore) {
            return aIsUnderscore ? 1 : -1;
        }

        return a.localeCompare(b);
    });
}

export function stringify_record(
    record: StringRecord,
    space: number = 2,
): string {
    const sorted: StringRecord = {};

    for (const key of sortKeysForStringRecord(Object.keys(record))) {
        sorted[key] = record[key]!;
    }

    return JSON.stringify(sorted, null, space);
}

function compute_sketch_render_box(
    width: number | null,
    height: number | null,
    bounding_box: BoundingBox,
): BoundingBox {
    const sourceWidth = bounding_box.width;
    const sourceHeight = bounding_box.height;
    const aspectRatio = sourceWidth / sourceHeight;

    const targetWidth = width === 0 ? null : width;
    const targetHeight = height === 0 ? null : height;

    if (targetWidth == null && targetHeight == null) {
        return new BoundingBox(0, 0, sourceWidth, sourceHeight);
    }

    if (targetWidth != null && targetHeight == null) {
        const computedHeight = targetWidth / aspectRatio;
        return new BoundingBox(0, 0, targetWidth, computedHeight);
    }

    if (targetWidth == null && targetHeight != null) {
        const computedWidth = targetHeight * aspectRatio;
        return new BoundingBox(0, 0, computedWidth, targetHeight);
    }

    const scale = Math.min(
        targetWidth! / sourceWidth,
        targetHeight! / sourceHeight,
    );

    const renderWidth = sourceWidth * scale;
    const renderHeight = sourceHeight * scale;

    const offsetX = (targetWidth! - renderWidth) / 2;
    const offsetY = (targetHeight! - renderHeight) / 2;

    return new BoundingBox(
        offsetX,
        offsetY,
        offsetX + renderWidth,
        offsetY + renderHeight,
    );
}
