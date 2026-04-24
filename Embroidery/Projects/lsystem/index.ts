import { deg_to_rad, Radians, Vector } from "@/Core";
import { Embroidery } from "Embroidery/Lib/embroidery";
import { Graph, GraphUtils } from "Embroidery/Lib/index";
import { string_LSystem } from "Embroidery/Lib/LSystem/string/index";
import { defineEmbroidery } from "Embroidery/types";
import { polygon_smooth_out } from "ShapeManipulation/smooth_out";

export const LSystemProject = defineEmbroidery(
    "LSystem" as const,
    (_cfg: {}) => {
        const s = string_LSystem([
            ["X", "F+[[X]-X]-F[-FX]+X"],
            ["F", "FF"],
            // ["F", "F[+F]F[-F][F]"],
        ] as const);
        const evaluated = s("-X", 4);

        const interpreted = interpret_string(
            evaluated,
            {
                angle: 0,
                graph: new Graph([Vector.ZERO]),
                position: 0,
                stack: [],
            },
            [
                rotate_on("+", deg_to_rad(20)),
                rotate_on("-", deg_to_rad(-20)),
                push_stack("[", ["angle", "position"]),
                pop_stack("]"),
                draw_with_angle(".", 0.4),
            ],
        );

        const graph = interpreted.graph;
        const identified = GraphUtils.identify_equal_verticies(graph);
        identified.remove_duplicate_edges();

        let shape_tree = GraphUtils.double_run(identified);
        shape_tree = polygon_smooth_out(shape_tree, 0.3, 0.4);

        for (let i = 0; i < 10; i++) {
            console.log(
                shape_tree.vertices[i]!.distance(shape_tree.vertices[i + 1]!),
            );
        }

        const embr = new Embroidery();

        embr.color_change("blue");
        embr.run(shape_tree);

        console.log(embr.size(), embr.stitch_count());

        return embr;
    },
);

type Interpretation<State> = [string, (state: State) => void];

function rotate_on(on: string, by: Radians): Interpretation<{ angle: number }> {
    return [
        on,
        (s) => {
            s.angle += by;
        },
    ];
}

function draw_with_angle(
    on: string,
    len: number = 1,
): Interpretation<{ angle: number; graph: Graph; position: number }> {
    return [
        on,
        (s) => {
            const start = s.graph.vertices[s.position]!;
            s.graph.vertices.push(
                Vector.add(start, Vector.UP.rotate(s.angle).scale(len)),
            );
            s.graph.edges.push([s.position, s.graph.vertices.length - 1]);
            s.position = s.graph.vertices.length - 1;
        },
    ];
}

function push_stack(
    on: string,
    keys: string[],
): Interpretation<Record<string, any> & { stack: Record<string, any>[] }> {
    return [
        on,
        (s) => {
            const res: Record<string, any> = {};
            for (const k of keys) {
                if (Object.keys(s).includes(k)) {
                    res[k] = s[k];
                }
            }
            s.stack.push(res);
        },
    ];
}

function pop_stack(
    on: string,
): Interpretation<Record<string, any> & { stack: Record<string, any>[] }> {
    return [
        on,
        (s) => {
            Object.assign(s, s.stack.pop()!);
        },
    ];
}

function interpret_string<State extends {}>(
    input: string,
    state: State,
    interpretations: Interpretation<State>[],
): State {
    for (const c of input) {
        const interpretation =
            interpretations.find((i) => {
                return i[0] == c;
            }) ||
            interpretations.find((i) => {
                try {
                    return new RegExp(i[0]).test(c);
                } catch {
                    return false;
                }
            });

        if (interpretation) {
            interpretation[1](state);
        }
    }

    return state;
}
