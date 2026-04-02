import { expect } from "@/Core/expect";
import { PolylineFunction } from "..";
import { Vector } from "../../classes";
import { Fraction } from "../../1d";

export const Spline = {
    bezier: (points: Vector[]) => {
        return bezier_spline(points, points.length - 1);
    },
    bezier_spline,
    bezier_smooth_cubic,
    hermite_spline,
    catmull_rom_spline,
};

function bezier_spline(
    static_points: Vector[],
    degree: number = 2,
): PolylineFunction {
    expect(
        (static_points.length - 1) % degree === 0,
        "The number of input points -1 must be a multiple of the degree",
    );
    expect(degree >= 1 && Number.isInteger(degree));

    const points = [...static_points];
    let segments: Vector[][] = [];

    while (points.length > 1) {
        const to_push = points.splice(0, degree);
        to_push.push(points[0]!);
        segments.push(to_push);
    }

    return function (t: Fraction) {
        // Determine which curve segment to use
        let segment_index = Math.floor(t * segments.length);
        let segment_t = t * segments.length - segment_index;

        if (t == 1) {
            segment_index = segments.length - 1;
            segment_t = 1;
        }

        return bezier(segments[segment_index]!, segment_t);
    };
}

function bezier(points: Vector[], t: Fraction): Vector {
    expect(points.length > 0);
    if (points.length == 1) return points[0]!;
    return bezier(points.slice(0, points.length - 1), t)
        .mult(1 - t)
        .add(bezier(points.slice(1, points.length), t).mult(t));
}

function hermite_spline(
    points: Vector[],
    velocities: Vector[],
    relative: boolean = true,
): PolylineFunction {
    // Returns a fn creating the hermite spline through the given poitns with the right velocity
    // relative means whether the velocity is given as a vector from (0, 0) or from the current control pt

    expect(
        points.length == velocities.length,
        "Number of points and velocities must be equal",
    );

    let new_velocities = velocities;
    if (!relative) {
        new_velocities = [];
        for (let i = 0; i < points.length; i++) {
            new_velocities.push(velocities[i]!.subtract(points[i]!));
        }
    }

    const hermite_control_points: Vector[] = [];
    const control_points: Vector[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        control_points.push(
            points[i]!,
            points[i]!.add(new_velocities[i]!.mult(1 / 3)),
            points[i + 1]!.subtract(new_velocities[i + 1]!.mult(1 / 3)),
        );

        hermite_control_points.push(
            points[i]!,
            points[i]!.add(new_velocities[i]!),
        );
    }

    control_points.push(points[points.length - 1]!);
    hermite_control_points.push(
        points[points.length - 1]!,
        points[points.length - 1]!.add(new_velocities[points.length - 1]!),
    );

    return bezier_spline(control_points, 3);
}

function catmull_rom_spline(
    points: Vector[],
    start_velocity: Vector | null = null,
    end_velocity: Vector | null = null,
    relative: boolean = true,
): PolylineFunction {
    expect(points.length > 1);

    if (start_velocity == null) {
        start_velocity = points[1]!.subtract(points[0]!);
    } else if (!relative) {
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
    } else if (!relative) {
        end_velocity = end_velocity.subtract(points[points.length - 1]!);
    }

    velocities.push(end_velocity);
    return hermite_spline(points, velocities, true);
}

function bezier_smooth_cubic(
    points: Vector[],
    tangents: Vector[],
    relative = true,
) {
    expect(
        tangents.length == points.length,
        "We require same amt of points and tangents",
    );

    const new_pts: Vector[] = [];
    if (relative) {
        tangents = tangents.map((t, i) => points[i]!.add(t));
    }

    for (let i = 0; i < points.length - 1; i += 1) {
        new_pts.push(
            points[i]!,
            tangents[i]!,
            points[i + 1]!.add(points[i + 1]!.subtract(tangents[i + 1]!)),
        );
    }

    new_pts.push(points[points.length - 1]!);
    return bezier_spline(new_pts, 3);
}
