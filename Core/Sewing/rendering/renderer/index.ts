import { Sewing } from "../../sewing.js";
import Sketch from "../../../StoffLib/sketch.js";
import Point from "../../../StoffLib/point.js";
import Line from "../../../StoffLib/line.js";
import { data_to_serializable } from "@/Core/StoffLib/sketch_methods/rendering_methods/to_dev_svg.js";
import { BoundingBox, EPS, Vector } from "../../../StoffLib/geometry.js";
import { FaceEdgeComponent } from "../../faceEdge.js";
import offset_sample_points from "@/Core/StoffLib/line_methods/offset_sample_points.js";
import { SewingLine } from "../../sewingLine.js";
import { default_point_attributes, default_sewing_line_other_attributes, default_sewing_line_primary_attributes, default_sewing_point_attributes } from "./defaults.js";
import { default_line_attributes } from "./defaults.js";
import { default_face_attributes } from "./defaults.js";
import { SewingPoint } from "../../sewingPoint.js";
import { FaceCarousel, FaceEdgeWithPosition } from "../../faceCarousel.js";

export type PointRenderAttributes = {
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity: number;
    radius: number;
};

export type LineRenderAttributes = {
    stroke: string;
    strokeWidth: number;
    opacity: number;
};

export type FaceRenderAttributes = {
    fill: string;
    opacity: number;
    width: number;
    style: string;
};

type RenderContext = {
    // SketchNumbers => ViewportNumbers
    relative_to_absolute: (x: number, y: number) => [number, number],
    absolute_to_relative: (x: number, y: number) => [number, number],
}
type RenderInstruction = {
    do: (context: RenderContext) => string;
    priority: number;
}

export default class Renderer {
    private svgMap: Map<Sketch, RenderInstruction[]> = new Map();
    constructor(
        private sewing: Sewing,
        public render_step: string | null = null
    ) {
        this.sewing.sketches.forEach(
            sketch => this.svgMap.set(sketch, [])
        )
    }

