import CONF from "../config.json" with { type: "json" };
import { EPS, Vector, ZERO } from "../geometry";
import { Line } from "../line";

export function rel_normalized_sample_points(line: Line, approx_sample_spacing: number | null = null) {
    if (approx_sample_spacing == null) {
        const density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;
        approx_sample_spacing = line.get_length() / (density * line.endpoint_distance());
    }
    approx_sample_spacing = Math.round(approx_sample_spacing);

    const total_len = line.get_length() / line.endpoint_distance();
    const step_size = 1 / approx_sample_spacing;
    const sample_point_distance = total_len * step_size;

    const sp = line.sample_points;
    const res = [sp[0]];

    let current_sp_index = 0;
    let point_for_distance_from = sp[0]; // Is or is after sp[current_sp_index]
    let distance_left = sample_point_distance;

    while (current_sp_index < sp.length - 1) {
        let distance_to_next_sp_point = point_for_distance_from
            .subtract(sp[current_sp_index + 1])
            .length();
        if (distance_to_next_sp_point < distance_left) {
            distance_left -= distance_to_next_sp_point;
            current_sp_index += 1;
            point_for_distance_from = sp[current_sp_index];
        } else {
            const next_sample_point = point_for_distance_from.add(
                sp[current_sp_index + 1]
                    .subtract(point_for_distance_from)
                    .normalize()
                    .mult(distance_left)
            );

            point_for_distance_from = next_sample_point;
            res.push(next_sample_point);
            distance_left = sample_point_distance;
        }
    }

    if (
        sp[sp.length - 1].subtract(res[res.length - 1]).length() <
        sample_point_distance * 0.3
    ) {
        res.pop();
    }

    res.push(sp[sp.length - 1]);

    return res;
};

export function abs_normalized_sample_points(line: Line, approx_sample_spacing: number | null = null) {
    const to_abs = line.get_to_absolute_function();
    return line._rel_normalized_sample_points(
        approx_sample_spacing ? approx_sample_spacing / line.endpoint_distance() : null
    ).map(to_abs);
};

export function remove_duplicate_points(line: Line) {
    if (line.sample_points.length <= 2) return;

    let last_index = 0;
    line.sample_points = line.sample_points.filter((point, index) => {
        if (index === 0) return true;
        const prevPoint = line.sample_points[last_index];
        if (prevPoint.distance(point) > EPS.WEAK_EQUAL) {
            last_index = index;
            return true;
        }
        return false;
    });
}

export function renormalize(line: Line, new_density: number | null = null) {
    if (!new_density) new_density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;

    const n = line.get_length() / new_density!;
    line.sample_points = line._rel_normalized_sample_points(n);
    return line;
};

export function smooth_out(line: Line, ker_size: number = 0.1, ker_size_absolute: boolean = false) {
    /*
        We smooth out the curve by making for each point x on the curve a new sample point.
        That new sample point is the x determined by

        argmin \integral_0^1 |x - \gamma(t)|^{exponent} dt

        where \gamma(t) uniformly sweeps through the line near (\pm ker_size/2) the current point.

        ========

        For n = 1 we get

        argmin \integral_0^1 |x - \gamma(t)|^{1} dt
        = argmin \sum_{line segments} Length(segment) * Distance(X, Segment)

        which doesnt seem nice. (And e.g. for inside a circle is everywhere the same)

        So lets try minimizing for n=2. See some image in docs.
    */

    if (ker_size_absolute) {
        ker_size = ker_size / line.endpoint_distance();
    }

    const total_length = line.get_length() / line.endpoint_distance();
    const n = 1 / CONF.DEFAULT_SAMPLE_POINT_DENSITY;
    const len_per_pt = total_length / n;

    const new_sample_points = [line.sample_points[0]];

    // Loop variables
    let interp_points = [line.sample_points[0], line.sample_points[0]];
    let weights = [1];

    let latest_point = [0, 0]; // index, fraction (0-1) went to next pt

    // weight = 1 means it is the whole ker_size
    // How muth the weight should change for each unit of change in len
    const weight_per_step = 1 / ker_size;

    while (true) {
        let to_move_forwards = len_per_pt;
        while (to_move_forwards > 0) {
            if (latest_point[0] == line.sample_points.length - 1) {
                interp_points.push(
                    line.sample_points[line.sample_points.length - 1]
                );
                weights[weights.length - 1] =
                    weights[weights.length - 1] +
                    to_move_forwards * weight_per_step;
                to_move_forwards = 0;
                break;
            }

            let distance_to_next_pt = line.sample_points[
                latest_point[0]
            ].distance(line.sample_points[latest_point[0] + 1]);
            let rem_distance_to_next_pt =
                distance_to_next_pt * (1 - latest_point[1]);
            if (rem_distance_to_next_pt < to_move_forwards) {
                latest_point = [latest_point[0] + 1, 0];
                to_move_forwards -= rem_distance_to_next_pt;
                interp_points.push(line.sample_points[latest_point[0]]);
                weights.push(rem_distance_to_next_pt * weight_per_step);
                continue;
            }

            let split_fraction =
                latest_point[1] + to_move_forwards / distance_to_next_pt;

            const start = line.sample_points[latest_point[0]].scale(
                1 - split_fraction
            );
            const end =
                line.sample_points[latest_point[0] + 1].scale(
                    split_fraction
                );
            interp_points.push(start.add(end));
            latest_point[1] = split_fraction;
            weights.push(to_move_forwards * weight_per_step);
            to_move_forwards = 0;
            break;
        }

        let to_move_backwards = len_per_pt;
        while (to_move_backwards > 0) {
            while (weights[0] < to_move_backwards * weight_per_step) {
                to_move_backwards -= weights[0] / weight_per_step;
                weights.shift();
                interp_points.shift();
            }

            if (interp_points[0] == interp_points[1]) {
                // We are at the beginning
                weights[0] =
                    weights[0] - to_move_backwards * weight_per_step;
                to_move_backwards = 0;
                break;
            }

            const delta_weight =
                (weights[0] - to_move_backwards * weight_per_step) /
                weights[0];
            interp_points[0] = interp_points[0]
                .scale(delta_weight)
                .add(interp_points[1].scale(1 - delta_weight));

            weights[0] = weights[0] - to_move_backwards * weight_per_step;
            to_move_backwards = 0;
            break;
        }

        new_sample_points.push(
            compute_center_point(interp_points, weights)
        );

        if (
            weights.length == 1 &&
            latest_point[0] == line.sample_points.length - 1
        ) {
            new_sample_points.push(new Vector(1, 0));
            break;
        }
    }

    line.sample_points = new_sample_points;
    return line;
};

export function compute_center_point(
    points: Vector[],
    line_weights: number[] | null = null
) {
    if (points.length == 1) return points[1];

    let numerator = ZERO;

    for (let i = 0; i < points.length; i++) {
        numerator = numerator.add(
            points[i].add(points[i + 1]).scale(line_weights ? line_weights[i] : 1)
        );
    }

    return numerator.scale(1 / 2);
}
