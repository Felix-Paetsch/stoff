import { Color, Polygon, Polyline, Vector } from "@/Core";
import { Json } from "../../types";
import { SVGGradient } from "./gradient";
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

export type RenderGroupData = {
    belongs_to_render_groups: string[];
    show_render_groups_on_hover: string[];
};

// The thing with higher render priority gets rendered on top

type RenderInstruction = {
    content: string;
    render_priority: number;
};

export class SVG_Builder {
    protected render_instructions: RenderInstruction[] = [];
    protected defs: string = "";

    constructor(
        public width: number = 100,
        public height: number = 100,
        public viewbox: [Vector, Vector] = [Vector.ZERO, new Vector(100, 100)],
        public padding: number = 0,
    ) {}

    add_def(str: string) {
        this.defs += str;
    }

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
      fill="${Color.toHex(full_attributes.fill)}"
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
                ? `stroke="${Color.toHex(full_attributes.stroke)}" stroke-width="${full_attributes.stroke_width}"`
                : 'stroke="none"';
            const fillString = full_attributes.fill
                ? `fill="${Color.toHex(full_attributes.fill)}"`
                : 'fill="none"';

            return `<circle cx="${position.x}" ${ras} cy="${position.y}" r="${full_attributes.radius}" ${strokeString} ${fillString} opacity="${full_attributes.opacity}"/>`;
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

            let pointsString = vectors_to_string(line.vertices);

            if (!full_attributes.stroke) {
                return "";
            } else if (typeof full_attributes.stroke == "string") {
                return `<polyline points="${pointsString}" ${ras} style="fill:none; stroke: ${Color.toHex(full_attributes.stroke)}; stroke-width: ${full_attributes.stroke_width}" opacity="${full_attributes.opacity}" />`;
            }

            let gradient: SVGGradient;
            let sections: number;

            if (Array.isArray(full_attributes.stroke[0])) {
                gradient = new SVGGradient(full_attributes.stroke[0], this);
                sections = full_attributes.stroke[1] as number;
            } else {
                gradient = new SVGGradient(
                    full_attributes.stroke as Color.Gradient,
                    this,
                );
                sections = 1;
            }

            let res = `<g ${ras}>`;
            for (let i = 0; i < sections; i++) {
                const from = i / sections;
                const to = (i + 1) / sections;

                const subline = line.slice(from, to);
                if (subline.is_empty()) continue;

                const gradient_id = gradient.gradient_segment(from, to, {
                    from: subline.first()!,
                    to: subline.last()!,
                });

                const sublinePoints = vectors_to_string(subline.vertices);

                res += `<polyline points="${sublinePoints}" style="fill:none; stroke: url(#${gradient_id}); stroke-width: ${full_attributes.stroke_width}" opacity="${full_attributes.opacity}" />`;
            }
            return (res += `</g>`);
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

            let pointsString = vectors_to_string(gon.vertices);

            let res: string;
            if (!full_attributes.fill) {
                res = "";
            } else if (typeof full_attributes.fill == "string") {
                const fillString = `fill="${Color.toHex(full_attributes.fill)}"`;
                res = `<polygon ${ras} stroke="none" ${fillString} opacity="${full_attributes.opacity}" points="${pointsString}" />`;
            } else {
                throw new Error(
                    "Gradient fill unimplemented, as we need to figure out direction",
                );
                // const grad = new SVGGradient(full_attributes.fill);
                // fillString = `fill="url(#${grad.id})`;
            }

            if (full_attributes.stroke && full_attributes.stroke_width > 0) {
                this.render_polyline(
                    gon.to_polyline(),
                    full_attributes,
                    data,
                    belongs_to_render_groups,
                    show_render_groups_on_hover,
                );
            }

            return res;
        }, full_attributes.render_priority);
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
            content: render(compute_render_group_css),
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

        const items = this.render_instructions.map((r) => r.content).join("");

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
                ${this.defs.length > 0 ? "<defs>" + this.defs + "</defs>" : ""}
                ${items}
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
    if (
        !isFinite(viewbox[0].x) ||
        !isFinite(viewbox[0].y) ||
        !isFinite(viewbox[1].x) ||
        !isFinite(viewbox[1].y)
    ) {
        return [Vector.ZERO, Vector.ZERO];
    }

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
