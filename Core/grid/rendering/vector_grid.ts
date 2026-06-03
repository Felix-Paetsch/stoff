import { Color } from "Core/colors";
import { SVG_Builder } from "Core/files/index";
import { Fraction, Interval } from "Core/geometry/index";
import { Vector } from "Core/geometry/vector";
import { EPS } from "Core/numerics/eps";
import { unique_string } from "Core/utils/unique";
import { Grid } from "../grids/grid";

export type VectorGridConfig = {
    out_dimensions: [number, number];
    out_samples: [number, number];
    out_viewbox_dimensions: [number, number];
};

export function render_vector_grid(
    g: Grid<Vector>,
    config: Partial<VectorGridConfig> = {},
): SVG_Builder {
    if (!("out_dimensions" in config)) {
        config.out_dimensions = [500, 500];
    }
    if (!("out_samples" in config)) {
        config.out_samples = [20, 20];
    }
    if (!("out_viewbox_dimensions" in config)) {
        config.out_viewbox_dimensions = [200, 200];
    }

    const viewbox: [Vector, Vector] = [
        new Vector(0, 0),
        new Vector(
            config.out_viewbox_dimensions![0],
            config.out_viewbox_dimensions![1],
        ),
    ];
    const samples: [number, number] = config.out_samples!;

    const max_vec_length =
        Math.min(
            (viewbox[1].x - viewbox[0].x) / samples[0],
            (viewbox[1].y - viewbox[0].y) / samples[1],
        ) / 1.5;
    const arrow_head_width = Math.min(3, max_vec_length / 2);
    const arrow_width = Math.min(2, max_vec_length / 6);

    const render_grid = g.resample({
        domain_dimensions: g.domain_dimensions(),
        lattice_dimensions: samples,
    });

    render_grid.remap_domain_in_place([
        viewbox[0].x,
        viewbox[0].y,
        viewbox[1].x - viewbox[0].x,
        viewbox[1].y - viewbox[0].y,
    ]);

    const builder = new SVG_Builder(
        config.out_dimensions![0],
        config.out_dimensions![1],
        viewbox,
    );

    let map_x = Interval.remap(
        [0, samples[0] - 1],
        [viewbox[0].x, viewbox[1].x],
    );
    let map_y = Interval.remap(
        [0, samples[1] - 1],
        [viewbox[0].y, viewbox[1].y],
    );

    const vec_map = rescale_vector_map(max_vec_length);

    for (let lx = 1; lx < samples[0] - 1; lx++) {
        for (let ly = 1; ly < samples[1] - 1; ly++) {
            let start = new Vector(map_x(lx), map_y(ly));

            let vec = vec_map(render_grid.value_at_lattice_point([lx, ly]));

            draw_arrow(
                builder,
                start,
                start.add(vec),
                color_for_vec(vec),
                arrow_width,
                arrow_head_width,
            );
        }
    }

    return builder;
}

function remap_number(input: number): Fraction {
    input = Math.log1p(input);
    return input / (1 + input);
}

function color_for_vec(v: Vector): Color.Color {
    return Color.lerp("red", "blue", remap_number(v.length()));
}

function rescale_vector_map(max: number = 1): (v: Vector) => Vector {
    return (x: Vector) => {
        if (x.length() < EPS.tiny) return x;
        return x.to_len(max * remap_number(x.length()));
    };
}

function draw_arrow(
    on: SVG_Builder,
    from: Vector,
    to: Vector,
    color: Color.Color,
    arrowWidth: number = 1,
    arrowHeadSize: number = 4,
) {
    const id = `arrowhead-${unique_string()}`;

    const dir = to.subtract(from);
    const offset = arrowHeadSize / 2;
    dir.to_len(Math.max(0, dir.length() - offset));
    const offset_to = from.add(dir);

    const markerWidth = arrowHeadSize;
    const markerHeight = arrowHeadSize;

    on.custom(
        () => `
    <defs>
      <marker
        id="${id}"
        markerWidth="${markerWidth}"
        markerHeight="${markerHeight}"
        refX="${markerWidth - offset}"
        refY="${markerHeight / 2}"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon
          points="0 0, ${markerWidth} ${markerHeight / 2}, 0 ${markerHeight}"
          fill="${Color.toString(color)}"
        />
      </marker>
    </defs>
      <line
        x1="${from.x}"
        y1="${from.y}"
        x2="${offset_to.x}"
        y2="${offset_to.y}"
        stroke="${Color.toString(color)}"
        stroke-width="${arrowWidth}"
        marker-end="url(#${id})"
      />
  `,
    );
}
