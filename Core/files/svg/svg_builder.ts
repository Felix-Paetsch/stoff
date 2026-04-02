import { unique_string } from "@/Core/utils/unique";
import { Vector, ZERO } from "../../geometry";
import { Polygon } from "../../geometry/shapes/polygon";
import { Polyline } from "../../geometry/shapes/polyline";
import { Json } from "../../utils/json";
import {
    defaultLineRenderAttributes,
    defaultPointRenderAttributes,
    defaultPolygonRenderAttributes,
    defaultTextRenderAttributes,
    LineRenderAttributes,
    PointRenderAttributes,
    PolygonRenderAttributes,
    TextRenderAttributes,
} from "./render_attributes";
import { colorToRgb, Gradient } from "@/Core/colors";

export type RenderGroupData = {
    belongs_to_render_groups: string[];
    show_render_groups_on_hover: string[];
    hide_render_groups_on_hover: string[];
};

export class SVGGradient {
    readonly id: string;
    constructor(
        readonly gradient: Gradient,
        readonly segments: number = 1,
    ) {
        this.id = `#gradient_${unique_string()}`;
    }

    segment_ids(): string[] {
        const res: string[] = [];

        for (let i = 0; i < this.segments; i++) {
            res.push(`${this.id}_${i}`);
        }

        return res;
    }

    gradient_segments(): Gradient[] {
        throw new Error();
    }
}

type RenderInstruction = {
    render: (
        compute_render_group_css: (
            r?: Partial<RenderGroupData> | null,
            hover_data?: Json,
        ) => string,
    ) => string;
    render_priority: number;
};

export class SVG_Builder {
    protected render_instructions: RenderInstruction[] = [];
    constructor(
        public width: number = 100,
        public height: number = 100,
        public viewbox: [Vector, Vector] = [ZERO, new Vector(100, 100)],
        public padding: number = 0,
    ) {}

    render_text(
        text: string,
        position: Vector,
        attributes: Partial<TextRenderAttributes> = {},
        data: Json = null,
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
    ) {
        const full_attributes = {
            ...defaultTextRenderAttributes,
            ...attributes,
        };
        this.custom((crg) => {
            const ras = crg(
                {
                    belongs_to_render_groups,
                    show_render_groups_on_hover,
                },
                data,
            );

            return `
<text ${ras} x="${position.x}" y="${position.y}"
      font-family="${escapeXml(full_attributes.font_family)}"
      font-size="${full_attributes.font_size}"
      fill="${colorToRgb(full_attributes.fill)}"
      font-weight="${full_attributes.font_weight}"
      text-anchor="${full_attributes.text_anchor}">${escapeXml(text)}</text>`;
        }, full_attributes.render_priority);
    }

    render_point(
        position: Vector,
        attributes: Partial<PointRenderAttributes> = {},
        data: Json = null,
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
    ) {
        const full_attributes = {
            ...defaultPointRenderAttributes,
            ...attributes,
        };
        this.custom((crg) => {
            const ras = crg(
                {
                    belongs_to_render_groups,
                    show_render_groups_on_hover,
                },
                data,
            );

            const strokeString = full_attributes.stroke
                ? `stroke="${colorToRgb(full_attributes.stroke)}" stroke-width="${full_attributes.stroke_width}"`
                : 'stroke="none"';
            const fillString = full_attributes.fill
                ? `stroke="${colorToRgb(full_attributes.fill)}"`
                : 'fill="none"';

            return `<g ${ras} >
<circle cx="${position.x}" cy="${position.y}" r="${Math.max(full_attributes.radius, 4)}" stroke="rgba(0,0,0,0)" fill="rgba(0,0,0,0)" stroke-width="${full_attributes.stroke_width}"/>;
<circle cx="${position.x}" cy="${position.y}" r="${full_attributes.radius}" ${strokeString} ${fillString} opacity="${full_attributes.opacity}"/>
</g>`;
        }, full_attributes.render_priority);
    }

