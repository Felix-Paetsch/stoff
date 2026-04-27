import { CollectionMethods, Line, LinearTransform, Polyline, Sketch, Spline, Vector } from "@/Core";
import { BoundShirtSideMeasurements } from "./measurement_utils";
import { Out } from "@/Dev";

export function construct_base_tshirt_parts(
    mea: BoundShirtSideMeasurements,
): Sketch {
    const sketch = new Sketch();

    const len = construct_main_body(sketch, mea);
    construct_side(sketch, mea, len);
    add_curve(sketch);
    lengthen_type1(sketch, mea);
    
    return sketch;
}

function construct_main_body(sketch: Sketch, mea: BoundShirtSideMeasurements) {
    const A = sketch.add_point(0, 0);
    A.data.name = "a";

    const B = sketch.add_point(0, mea("center"));
    B.data.name = "b";

    const A_to_B = sketch.line_between_points(A, B);
    A_to_B.data.type = "fold";

    const P1 = sketch.add_point(B.vec.subtract(new Vector(0, mea("shoulder"))));
    const P2 = sketch.add_point(
        P1.vec.subtract(new Vector(mea("shoulder_width") / 2, 0)),
    );

    let len1 = Math.sqrt(
        Math.pow(mea("diagonal"), 2) - Math.pow(mea("shoulder_width") / 2, 2),
    );

    const C = sketch.add_point(B.vec.add(new Vector(P2.vec.x, -len1)));
    C.data.name = "c";

    let len2 = Math.sqrt(
        Math.pow(mea("shoulder_length"), 2) - Math.pow(C.vec.y - P1.vec.y, 2),
    );

    const D = sketch.add_point(C.vec.add(new Vector(len2, P1.vec.y - C.vec.y)));
    D.data.name = "d";

    const C_to_D = sketch.line_between_points(C, D);
    C_to_D.data.name = "shoulder";
    C.move_to(Vector.lerp(C.vec, D.vec, 0.25));
    C.data = {
        name: "c",
        position: "main",
    };

    const B_to_F = sketch.add_line(
        new Polyline([Vector.ZERO, Vector.LEFT.scale(mea("point_width") / 2)]),
        B,
    );

    const F = B_to_F.other_endpoint(B);
    F.data = {
        name: "f",
        position: "main",
    };

    let vec_h = B.vec.subtract(
        new Vector(mea("point_width") / 2, mea("point_height")),
    );
    const H = sketch.add_point(vec_h);
    H.data = {
        name: "h",
        position: "main",
    };

    const C_to_H = sketch.line_between_points(C, H);
    sketch.line_between_points(H, F);

    sketch.remove(P1, P2);

    // ----

    const P3 = sketch.add_point(B.vec.subtract(
        new Vector(0, mea("side_height"))
    ))

    const line_h = sketch.add_line(
        new Polyline([Vector.ZERO, Vector.LEFT.scale(mea("shoulder_length"))]),
        P3
    )

    const P4 = line_h.shape.intersection_positions(C_to_H.shape)[0]!.vec;
    
    const len3 = P4.subtract(P3.vec).length()

    sketch.remove(line_h.p1, line_h.p2)

    const len4 = mea("over_bust") / 2 - len3
    
    return len4
}

function construct_side(sketch: Sketch, mea: BoundShirtSideMeasurements, len:number) {
    const R = sketch.add_point(-60, 15);
    R.data.name = "r";
    const S = sketch.add_point(-60, 15 + mea("side_height"));
    S.data.name = "s";

    const rest_len = mea("waist") / 2 - mea("point_width") / 2;

    const F = sketch.add_point(S.vec.subtract(new Vector(-rest_len, 0)));
    F.data = {
        name: "f",
        position: "side",
    };

    const H = sketch.add_point(
        S.vec.subtract(
            new Vector(
                -(mea("bust") - mea("point_width")) / 2,
                mea("point_height"),
            ),
        ),
    );
    H.data = {
        name: "h",
        position: "side",
    };

    const AngledMainHCLine = CollectionMethods.get_lines_between_points(
        sketch,
        {
            point1: {
                name: "h",
            },
            point2: {
                name: "c",
            },
        },
    )[0]!;
    const len_h = AngledMainHCLine.length()

    sketch.line_between_points(R, S);
    sketch.line_between_points(S, F);
    sketch.line_between_points(H, F);

    // -----

    const P1 = sketch.add_point(R.vec.subtract(
        new Vector(-len, 0)
    ))

    const vec_h = P1.vec.subtract(H.vec).normalize().scale(len_h)

    const C = sketch.add_point(H.vec.add(vec_h))

    C.data = {
        name: "c",
        position: "side",
    }

    sketch.line_between_points(C, H);

    sketch.remove(P1)
}

