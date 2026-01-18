import { Json } from "@/Core/utils/json";
import { Color } from "@/Core/utils/colors";
import { FaceAtlas } from "@/Core/StoffLib/faces/faceAtlas";
import { Face } from "@/Core/StoffLib/faces/face";
import { Sketch } from "@/Core/StoffLib/sketch";
import { Point, PointRenderAttributes } from "@/Core/StoffLib/point";
import { Line, LineRenderAttributes } from "@/Core/StoffLib/line";
import { Sewing } from "@/Core/Sewing/sewing";
import { FaceEdgeComponent } from "@/Core/Sewing/faceEdge";
import { BoundingBox, EPS, Vector } from "@/Core/StoffLib/geometry";
import { default_face_edge_attributes, default_face_render_attributes, default_line_attributes, default_point_attributes } from "./defaults/base";

type RenderInstruction = {
    hover_data: Json,
    belongs_to_render_groups: string[],
    show_render_groups_on_hover: string[],
    render_priority: number,

    render: (this: Renderer, render_attribute_string: string, render_context: RenderContext) => string
}

export type FaceEdgeRenderAttributes = {
    fill: Color;
    opacity: number;
    width: number;
    style: string;
};

export type FaceRenderAttributes = {
    fill: Color;
    opacity: number;
    style: string;
};

export type RenderContext = {
    // SketchNumbers => ViewportNumbers
    relative_to_absolute: (x: number, y: number) => [number, number],
    absolute_to_relative: (x: number, y: number) => [number, number],
    width: number,
    height: number,
    padding: number,
}

export class Renderer {
    private faceAtlas: Map<Sketch, FaceAtlas> = new Map();
    readonly svgMap: Map<Sketch, RenderInstruction[]> = new Map();
    readonly sewing: Sewing;
    readonly stack: string;

    constructor(
        s: Sewing | Sketch,
        public render_step: string | null = null
    ) {
        if (s instanceof Sewing) {
            this.sewing = s;
        } else {
            this.sewing = new Sewing([s]);
        }

        this.sewing.sketches.forEach(
            sketch => this.svgMap.set(sketch, [])
        );
        this.stack = (new Error().stack as string).split("\n").slice(2).map((s) => s.trim()).join("\n");
    }

    get_face_atlas(sketch: Sketch) {
        if (!this.faceAtlas.has(sketch)) {
            this.faceAtlas.set(
                sketch,
                this.sewing.faceAtlases.get(sketch) || FaceAtlas.from_lines(sketch.get_lines())
            );
        }
        return this.faceAtlas.get(sketch)!;
    }

    render_point(
        pt: Point,
        attr: Partial<PointRenderAttributes>,
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
        hover_data: Json = null
    ) {
        const skRenderInstructions = this.svgMap.get(pt.get_sketch());
        if (!skRenderInstructions) { throw new Error("Point doesn't belong to sewing."); }
        skRenderInstructions.push({
            hover_data,
            belongs_to_render_groups,
            show_render_groups_on_hover,
            render_priority: 10,
            render: (ras: string, ctx: RenderContext) => {
                const [x, y] = ctx.relative_to_absolute(pt.x, pt.y);
                const { stroke, strokeWidth, fill, opacity, radius } = {
                    ...default_point_attributes,
                    ...attr
                };

                return `<g ${ras} >
<circle cx="${x}" cy="${y}" r="${Math.max(radius, 4)}" stroke="rgba(0,0,0,0)" fill="rgba(0,0,0,0)" stroke-width="${strokeWidth}"/>;
<circle cx="${x}" cy="${y}" r="${radius}" stroke="${stroke}" fill="${fill}" opacity="${opacity}" stroke-width="${strokeWidth}"/>
</g>`;
            }
        });
    }