    render_polyline(
        line: Polyline,
        attributes: Partial<LineRenderAttributes> = {},
        data: Json = null,
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
    ) {
        const full_attributes = {
            ...defaultLineRenderAttributes,
            ...attributes,
        };

        this.custom((crg) => {
            const ras = crg(
                {
                    belongs_to_render_groups,
                    show_render_groups_on_hover,
                },
                data,
            );

            let pointsString = vectors_to_string(line.verticies);

            let res: string = `<g ${ras} >`;
            if (!full_attributes.stroke) {
            } else if (typeof full_attributes.stroke == "string") {
                res += `<polyline points="${pointsString}" style="fill:none; stroke: ${colorToRgb(full_attributes.stroke)}; stroke-width: ${full_attributes.stroke_width}" opacity="${full_attributes.opacity}" />`;
            } else {
                let gradient: SVGGradient;
                if (!(full_attributes.stroke instanceof SVGGradient)) {
                    gradient = this.create_gradient(full_attributes.stroke, 1);
                } else {
                    gradient = full_attributes.stroke;
                }

                const subgradients = gradient.segment_ids();

                for (let i = 0; i < gradient.segments; i++) {
                    const subline = line.slice(
                        i / gradient.segments,
                        (i + 1) / gradient.segments,
                    );
                    const sublinePoints = vectors_to_string(subline.verticies);
                    const subgradient = subgradients[i]!;

                    res += `<polyline points="${sublinePoints}" style="fill:none; stroke: url(${subgradient}); stroke-width: ${full_attributes.stroke_width}" opacity="${full_attributes.opacity}" />`;
                }
            }
            res += `<polyline points="${pointsString}" style="fill:none; stroke: rgba(0,0,0,0); stroke-width: ${Math.max(full_attributes.stroke_width, 4)}"/>`;
            res += `</g>`;

            return res;
        }, full_attributes.render_priority);
    }

    render_polygon(
        gon: Polygon,
        attributes: Partial<PolygonRenderAttributes> = {},
        data: Json = null,
        belongs_to_render_groups: string[] = ["base"],
        show_render_groups_on_hover: string[] = [],
    ) {
        const full_attributes = {
            ...defaultPolygonRenderAttributes,
            ...attributes,
        };

        this.custom((crg) => {
            const ras = crg(
                {
                    belongs_to_render_groups,
                    show_render_groups_on_hover,
                },
                data,
            );

            let pointsString = vectors_to_string(gon.verticies);

            let fillString: string;

            if (!full_attributes.fill) {
                fillString = 'fill="none"';
            } else if (typeof full_attributes.fill == "string") {
                fillString = `fill="${colorToRgb(full_attributes.fill)}"`;
            } else if (full_attributes.fill instanceof SVGGradient) {
                fillString = `fill="url(${full_attributes.fill.id})`;
            } else {
                const grad = this.create_gradient(full_attributes.fill);
                fillString = `fill="url(${grad.id})`;
            }

            let res: string = `<g ${ras} >`;
            res += `<polygon points="${pointsString}" stroke="none" ${fillString} opacity="${full_attributes.opacity}" />`;
            res += `<polygon points="${pointsString}" style="fill:none; stroke: rgba(0,0,0,0); stroke-width: ${Math.max(full_attributes.stroke_width, 4)}"/>`;
            res += `</g>`;

            this.render_polyline(
                gon.to_polyline(),
                full_attributes,
                data,
                belongs_to_render_groups,
                show_render_groups_on_hover,
            );

            return res;
        }, full_attributes.render_priority);
    }

    create_gradient(g: Gradient, segments: number = 1): SVGGradient {
        const svgGradient = new SVGGradient(g, segments);

        const segment_ids = svgGradient.segment_ids();
        const segment_gradients = svgGradient.gradient_segments();

        this.custom(() => {
            const full = `<linearGradient id="${svgGradient.id}">
      <stop offset="0%" stop-color="${svgGradient.gradient[0]}" />
      <stop offset="100%" stop-color="${svgGradient.gradient[1]}" />
    </linearGradient>`;

            const segments = segment_gradients
                .map((g, i) => {
                    return `<linearGradient id="${segment_ids[i]!}">
      <stop offset="0%" stop-color="${g[0]}" />
      <stop offset="100%" stop-color="${g[1]}" />
    </linearGradient>`;
                })
                .join("");

            return segments + full;
        }, Infinity);

        return svgGradient;
    }

    custom(
        render: (
            compute_render_group_css: (
                r?: Partial<RenderGroupData> | null,
                hover_data?: Json,
            ) => string,
        ) => string,
        render_priority: number = 0,
    ) {
        this.render_instructions.push({
            render,
            render_priority,
        });
    }