// Typ 1 ist wenn beide Teile des vorderteils einzeln bleiben und wir sozusagen einen Princess Schnitt haben wollen.
function lengthen_type1(sketch: Sketch, mea: BoundShirtSideMeasurements){

    const ratio = mea("waist_width_front")/mea("waist_width_back");

    const len = mea("waist_height");

    const FSLine = CollectionMethods.get_lines_between_points(
        sketch,
        {
            point1: {
                name: "f",
            },
            point2: {
                name: "s",
            },
        },
    )[0]!;
    const len_fs = FSLine.length()


        const BFLine = CollectionMethods.get_lines_between_points(
        sketch,
        {
            point1: {
                name: "f",
            },
            point2: {
                name: "s",
            },
        },
    )[0]!;
    const len_bf = BFLine.length()



    const X = mea("bottom") / 2 - len_bf - len_fs;

    var y = X / 3;
    y = y * ratio;


    var x = X - y * 2;

    const B = CollectionMethods.get_points(sketch, {name: "b"})[0]!;
    const FMain = CollectionMethods.get_points(sketch, {name: "f", position: "main"})[0]!;
    const FSide = CollectionMethods.get_points(sketch, {name: "f",  position: "side"})[0]!;
    const S = CollectionMethods.get_points(sketch, {name: "s"})[0]!;

    const N = sketch.add_point(B.vec.add(
        new Vector(0, len)
    ))
    N.data = {
        name: "n",
        position: "main"
    }
    const M = sketch.add_point(FMain.vec.add(
        new Vector(-y, len)
    ))
    M.data = {
        name: "m",
        position: "main"
    }
    const O = sketch.add_point(FSide.vec.add(
        new Vector(y, len)
    ))
    O.data = {
        name: "o",
        position: "side"
    }
    const P = sketch.add_point(S.vec.add(
        new Vector(-x, len)
    ))
    P.data = {
        name: "p",
        position: "side"
    }

    sketch.line_between_points(B, N);
    sketch.line_between_points(N, M);
    sketch.line_between_points(FMain, M);
    sketch.line_between_points(FSide, O);
    sketch.line_between_points(O, P);
    sketch.line_between_points(S, P);

}


function lengthen_type2(sketch: Sketch, mea: BoundShirtSideMeasurements){

    const lines = CollectionMethods.get_lines_between_points(sketch, {point1: { name: "h"}, point2: {name: "c"}});

    align_lines(sketch, lines[0]!, lines[1]!);



}


function align_lines(sketch: Sketch, l1: Line, l2: Line){
    const transform = LinearTransform.affine_orthogonal(
        l2.endpoints().map(p => p.vec) as [Vector, Vector],
        l1.endpoints().map(p => p.vec) as [Vector, Vector]
    );

    l2.p1.data.wha = "l2p1";
    l2.p2.data.wha = "l2p2";
    l1.p1.data.wha = "l1p1";
    l1.p2.data.wha = "l1p2";

    Out.put(sketch);

    const c2 = CollectionMethods.connected_component(sketch, l2);
    const pts = CollectionMethods.get_points(c2);
    pts.reverse().forEach(p => {
                p.move_to(
        transform(p.vec)
)});

    Out.put(sketch);


    
}


function add_curve(sketch: Sketch){
    const C = CollectionMethods.get_point(sketch, {name: "c", position: "side"})!;
    const R = CollectionMethods.get_point(sketch, {name: "r"})!;

    const tangentC = C.adjacent_lines()[0]!.shape.tangent_vector(C.vec)!;

    console.log(R.adjacent_lines()[0]!.shape.tangent_vector(R.vec), tangentC);

    const normalR = R.adjacent_lines()[0]!.shape.tangent_vector(R.vec)!.orthogonal();

    const shape_fn = Spline.hermite([C.vec, R.vec], [tangentC, normalR]);
    sketch.add_line(Polyline.from_function(shape_fn), C, R);
}

