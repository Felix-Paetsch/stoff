use std::ops::Range;

use crate::grid::{
    algorithms::fast_marching::initialize::FastMarchingState,
    grid_struct::{Grid, GridPosition},
};

#[allow(unused)]
pub fn isotropic_naive_linear_arrival_time_update_fn<'a>(
    speed_grid: &'a Grid<f64>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    debug_assert!(speed_grid.iter().all(|x| *x >= 0.0));

    let [w, h] = speed_grid.lattice_dimensions();
    debug_assert!(w > 2 && h > 2);

    let [_, _, domw, domh] = speed_grid.domain_dimensions();
    let dx = domw / (w as f64 - 1.0);
    let dy = domh / (h as f64 - 1.0);

    let w_interval: Range<i32> = 0..(w as i32);
    let h_interval: Range<i32> = 0..(h as i32);

    let diag_len = (dx * dx + dy * dy).sqrt();

    move |data: &FastMarchingState, p: GridPosition| {
        let px = p[0] as i32;
        let py = p[1] as i32;

        let current_time = *data.times_grid.value_at(p);
        let root_speed = *speed_grid.value_at(p);

        if root_speed <= 0.0 {
            return current_time;
        }

        let mut best_time = current_time;

        for ddx in -1..=1 {
            for ddy in -1..=1 {
                if ddx == 0 && ddy == 0 {
                    continue;
                }

                let qx = px + ddx;
                let qy = py + ddy;

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

                let neighbor_speed = *speed_grid.value_at(q);
                let avg_speed = 0.5 * (root_speed + neighbor_speed);

                if avg_speed <= 0.0 {
                    continue;
                }

                let step_distance = match (ddx != 0, ddy != 0) {
                    (true, true) => diag_len,
                    (true, false) => dx,
                    (false, true) => dy,
                    (false, false) => unreachable!(),
                };

                let candidate = neighbor_time + step_distance / avg_speed;
                best_time = best_time.min(candidate);
            }
        }

        best_time
    }
}