    svg(
        width: number | null = null,
        height: number | null = null,
        viewbox: [Vector, Vector] | null = null,
        padding: number | null = null,
    ) {
        width = width ?? this.width;
        height = height ?? this.height;
        viewbox = viewbox ?? this.viewbox;
        padding = padding ?? this.padding;

        const new_viewbox = recalculate_viewbox_with_padding(
            width,
            height,
            viewbox,
            padding,
        );

        this.render_instructions.sort(
            (a, b) => a.render_priority - b.render_priority,
        );

        const items = this.render_instructions.map((r) => {
            r.render(compute_render_group_css);
        });

        let border = "";
        if (padding) {
            const outer_rect = vectors_to_string([
                new_viewbox[0],
                new Vector(new_viewbox[0].x, new_viewbox[1].y),
                new_viewbox[1],
                new Vector(new_viewbox[0].y, new_viewbox[1].x),
            ]);
            const inner_rect = vectors_to_string([
                viewbox[0],
                new Vector(viewbox[0].x, viewbox[1].y),
                viewbox[1],
                new Vector(viewbox[1].x, viewbox[0].y),
            ]);
            border = `<path d="M ${outer_rect} Z
                    M ${inner_rect} Z" 
                    fill="white" 
                    fill-rule="evenodd" />`;
        }

        const view = [
            new_viewbox[0].x,
            new_viewbox[0].y,
            new_viewbox[1].x - new_viewbox[0].x,
            new_viewbox[1].y - new_viewbox[0].y,
        ]
            .map(float_to_string)
            .join(" ");

        return `
            <svg width="${width}" height="${height}" viewBox="${view}" xmlns="http://www.w3.org/2000/svg">
                ${items}
                ${border}
            </svg>
        `;
    }

    copy() {
        const b = new SVG_Builder();
        b.render_instructions = [...this.render_instructions];
        return b;
    }

    set_dimensions(dim: {
        width?: number | null;
        height?: number | null;
        viewbox?: [Vector, Vector] | null;
        padding?: number | null;
    }) {
        if (dim.width || dim.width === 0) {
            this.width = dim.width;
        }

        if (dim.height || dim.height === 0) {
            this.height = dim.height;
        }

        if (dim.padding || dim.padding === 0) {
            this.padding = dim.padding;
        }

        if (dim.viewbox) {
            this.viewbox = dim.viewbox;
        }
    }
}

function vectors_to_string(vec: Vector[]) {
    return vec
        .map((v) => `${float_to_string(v.x)},${float_to_string(v.y)}`)
        .join(" ");
}

function recalculate_viewbox_with_padding(
    width: number,
    height: number,
    viewbox: [Vector, Vector],
    padding: number,
): [Vector, Vector] {
    const w_ratio = width / (width - 2 * padding);
    const h_ratio = height / (height - 2 * padding);
    const ratio = Math.max(w_ratio, h_ratio);

    const center = Vector.lerp(viewbox[0], viewbox[1], 0.5);
    return viewbox.map((v) => v.subtract(center).scale(ratio).add(center)) as [
        Vector,
        Vector,
    ];
}

const defaultRenderGroups = {
    belongs_to_render_groups: ["base"],
    show_render_groups_on_hover: [],
    hide_render_groups_on_hover: [],
};

function compute_render_group_css(
    r?: Partial<RenderGroupData> | null,
    hover_data?: Json,
): string {
    let render_groups: RenderGroupData = r
        ? {
              ...defaultRenderGroups,
              ...r,
          }
        : defaultRenderGroups;

    let render_attribute_string: string = "";
    if (hover_data ?? null !== null) {
        render_attribute_string += `x-data="${data_to_string(hover_data ?? null)}" `;
    }
    if (
        render_groups.belongs_to_render_groups.length > 1 ||
        (render_groups.belongs_to_render_groups.length > 0 &&
            render_groups.belongs_to_render_groups[0] != "base")
    ) {
        render_attribute_string += `x-belongs_to_render_groups="${data_to_string(
            render_groups.belongs_to_render_groups,
        )}" `;
    }
    if (render_groups.show_render_groups_on_hover.length > 1) {
        render_attribute_string += `x-show_render_groups_on_hover="${data_to_string(render_groups.show_render_groups_on_hover)}" `;
    }
    if (render_groups.hide_render_groups_on_hover.length > 1) {
        render_attribute_string += `x-hide_render_groups_on_hover="${data_to_string(render_groups.hide_render_groups_on_hover)}" `;
    }

    if (render_attribute_string == "") return "";
    return ` hover_stuff="true" ` + render_attribute_string;
}

function data_to_string(data: Json) {
    return JSON.stringify(data).replace(/\\/g, "\\\\").replace(/"/g, "&quot;");
}

function float_to_string(f: number): string {
    return "" + Math.round(f * 1000) / 1000;
}

function escapeXml(s: string) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
