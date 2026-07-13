use std::ops::Range;

use crate::{
    geometry::{Matrix, Vector},
    grid::{
        algorithms::fast_marching::initialize::FastMarchingState,
        grid_struct::{Grid, GridPosition},
    },
    numerics::vector_space::RVectorSpace,
};

#[allow(unused)]
pub fn anisotropic_naive_second_order_arrival_time_update_fn<'a>(
    metric_grid: &'a Grid<Matrix>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    // Assuming symmetric positive semidefinite metric tensors.
    debug_assert!(metric_grid.iter().all(|m| m.a() >= 0.0 && m.det() >= 0.0));

    let [w, h] = metric_grid.lattice_dimensions();
    debug_assert!(w > 2 && h > 2);

    let [_, _, domw, domh] = metric_grid.domain_dimensions();
    let dx = domw / (w as f64 - 1.0);
    let dy = domh / (h as f64 - 1.0);

    let w_interval: Range<i32> = 0..(w as i32);
    let h_interval: Range<i32> = 0..(h as i32);

    move |data: &FastMarchingState, p: GridPosition| {
        let px = p[0] as i32;
        let py = p[1] as i32;

        let current_time = *data.times_grid.value_at(p);
        let root_metric = metric_grid.value_at(p);

        let mut best_time = current_time;

        for sx in -1..=1 {
            for sy in -1..=1 {
                if sx == 0 && sy == 0 {
                    continue;
                }

                let qx = px + sx;
                let qy = py + sy;

                if !w_interval.contains(&qx) || !h_interval.contains(&qy) {
                    continue;
                }

                let q = [qx as usize, qy as usize];

                if !data.status_grid.is_known(q) {
                    continue;
                }

                let tq = *data.times_grid.value_at(q);
                if !tq.is_finite() {
                    continue;
                }

                let neighbor_metric = metric_grid.value_at(q);
                let avg_metric = root_metric.add(neighbor_metric).scale(0.5);

                let step = Vector::new(sx as f64 * dx, sy as f64 * dy);
                let metric_step = avg_metric.mult_vec(step);
                let step_cost_sq = step.dot(metric_step);

                if step_cost_sq < 0.0 {
                    continue;
                }

                let step_cost = step_cost_sq.sqrt();

                // First-order candidate:
                let first_order = tq + step_cost;
                best_time = best_time.min(first_order);

                // Try second-order extrapolation using the next point farther
                // along the same direction.
                let rx = px + 2 * sx;
                let ry = py + 2 * sy;

                if !w_interval.contains(&rx) || !h_interval.contains(&ry) {
                    continue;
                }

                let r = [rx as usize, ry as usize];

                if !data.status_grid.is_known(r) {
                    continue;
                }

                let tr = *data.times_grid.value_at(r);
                if !tr.is_finite() {
                    continue;
                }

                // Monotone upwind consistency: farther point should not be
                // smaller than the nearer point.
                if tr > tq {
                    continue;
                }

                // Optional averaged metric over the longer stencil could be used,
                // but keeping the local one-step cost is the closest analogue
                // to the standard second-order upwind effective-spacing update.
                let second_order = (4.0 * tq - tr + 2.0 * step_cost) / 3.0;
                best_time = best_time.min(second_order);
            }
        }

        best_time
    }
}
