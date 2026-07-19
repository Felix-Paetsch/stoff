use crate::grid::{
    algorithms::fast_marching::initialize::FastMarchingState,
    grid_struct::{Grid, GridPosition},
};

#[allow(unused)]
pub fn isotropic_second_order_single_stencil_arrival_time_update_fn<'a>(
    speed_grid: &'a Grid<f64>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    debug_assert!(speed_grid.iter().all(|v| *v >= 0.0));

    let [w, h] = speed_grid.lattice_dimensions();
    debug_assert!(w > 2 && h > 2);

    let [_, _, domw, domh] = speed_grid.domain_dimensions();
    let hx = domw / (w as f64 - 1.0);
    let hy = domh / (h as f64 - 1.0);

    move |data: &FastMarchingState, p: GridPosition| {
        let old_t = *data.times_grid.value_at(p);
        let speed = *speed_grid.value_at(p);

        if speed <= 0.0 {
            return old_t;
        }

        let inv_speed_sq = 1.0 / (speed * speed);
        let mut best = old_t;

        for sx in [-1_i32, 1_i32] {
            let Some((ax, bx, tx_min)) = second_order_axis_stencil(data, p, [sx, 0], w, h, hx)
            else {
                continue;
            };

            for sy in [-1_i32, 1_i32] {
                let Some((ay, by, ty_min)) = second_order_axis_stencil(data, p, [0, sy], w, h, hy)
                else {
                    continue;
                };

                // Solve:
                //
                // Dx(T)^2 + Dy(T)^2 = 1 / speed^2
                //
                // with:
                //
                // Dx(T) = ax * T + bx
                // Dy(T) = ay * T + by

                let qa = ax * ax + ay * ay;
                let qb = 2.0 * (ax * bx + ay * by);
                let qc = bx * bx + by * by - inv_speed_sq;

                if qa <= 0.0 {
                    continue;
                }

                let disc = qb * qb - 4.0 * qa * qc;
                if disc < 0.0 {
                    continue;
                }

                let sqrt_disc = disc.sqrt();

                let t1 = (-qb - sqrt_disc) / (2.0 * qa);
                let t2 = (-qb + sqrt_disc) / (2.0 * qa);

                for candidate in [t1, t2] {
                    if !candidate.is_finite() {
                        continue;
                    }

                    // Causality / upwind consistency.
                    if candidate < tx_min || candidate < ty_min {
                        continue;
                    }

                    if candidate < best {
                        best = candidate;
                    }
                }
            }
        }

        // Also consider valid one-axis updates. These are needed at boundaries
        // and when no valid two-axis causal update exists.
        for sx in [-1_i32, 1_i32] {
            if let Some(candidate) =
                second_order_single_axis_candidate(data, p, [sx, 0], w, h, hx, speed)
            {
                best = best.min(candidate);
            }
        }

        for sy in [-1_i32, 1_i32] {
            if let Some(candidate) =
                second_order_single_axis_candidate(data, p, [0, sy], w, h, hy, speed)
            {
                best = best.min(candidate);
            }
        }

        best
    }
}

fn second_order_single_axis_candidate(
    data: &FastMarchingState,
    p: GridPosition,
    direction: [i32; 2],
    w: usize,
    h: usize,
    spacing: f64,
    speed: f64,
) -> Option<f64> {
    let px = p[0] as i32;
    let py = p[1] as i32;

    let sx = direction[0];
    let sy = direction[1];

    debug_assert!((sx == 0) ^ (sy == 0));

    let p1x = px + sx;
    let p1y = py + sy;

    if !in_bounds(p1x, p1y, w, h) {
        return None;
    }

    let p1 = [p1x as usize, p1y as usize];

    if !data.status_grid.is_known(p1) {
        return None;
    }

    let t1 = *data.times_grid.value_at(p1);
    if !t1.is_finite() {
        return None;
    }

    let p2x = px + 2 * sx;
    let p2y = py + 2 * sy;

    if in_bounds(p2x, p2y, w, h) {
        let p2 = [p2x as usize, p2y as usize];

        if data.status_grid.is_known(p2) {
            let t2 = *data.times_grid.value_at(p2);

            if t2.is_finite() && t2 <= t1 {
                // Second-order 1D equation:
                //
                // abs((3T - 4T1 + T2) / (2h)) = 1 / speed
                //
                // Upwind causal branch:
                //
                // (3T - 4T1 + T2) / (2h) = 1 / speed
                //
                // Therefore:
                //
                // T = (4T1 - T2 + 2h / speed) / 3

                let candidate = (4.0 * t1 - t2 + 2.0 * spacing / speed) / 3.0;

                if candidate >= t1 {
                    return Some(candidate);
                }
            }
        }
    }

    // First-order fallback.
    let candidate = t1 + spacing / speed;

    if candidate >= t1 {
        Some(candidate)
    } else {
        None
    }
}

fn second_order_axis_stencil(
    data: &FastMarchingState,
    p: GridPosition,
    direction: [i32; 2],
    w: usize,
    h: usize,
    spacing: f64,
) -> Option<(f64, f64, f64)> {
    let px = p[0] as i32;
    let py = p[1] as i32;

    let sx = direction[0];
    let sy = direction[1];

    debug_assert!((sx == 0) ^ (sy == 0));
    debug_assert!(sx == -1 || sx == 0 || sx == 1);
    debug_assert!(sy == -1 || sy == 0 || sy == 1);

    let p1x = px + sx;
    let p1y = py + sy;

    if !in_bounds(p1x, p1y, w, h) {
        return None;
    }

    let p1 = [p1x as usize, p1y as usize];

    if !data.status_grid.is_known(p1) {
        return None;
    }

    let t1 = *data.times_grid.value_at(p1);
    if !t1.is_finite() {
        return None;
    }

    let p2x = px + 2 * sx;
    let p2y = py + 2 * sy;

    if in_bounds(p2x, p2y, w, h) {
        let p2 = [p2x as usize, p2y as usize];

        if data.status_grid.is_known(p2) {
            let t2 = *data.times_grid.value_at(p2);

            if t2.is_finite() && t2 <= t1 {
                // Second-order one-sided derivative.
                //
                // For sx = -1:
                // D_x T ~= (3T_i - 4T_{i-1} + T_{i-2}) / (2h)
                //
                // For sx = +1:
                // D_x T ~= (T_{i+1} - T_i) / h at first order, and
                // D_x T ~= -(3T_i - 4T_{i+1} + T_{i+2}) / (2h)
                // at second order.
                //
                // So in general:
                //
                // D_axis T = sign * (3T - 4T1 + T2) / (2h)
                //
                // with sign = +1 for negative-direction stencil and
                // sign = -1 for positive-direction stencil.

                let sign = if sx < 0 || sy < 0 { 1.0 } else { -1.0 };

                let alpha = sign * 3.0 / (2.0 * spacing);
                let beta = sign * (-4.0 * t1 + t2) / (2.0 * spacing);

                return Some((alpha, beta, t1));
            }
        }
    }

    // First-order fallback.
    let sign = if sx < 0 || sy < 0 { 1.0 } else { -1.0 };

    let alpha = sign / spacing;
    let beta = -sign * t1 / spacing;

    Some((alpha, beta, t1))
}

fn in_bounds(x: i32, y: i32, w: usize, h: usize) -> bool {
    x >= 0 && y >= 0 && x < w as i32 && y < h as i32
}
