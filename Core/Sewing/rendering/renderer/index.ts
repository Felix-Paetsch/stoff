import { Sewing } from "../../sewing.js";
import Sketch from "../../../StoffLib/sketch.js";
import Point from "../../../StoffLib/point.js";
import Line from "../../../StoffLib/line.js";
import { data_to_serializable } from "@/Core/StoffLib/sketch_methods/rendering_methods/to_dev_svg.js";
import { Vector } from "../../../StoffLib/geometry/classes.js";
import { FaceEdgeComponent } from "../../faceEdge.js";

type PointRenderAttributes = {
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity: number;
    radius: number;
};

type LineRenderAttributes = {
    stroke: string;
    strokeWidth: number;
    opacity: number;
};

type FaceRenderAttributes = {
    fill: string;
    opacity: number;
};

const default_point_attributes: PointRenderAttributes = {
    stroke: "black",
    strokeWidth: 1,
    fill: "white",
    opacity: 1,
    radius: 1,
};

const default_line_attributes: LineRenderAttributes = {
    stroke: "black",
    strokeWidth: 1,
    opacity: 1,
};

type RenderContext = {
    // SketchNumbers => ViewportNumbers
    relative_to_absolute: (x: number, y: number) => [number, number],
    absolute_to_relative: (x: number, y: number) => [number, number],
}
type RenderInstruction = (context: RenderContext) => string;

export default class Renderer {
    private svgMap: Map<Sketch, RenderInstruction[]> = new Map();
    constructor(
        private sewing: Sewing,
    ) {
        this.sewing.sketches.forEach(
            sketch => this.svgMap.set(sketch, [])
        )
    }

    render_point(pt: Point, attributes: Partial<PointRenderAttributes>, data: any = null) {
        this.svgMap.get(pt.sketch)!.push(
            (ctx: RenderContext) => {
                const { stroke, strokeWidth, fill, opacity, radius } = {
                    ...default_point_attributes,
                    // ...pt.attributes,
                    ...attributes
                };
                const [x, y] = ctx.relative_to_absolute(pt.x, pt.y);
                const point_data = data ? this.data_to_string(data) : this.point_data_to_serializable(pt);
                return `<circle cx="${x}" cy="${y}" r="${radius}" stroke="${stroke}" fill="${fill}" opacity="${opacity}" stroke-width="${strokeWidth}"/>` +
                    `<circle cx="${x}" cy="${y}" r="${Math.max(radius, 4)}" stroke="rgba(0,0,0,0)" fill="rgba(0,0,0,0)" stroke-width="${strokeWidth}" x-data="${point_data}" hover_area/>`;
            }
        )
    }

    render_partial_line(line: Line, interval: [number, number], attributes: Partial<LineRenderAttributes>, data: any = null) {
        this.svgMap.get(line.sketch)!.push(
            (ctx: RenderContext) => {
                const { stroke, strokeWidth, opacity } = {
                    ...default_line_attributes,
                    ...attributes
                };
                const line_data = data ? this.data_to_string(data) : this.line_data_to_serializable(line);

                const points = line.get_relative_sample_points_from_to(interval[0], interval[1]);
                const pointsString = points.map((point: Vector) => `${point.x},${point.y}`).join(" ");

                return `<polyline points="${pointsString}" style="fill:none; stroke: ${stroke}; stroke-width: ${strokeWidth}" opacity="${opacity}"/>`
                    + `<polyline points="${pointsString}" style="fill:none; stroke: rgba(0,0,0,0); stroke-width: ${Math.min(strokeWidth, 8)}" opacity="${opacity}" x-data="${line_data}" hover_area/>`;
            }
        )
    }

    render_line(line: Line, attributes: Partial<LineRenderAttributes>, data: any = null) {
        this.render_partial_line(line, [0, 1], attributes, data);
    }

    render_face_edge_component(faceEdgeComponent: FaceEdgeComponent, attributes: Partial<FaceRenderAttributes>, data: any = null) {
        this.svgMap.get(face.sketch)!.push(
            (ctx: RenderContext) => {
                const { stroke, strokeWidth, opacity } = { ...default_face_attributes, ...attributes };
            }
        )
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
            line_data._length = Math.round(line.get_length() * 1000) / 1000;
        }
        return line_data;
    }

    data_to_string(data: any) {
        return JSON.stringify(data).replace(/\\/g, "\\\\").replace(/"/g, "&quot;");
    }
}