    render_partial_line(
        line: Line,
        interval: [number, number],
        attr: Partial<LineRenderAttributes>,
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
        hover_data: Json = null
    ) {
        const skRenderInstructions = this.svgMap.get(line.get_sketch());
        if (!skRenderInstructions) { throw new Error("Line doesn't belong to sewing."); }
        skRenderInstructions.push({
            hover_data,
            belongs_to_render_groups,
            show_render_groups_on_hover,
            render_priority: 8,
            render: (ras: string, ctx: RenderContext) => {
                const points = line.get_absolute_sample_points_from_to(interval[0], interval[1]);
                const pointsString = points.map(
                    (point: Vector) => {
                        const [x, y] = ctx.relative_to_absolute(point.x, point.y);
                        return `${x},${y}`;
                    }
                ).join(" ");

                const { stroke, strokeWidth, opacity } = {
                    ...default_line_attributes,
                    ...attr
                };

                let res: string = `<g ${ras} >`;
                if (typeof stroke === "string") {
                    res += `<polyline points="${pointsString}" style="fill:none; stroke: ${stroke}; stroke-width: ${strokeWidth}" opacity="${opacity}" />`;
                } else {
                    const [stroke1, stroke2] = stroke;
                    const [[x1, y1], [x2, y2]] = (line.get_endpoints() as any).map((e: Point) =>
                        ctx.relative_to_absolute(e.x, e.y)
                    );

                    const gradient_id = `gradient_${Math.random().toString(36).substring(2, 15)}`;
                    res += `<defs>
                        <linearGradient id="${gradient_id}" 
                            x1="${x1}"
                            y1="${y1}"
                            x2="${x2}"
                            y2="${y2}"
                            gradientUnits="userSpaceOnUse"
                            >
                            <stop offset="0%" stop-color="${stroke1}" />
                            <stop offset="100%" stop-color="${stroke2}" />
                        </linearGradient>
                    </defs>
                    <polyline points="${pointsString}" style="fill:none; stroke: url(#${gradient_id}); stroke-width: ${strokeWidth}" opacity="${opacity}" ${ras} />`
                }

                res += `<polyline points="${pointsString}" style="fill:none; stroke: rgba(0,0,0,0); stroke-width: ${Math.max(strokeWidth, 8)}"/>`;
                res += `</g>`;
                return res;
            }
        });
    }

    render_line(
        line: Line,
        attr: Partial<LineRenderAttributes>,
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
        hover_data: Json = null
    ) {
        return this.render_partial_line(
            line,
            [0, 1],
            attr,
            belongs_to_render_groups,
            show_render_groups_on_hover,
            hover_data
        );
    }

    render_face_edge_component(
        faceEdgeComponent: FaceEdgeComponent,
        attributes: Partial<FaceEdgeRenderAttributes>,
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
        hover_data: Json = null
    ) {
        const skRenderInstructions = this.svgMap.get(faceEdgeComponent.line.get_sketch());
        if (!skRenderInstructions) { throw new Error("FaceEdgeComponent doesn't belong to sewing."); }
        skRenderInstructions.push({
            hover_data,
            belongs_to_render_groups,
            show_render_groups_on_hover,
            render_priority: 3,
            render: (ras: string, ctx: RenderContext) => {
                const { fill, opacity, width } = { ...default_face_edge_attributes, ...attributes };

                const points = faceEdgeComponent.line.get_absolute_sample_points();
                const offset_points = faceEdgeComponent.line.offset_sample_points(
                    width,
                    faceEdgeComponent.standard_handedness
                );

                const path = points.concat(
                    offset_points.reverse()
                );
                const pointsString = path.map((point: Vector) => {
                    const [x, y] = ctx.relative_to_absolute(point.x, point.y);
                    return `${x},${y}`;
                }).join(" ")

                return `<polygon points="${pointsString}" style="fill: ${fill}; stroke: none; stroke-width: 0; opacity: ${opacity}" ${ras}/>`;
            }
        });
    }

