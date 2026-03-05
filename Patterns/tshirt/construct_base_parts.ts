import { Vector } from "@/Core/StoffLib/geometry";
import { Sketch } from "@/Core/StoffLib/sketch";
import { BoundShirtSideMeasurements } from "./measurement_utils";
import { get_lines_between_points } from "@/Core/StoffLib/collection";

export function construct_base_tshirt_parts(mea: BoundShirtSideMeasurements): Sketch {
    const sketch = new Sketch();

    construct_main_body(sketch, mea);
    construct_side(sketch, mea);

    return sketch;
}

function construct_main_body(sketch: Sketch, mea: BoundShirtSideMeasurements) {
    const A = sketch.point(0, 0);
    A.data.name = "a";
    const B = sketch.point(0, mea("center"));
    B.data.name = "b";

    const A_to_B = sketch.line_between_points(A, B);
    A_to_B.data.type = "fold";

    const P1 = sketch.add_point(
        B.subtract(new Vector(0, mea("shoulder")))
    );
    const P2 = sketch.add_point(
        P1.subtract(new Vector(mea("shoulder_width") / 2, 0))
    );

    let len1 = Math.sqrt(
        Math.pow(mea("diagonal"), 2) -
        Math.pow(mea("shoulder_width") / 2, 2)
    );

    const C = sketch.add_point(B.add(new Vector(P2.x, -len1)));
    C.data.name = "c";

    let len2 = Math.sqrt(
        Math.pow(mea("shoulder_length"), 2) -
        Math.pow(C.y - P1.y, 2)
    );

    const D = sketch.add_point(
        C.add(new Vector(len2, P1.y - C.y))
    );
    D.data.name = "d";

    const C_to_D = sketch.line_between_points(C, D);
    C_to_D.data.name = "shoulder";
    C.move_to(Vector.lerp(C, D, 0.25));
    C.data = {
        name: "c",
        position: "main"
    };

    const B_to_F = sketch.line_at_angle(
        B,
        -Math.PI / 2,
        mea("point_width") / 2
    ).line;

    const F = B_to_F.other_endpoint(B);
    F.data = {
        name: "f",
        position: "main"
    };

    let vec_h = B.subtract(
        new Vector(mea("point_width") / 2, mea("point_height"))
    );
    const H = sketch.add_point(vec_h);
    H.data = {
        name: "h",
        position: "main"
    };


    sketch.line_between_points(C, H);
    sketch.line_between_points(H, F);

    sketch.remove(P1, P2);
}

function construct_side(sketch: Sketch, mea: BoundShirtSideMeasurements) {
    const R = sketch.point(-60, 15);
    R.data.name = "r";
    const S = sketch.point(-60, 15 + mea("side_height"));
    S.data.name = "s";

    const rest_len = mea("waist") / 2 - mea("point_width") / 2;

    const F = sketch.add_point(S.subtract(new Vector(-rest_len, 0)));
    F.data = {
        name: "f",
        position: "side"
    };

    const H = sketch.add_point(
        S.subtract(
            new Vector(
                -(mea("bust") - mea("point_width")) / 2,
                mea("point_height"),
            ),
        ),
    );
    H.data = {
        name: "h",
        position: "side"
    };

    const AngledMainHCLine = get_lines_between_points(sketch, { name: "h" }, { name: "c" })[0]!;
    const C = sketch.add_point(H.add(AngledMainHCLine.get_line_vector().invert()));
    C.data = {
        name: "c",
        position: "side"
    };

    sketch.line_between_points(R, S);
    sketch.line_between_points(S, F);
    sketch.line_between_points(H, F);
    sketch.line_between_points(C, H);
}
