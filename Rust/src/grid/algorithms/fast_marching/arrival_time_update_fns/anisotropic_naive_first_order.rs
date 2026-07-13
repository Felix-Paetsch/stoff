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
pub fn anisotropic_naive_first_order_arrival_time_update_fn<'a>(
    metric_grid: &'a Grid<Matrix>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    // Assuming each matrix is symmetric positive semidefinite.
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

                let neighbor_time = *data.times_grid.value_at(q);
                if !neighbor_time.is_finite() {
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

                let candidate = neighbor_time + step_cost_sq.sqrt();
                best_time = best_time.min(candidate);
            }
        }

        best_time
    }
}