    render_face(
        face_descriptor: {
            line: Line;
            standard_handedness: boolean
        } | Face,
        attributes: Partial<FaceRenderAttributes> = {},
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
        hover_data: Json = null
    ) {
        if (face_descriptor instanceof Face) {
            this.render_face(
                {
                    line: face_descriptor.get_lines()[0],
                    standard_handedness: face_descriptor.line_handedness(face_descriptor.get_lines()[0])
                },
                attributes,
                belongs_to_render_groups,
                show_render_groups_on_hover,
                hover_data
            );
            return;
        }

        const skRenderInstructions = this.svgMap.get(face_descriptor.line.get_sketch());
        if (!skRenderInstructions) { throw new Error("Face doesn't belong to sewing."); }
        skRenderInstructions.push({
            hover_data,
            belongs_to_render_groups,
            show_render_groups_on_hover,
            render_priority: 0,
            render: (ras: string, ctx: RenderContext) => {
                const sketch = face_descriptor.line.get_sketch();

                const { fill, opacity, style } = {
                    ...default_face_render_attributes, ...attributes
                };

                const fa = this.get_face_atlas(sketch);
                const adjacent = fa.adjacent_faces(face_descriptor.line);

                let face: Face;
                if (!adjacent || !adjacent[1]) {
                    throw new Error("No face found!");
                };

                if (
                    adjacent[0] instanceof Face &&
                    adjacent[0].line_handedness(face_descriptor.line) == face_descriptor.standard_handedness &&
                    !adjacent[0].is_boundary()
                ) {
                    face = adjacent[0];
                } else if (
                    adjacent[1] instanceof Face &&
                    adjacent[1].line_handedness(face_descriptor.line) == face_descriptor.standard_handedness &&
                    !adjacent[1].is_boundary()
                ) {
                    face = adjacent[1];
                } else {
                    throw new Error("No suitable face found!");
                };

                const points = face.point_hull();
                const pointsString = points.map((point: Vector) => {
                    const [x, y] = ctx.relative_to_absolute(point.x, point.y);
                    return `${x},${y}`;
                }).join(" ")

                return `<polygon points="${pointsString}" style="fill: ${fill}; stroke: none; stroke-width: 0; opacity: ${opacity}" ${ras}/>`;
            }
        });
    }

    build_sketch_svg(sketch: Sketch, width: number, height: number, padding: number): string {
        padding = Math.max(padding, 2);
        const _bb: BoundingBox = sketch.get_bounding_box();
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

        const ctx: RenderContext = {
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
            width: width,
            height: height,
            padding: padding,
        }

        const items = this.svgMap.get(sketch)!.sort((a, b) => a.render_priority - b.render_priority).map(
            (instruction: RenderInstruction) => {
                let render_attribute_string: string = ` hover_stuff="true" `;
                render_attribute_string += `x-data="${this.data_to_string(instruction.hover_data)}" `;
                render_attribute_string += `x-belongs_to_render_groups="${this.data_to_string(instruction.belongs_to_render_groups)}" `;
                render_attribute_string += `x-show_render_groups_on_hover="${this.data_to_string(instruction.show_render_groups_on_hover)}" `;

                return instruction.render.bind(this)(render_attribute_string, ctx);
            }
        ).join("\n");

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                ${items}
            </svg>
        `;
    }

    build_all_sketch_svgs(width: number, height: number, padding: number): string[] {
        return Array.from(this.svgMap.keys()).map(
            sketch => this.build_sketch_svg(sketch, width, height, padding)
        );
    }

    data_to_string(data: Json) {
        return JSON.stringify(data).replace(/\\/g, "\\\\").replace(/"/g, "&quot;");
    }

    copy(s: Sewing): Renderer {
        const r = new Renderer(s, this.render_step);
        for (const sketch of s.sketches) {
            r.svgMap.set(sketch, [...this.svgMap.get(sketch)!])
        }
        return r;
    }
}
