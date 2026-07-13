use crate::{
    geometry::Matrix,
    grid::{
        algorithms::fast_marching::initialize::FastMarchingState,
        grid_struct::{Grid, GridPosition},
    },
};

#[allow(unused)]
pub fn anisotropic_second_order_single_stencil_arrival_time_update_fn<'a>(
    metric_grid: &'a Grid<Matrix>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    // Assuming symmetric positive semidefinite 2x2 metric tensors.
    debug_assert!(
        metric_grid
            .iter()
            .all(|m| m.a() >= 0.0 && m.det() >= 0.0 && (m.b() - m.c()).abs() < 0.01)
    );

    let [w, h] = metric_grid.lattice_dimensions();
    debug_assert!(w > 2 && h > 2);

    let [_, _, domw, domh] = metric_grid.domain_dimensions();
    let hx = domw / (w as f64 - 1.0);
    let hy = domh / (h as f64 - 1.0);

    move |data: &FastMarchingState, p: GridPosition| {
        let old_t = *data.times_grid.value_at(p);
        let m = metric_grid.value_at(p);

        let mx = m.a();
        let mxy = m.b();
        let my = m.c();

        let mut best = old_t;

        for sx in [-1_i32, 1_i32] {
            let Some((ax, bx, min_tx)) = second_order_axis_stencil(data, p, [sx, 0], w, h, hx)
            else {
                continue;
            };

            for sy in [-1_i32, 1_i32] {
                let Some((ay, by, min_ty)) = second_order_axis_stencil(data, p, [0, sy], w, h, hy)
                else {
                    continue;
                };

                // Solve:
                //
                // [Dx(T), Dy(T)] M [Dx(T), Dy(T)]^T = 1
                //
                // where:
                //
                // Dx(T) = ax * T + bx
                // Dy(T) = ay * T + by

                let qa = mx * ax * ax + 2.0 * mxy * ax * ay + my * ay * ay;

                let qb = 2.0 * (mx * ax * bx + mxy * (ax * by + ay * bx) + my * ay * by);

                let qc = mx * bx * bx + 2.0 * mxy * bx * by + my * by * by - 1.0;

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

                    // Causality / upwind consistency:
                    //
                    // Candidate must not be smaller than the neighboring
                    // accepted values used by the stencil.
                    if candidate < min_tx || candidate < min_ty {
                        continue;
                    }

                    if candidate < best {
                        best = candidate;
                    }
                }
            }
        }

        best
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
                // Second-order one-sided derivative:
                //
                // If direction = -x:
                // D_x T ~= (3T_i - 4T_{i-1} + T_{i-2}) / (2h)
                //
                // If direction = +x:
                // D_x T ~= -(3T_i - 4T_{i+1} + T_{i+2}) / (2h)
                //
                // More generally, derivative component along the positive
                // coordinate axis is:
                //
                // D_axis T = sign * (3T - 4T1 + T2) / (2h)
                //
                // where sign is +1 for backward stencil and -1 for forward
                // stencil.

                let sign = if sx < 0 || sy < 0 { 1.0 } else { -1.0 };

                let alpha = sign * 3.0 / (2.0 * spacing);
                let beta = sign * (-4.0 * t1 + t2) / (2.0 * spacing);

                return Some((alpha, beta, t1));
            }
        }
    }

    // First-order fallback:
    //
    // If direction = -x:
    // D_x T ~= (T_i - T_{i-1}) / h
    //
    // If direction = +x:
    // D_x T ~= (T_{i+1} - T_i) / h
    //       = -(T_i - T_{i+1}) / h

    let sign = if sx < 0 || sy < 0 { 1.0 } else { -1.0 };

    let alpha = sign / spacing;
    let beta = -sign * t1 / spacing;

    Some((alpha, beta, t1))
}

fn in_bounds(x: i32, y: i32, w: usize, h: usize) -> bool {
    x >= 0 && y >= 0 && x < w as i32 && y < h as i32
}