    render_sketch(sketch: Sketch, width: number, height: number, padding: number) {
        padding = Math.max(padding, 2);
        const _bb: BoundingBox = (sketch as any).get_bounding_box();
        const bb = _bb.with_min_bb([EPS.COARSE, EPS.COARSE]);

        // Compute centered, aspect-ratio-preserving transform with padding
        const usableWidth = Math.max(0, width - 2 * padding);
        const usableHeight = Math.max(0, height - 2 * padding);
        const scale = Math.max(0, Math.min(usableWidth / bb.width, usableHeight / bb.height));
        const safeScale = scale === 0 ? 1 : scale;

        // Centers
        const bbCenter = bb.center();

        const targetCenterX = padding + usableWidth / 2;
        const targetCenterY = padding + usableHeight / 2;

        const ctx = {
            relative_to_absolute: (x: number, y: number): [number, number] => {
                const X = targetCenterX + (x - bbCenter.x) * safeScale;
                const Y = targetCenterY + (y - bbCenter.y) * safeScale;
                return [X, Y];
            },
            absolute_to_relative: (X: number, Y: number): [number, number] => {
                const x = bbCenter.x + (X - targetCenterX) / safeScale;
                const y = bbCenter.y + (Y - targetCenterY) / safeScale;
                return [x, y];
            },
        }

        const items = this.svgMap.get(sketch)!.sort((a, b) => b.priority - a.priority).map(
            (instruction: RenderInstruction) => instruction.do(ctx)
        ).join("\n");
        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="stripes" width="8" height="8" patternUnits="userSpaceOnUse">
                    <rect width="8" height="8" fill="white" />
                    <path d="M0,0 L8,8" stroke="red" stroke-width="2" />
                    </pattern>
                </defs>
                ${items}
            </svg>
        `;
    }

    all_rendered_sketches(width: number, height: number, padding: number) {
        return Array.from(this.svgMap.keys()).map(
            sketch => this.render_sketch(sketch, width, height, padding)
        );
    }

    render_point(pt: Point, attributes: Partial<PointRenderAttributes> = {}, data: any = null) {
        this.svgMap.get(pt.sketch)!.push(
            {
                do: (ctx: RenderContext) => {
                    const { stroke, strokeWidth, fill, opacity, radius } = {
                        ...default_point_attributes,
                        // ...pt.attributes,
                        ...attributes
                    };
                    const [x, y] = ctx.relative_to_absolute(pt.x, pt.y);
                    const point_data = data || this.point_data_to_serializable(pt);
                    return `<circle cx="${x}" cy="${y}" r="${radius}" stroke="${stroke}" fill="${fill}" opacity="${opacity}" stroke-width="${strokeWidth}"/>` +
                        `<circle cx="${x}" cy="${y}" r="${Math.max(radius, 4)}" stroke="rgba(0,0,0,0)" fill="rgba(0,0,0,0)" stroke-width="${strokeWidth}" x-data="${this.data_to_string(point_data)}" hover_area="true"/>`;
                },
                priority: 0
            }
        )
    }

    render_partial_line(line: Line, interval: [number, number], attributes: Partial<LineRenderAttributes>, data: any = null) {
        this.svgMap.get(line.sketch)!.push(
            {
                do: (ctx: RenderContext) => {
                    const { stroke, strokeWidth, opacity } = {
                        ...default_line_attributes,
                        ...attributes
                    };
                    const line_data = data || this.line_data_to_serializable(line);

                    const points = line.get_absolute_sample_points_from_to(interval[0], interval[1]);
                    const pointsString = points.map(
                        (point: Vector) => {
                            const [x, y] = ctx.relative_to_absolute(point.x, point.y);
                            return `${x},${y}`;
                        }
                    ).join(" ");

                    return `<polyline points="${pointsString}" style="fill:none; stroke: ${stroke}; stroke-width: ${strokeWidth}" opacity="${opacity}"/>`
                        + `<polyline points="${pointsString}" style="fill:none; stroke: rgba(0,0,0,0); stroke-width: ${Math.max(strokeWidth, 8)}" opacity="${opacity}" x-data="${this.data_to_string(line_data)}" hover_area="true"/>`;
                },
                priority: 50
            }
        )
    }

    render_line(line: Line, attributes: Partial<LineRenderAttributes>, data: any = null) {
        this.render_partial_line(line, [0, 1], attributes, data);
    }

    render_sewing_line(
        line: SewingLine,
        primary_attributes: Partial<LineRenderAttributes>,
        other_attributes: Partial<LineRenderAttributes>,
        data: any = null
    ) {
        line.primary_component.forEach(component => {
            this.render_line(component.line, primary_attributes, data);
        });
        line.other_components.forEach(component => {
            this.render_line(component.line, other_attributes, data);
        });
    }

    render_sewing_point(point: SewingPoint, attributes: Partial<PointRenderAttributes>, data: any = null) {
        point.points.forEach(pt => {
            this.render_point(pt, attributes, data);
        })
    }

    render_face_edge_component(faceEdgeComponent: FaceEdgeComponent, attributes: Partial<FaceRenderAttributes>, upside_down: boolean, data: any = null) {
        this.svgMap.get(faceEdgeComponent.line.sketch)!.push(
            {
                do: (ctx: RenderContext) => {
                    const { fill, opacity, width } = { ...default_face_attributes, ...attributes };

                    const points = faceEdgeComponent.line.get_absolute_sample_points();
                    const offset_points = offset_sample_points(
                        points,
                        width,
                        faceEdgeComponent.line.right_handed == faceEdgeComponent.standard_handedness
                    );

                    const path = points.concat(
                        offset_points.reverse()
                    );

                    const pointsString = path.map((point: Vector) => {
                        const [x, y] = ctx.relative_to_absolute(point.x, point.y);
                        return `${x},${y}`;
                    }).join(" ");

                    if (!data) { data = {} }
                    if (typeof data === "object") {
                        data = Object.assign({}, data, {
                            _standard_handedness: faceEdgeComponent.standard_handedness,
                            _standard_orientation: faceEdgeComponent.standard_orientation,
                            _upside_down: upside_down
                        });
                    }

                    const fill2 = upside_down ? "red" : "green";

                    return `<polygon points="${pointsString}" style="fill: ${fill2}; stroke: none; stroke-width: 0; opacity: ${opacity}" x-data="${this.data_to_string(data)}" hover_area="true"/>`;
                },
                priority: 100
            }
        )
    }

    render_face_carousel(faceCarousel: FaceCarousel, attributes: Partial<FaceRenderAttributes>, data: any = null) {
        faceCarousel.faceEdges.forEach((edge: FaceEdgeWithPosition) => {
            edge.edge.lines.forEach((fec) => {
                const p = Number(fec.standard_handedness) + Number(edge.folded_right) + Number(fec.line.right_handed);

                this.render_face_edge_component(
                    fec,
                    attributes,
                    p % 2 === 1,
                    data
                );
            })
        })
    }

    point_data_to_serializable(point: Point) {
        const point_data = data_to_serializable(point.data);
        if (typeof point_data === "object") {
            point_data._x = Math.round(point.x * 1000) / 1000;
            point_data._y = Math.round(point.y * 1000) / 1000;
        }
        return point_data;
    }

    line_data_to_serializable(line: Line) {
        const line_data = data_to_serializable(line.data);
        if (typeof line_data === "object") {
            return {
                _length: Math.round(line.get_length() * 1000) / 1000,
                _right_handed: line.right_handed,
                ...line_data
            }
        }
        return line_data;
    }

    data_to_string(data: any) {
        return JSON.stringify(data).replace(/\\/g, "\\\\").replace(/"/g, "&quot;");
    }

    render_sketches(
        point_attributes: Partial<PointRenderAttributes> = {},
        line_attributes: Partial<LineRenderAttributes> = {}
    ) {
        this.sewing.sketches.forEach(sketch => {
            sketch.get_lines().forEach((line: Line) => {
                this.render_line(line, {
                    ...default_line_attributes,
                    ...line_attributes
                });
            })
            sketch.get_points().forEach((point: Point) => {
                this.render_point(point, {
                    ...default_point_attributes,
                    ...point_attributes
                });
            })
        })
    }

    render_sewing(
        point_attributes: Partial<PointRenderAttributes> = {},
        primary_line_attributes: Partial<LineRenderAttributes> = {},
        other_line_attributes: Partial<LineRenderAttributes> = {}
    ) {
        this.sewing.get_sewing_lines().forEach(line => {
            this.render_sewing_line(line, {
                ...default_sewing_line_primary_attributes,
                ...primary_line_attributes
            }, {
                ...default_sewing_line_other_attributes,
                ...other_line_attributes
            });
        })
        this.sewing.get_sewing_points().forEach(point => {
            this.render_sewing_point(point, {
                ...default_sewing_point_attributes,
                ...point_attributes
            });
        })
    }
}