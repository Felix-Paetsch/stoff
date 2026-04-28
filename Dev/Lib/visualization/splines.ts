import { Expect, Line, Point, Sketch, Vector } from "../../../Core/index";

export function catmull_rom_controlpoints(
    sketch: Sketch,
    points: Vector[],
    start_velocity: Vector | null = null,
    end_velocity: Vector | null = null,
    velocity_type: "relative" | "absolute" = "relative",
) {
    Expect.that(points.length > 1);

    if (start_velocity == null) {
        start_velocity = points[1]!.subtract(points[0]!);
    } else if (velocity_type == "absolute") {
        start_velocity = start_velocity.subtract(points[0]!);
    }

    const velocities = [start_velocity];
    for (let i = 1; i < points.length - 1; i++) {
        velocities.push(points[i + 1]!.subtract(points[i - 1]!).mult(1 / 2));
    }

    if (end_velocity == null) {
        end_velocity = points[points.length - 1]!.subtract(
            points[points.length - 2]!,
        );
    } else if (velocity_type == "absolute") {
        end_velocity = end_velocity.subtract(points[points.length - 1]!);
    }

    velocities.push(end_velocity);
    return hermite_controlpoints(sketch, points, velocities, velocity_type);
}

export function hermite_controlpoints(
    sketch: Sketch,
    points: Vector[],
    velocities: Vector[],
    velocity_type: "relative" | "absolute" = "relative",
    //@ts-ignore
    pt_callback = (pt: Point, i: number) => {},
    //@ts-ignore
    ln_callback = (ln: Line, i: number) => {},
) {
    let new_velocities = velocities;
    if (velocity_type == "absolute") {
        new_velocities = [];
        for (let i = 0; i < points.length; i++) {
            new_velocities.push(velocities[i]!.subtract(points[i]!));
        }
    }

    const hermite_control_points: Vector[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        hermite_control_points.push(
            points[i]!,
            points[i]!.add(new_velocities[i]!),
        );
    }

    hermite_control_points.push(
        points[points.length - 1]!,
        points[points.length - 1]!.add(new_velocities[points.length - 1]!),
    );

    const pts: Point[] = [];

    hermite_control_points.forEach((vec) => {
        const pt = sketch.add_point(vec);
        pt.data._shape_visualization = "true";
        pts.push(pt);
    });

    const lns: Line[] = [];
    for (let i = 0; i < pts.length / 2; i++) {
        const ln = sketch.line_between_points(pts[2 * i]!, pts[2 * i + 1]!);
        ln.data._shape_visualization = "true";
        lns.push(ln);
    }

    pts.forEach((p, i) => pt_callback(p, i));
    lns.forEach((l, i) => ln_callback(l, i));
}

export function bezier_controlpoints(
    sketch: Sketch,
    control_points: Vector[],
    //@ts-ignore
    pt_callback = (pt: Point, i: number) => {},
    //@ts-ignore
    ln_callback = (ln: Line, i: number) => {},
) {
    const pts: Point[] = [];
    control_points.forEach((vec) => {
        const pt = sketch.add_point(vec);
        pt.data._shape_visualization = "true";
        pts.push(pt);
        pts.push(pt);
    });

    const lns: Line[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const ln = sketch.line_between_points(pts[i]!, pts[i + 1]!);
        lns.push(ln);
        ln.data._shape_visualization = "true";
    }

    pts.forEach((p, i) => pt_callback(p, i));
    lns.forEach((l, i) => ln_callback(l, i));
}
