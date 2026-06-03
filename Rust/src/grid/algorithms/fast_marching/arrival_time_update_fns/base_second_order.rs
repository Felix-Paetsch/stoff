use std::cmp::Ordering;

use crate::grid::{
    algorithms::fast_marching::initialize::FastMarchingState,
    grid_struct::{Grid, GridPosition},
};

#[allow(unused)]
pub fn base_second_order_arrival_time_update_fn<'a>(
    speed_grid: &'a Grid<f64>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    let [w, h] = speed_grid.lattice_dimensions();
    debug_assert!(w > 2 && h > 2);

    let v00 = speed_grid.vector_at([0, 0]);
    let v01 = speed_grid.vector_at([1, 0]);
    let v11 = speed_grid.vector_at([1, 1]);
    let cell_dimensions = [v00.distance(v01), v01.distance(v11), v00.distance(v11)];

    move |data: &FastMarchingState, p: GridPosition| {
        debug_assert!(data.times_grid.same_dimensions(speed_grid));

        let straight_schemes: [([i32; 2], f64); 8] = [
            // Cross (4-way)
            ([-1, 0], cell_dimensions[0]), // left
            ([1, 0], cell_dimensions[0]),  // right
            ([0, -1], cell_dimensions[1]), // up
            ([0, 1], cell_dimensions[1]),  // down
            // Diagonals
            ([-1, -1], cell_dimensions[2]), // left up
            ([1, -1], cell_dimensions[2]),  // right up
            ([1, 1], cell_dimensions[2]),   // right down
            ([-1, 1], cell_dimensions[2]),  // left down
        ];

        let corner_schemes: [[i32; 2]; 4] = [
            [-1, -1], // left up
            [1, -1],  // right up
            [1, 1],   // right down
            [-1, 1],  // left down
        ];

        let orig_time = *data.times_grid.value_at(p);
        let straight_schems_iter = straight_schemes
            .into_iter()
            .flat_map(|q| straight_distance_scheme(data.times_grid, speed_grid, p, q.0, q.1));

        let corner_schemes_iter = corner_schemes.into_iter().flat_map(|q| {
            corner_distance_scheme(
                data,
                speed_grid,
                p,
                q,
                [cell_dimensions[0], cell_dimensions[1]],
            )
        });

        straight_schems_iter
            .chain(corner_schemes_iter)
            .min_by(|a, b| {
                if a.is_nan() && b.is_nan() {
                    Ordering::Equal
                } else if b.is_nan() {
                    Ordering::Less
                } else {
                    a.total_cmp(b)
                }
            })
            .unwrap_or(orig_time)
    }
}

fn corner_distance_scheme(
    state: &FastMarchingState,
    speed_grid: &Grid<f64>,
    root_index: GridPosition,
    delta_index: [i32; 2],  // both deltas lead to the diagonal offset
    grid_spacing: [f64; 2], // w, h, diag
) -> Option<f64> {
    if (root_index[0] == 0 && delta_index[0] < 0) || (root_index[1] == 0 && delta_index[1] < 0) {
        return None;
    }

    let diag_index: GridPosition = [
        ((root_index[0] as i32) + delta_index[0]) as usize,
        ((root_index[1] as i32) + delta_index[1]) as usize,
    ];

    let [lattice_w, lattice_h] = state.times_grid.lattice_dimensions();
    if diag_index[0] >= lattice_w || diag_index[1] >= lattice_h {
        return None;
    }

    let time_root = *state.times_grid.value_at(root_index);
    let time_adj_x = *state.times_grid.value_at([diag_index[0], root_index[1]]);
    let time_adj_y = *state.times_grid.value_at([root_index[0], diag_index[1]]);

    let speed_root = *speed_grid.value_at(root_index);

    if time_root <= time_adj_x || time_root <= time_adj_y {
        return None;
    }

    if (root_index[0] < 2 && delta_index[0] < 0)
        || (root_index[1] < 2 && delta_index[1] < 0)
        || (root_index[0] >= lattice_w - 2 && delta_index[0] > 0)
        || (root_index[1] >= lattice_h - 2 && delta_index[1] > 0)
    {
        return corner_first_order_distance_scheme(
            time_adj_x,
            time_adj_y,
            speed_root,
            grid_spacing,
        );
    }

    let diag2_index: GridPosition = [
        ((root_index[0] as i32) + 2 * delta_index[0]) as usize,
        ((root_index[1] as i32) + 2 * delta_index[1]) as usize,
    ];

    let time_2adj_x = *state.times_grid.value_at([diag2_index[0], root_index[1]]);
    let time_2adj_y = *state.times_grid.value_at([root_index[0], diag2_index[1]]);

    if !state.status_grid.is_known([diag2_index[0], root_index[1]])
        || !state.status_grid.is_known([root_index[0], diag2_index[1]])
        || time_2adj_y >= time_adj_y
        || time_2adj_x >= time_adj_x
    {
        return corner_first_order_distance_scheme(
            time_adj_x,
            time_adj_y,
            speed_root,
            grid_spacing,
        );
    }

    // Following
    // https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=4288158

    let tx = (4.0 * time_adj_x - time_2adj_x) / 3.0;
    let ty = (4.0 * time_adj_y - time_2adj_y) / 3.0;

    // Solve (3/2 * (T - T_1) / Delta_1)² + (3/2 * (T - T_2) / Delta_2)² = 1 / vel^2
    // Moving over 3/2 we can use the same formula as below!

    let sum_delta = grid_spacing[0] + grid_spacing[1];
    let t1delta2 = tx * grid_spacing[1];
    let t2delta1 = ty * grid_spacing[0];

    // x² + px + q
    let p_halfs = -(t1delta2 + t2delta1) / sum_delta;
    let q = (tx * t1delta2 + ty * t2delta1
        - grid_spacing[0] * grid_spacing[1] / (speed_root * speed_root * 4.0 / 9.0))
        / sum_delta;

    let rad = p_halfs * p_halfs - q;

    if rad <= 0.0 {
        return None;
    }

    let pred_t = -p_halfs + rad.sqrt();
    if pred_t > time_adj_x.max(time_adj_y) {
        Some(pred_t)
    } else {
        None
    }
}

fn corner_first_order_distance_scheme(
    time_adj_x: f64,
    time_adj_y: f64,
    speed_root: f64,
    grid_spacing: [f64; 2],
) -> Option<f64> {
    // Solve ((T - T_1) / Delta_1)² + ((T - T_2) / Delta_2)² = 1 / vel^2
    let sum_delta = grid_spacing[0] + grid_spacing[1];
    let t1delta2 = time_adj_x * grid_spacing[1];
    let t2delta1 = time_adj_y * grid_spacing[0];

    // x² + px + q
    let p_halfs = -(t1delta2 + t2delta1) / sum_delta;
    let q = (time_adj_x * t1delta2 + time_adj_y * t2delta1
        - grid_spacing[0] * grid_spacing[1] / (speed_root * speed_root))
        / sum_delta;

    let rad = p_halfs * p_halfs - q;
    if rad <= 0.0 {
        return None;
    }

    let pred_t = -p_halfs + rad.sqrt();
    if pred_t > time_adj_x.max(time_adj_y) {
        Some(pred_t)
    } else {
        None
    }
}

fn straight_distance_scheme(
    times_grid: &Grid<f64>,
    speed_grid: &Grid<f64>,
    root_index: GridPosition,
    delta_index: [i32; 2],
    distance: f64,
) -> Option<f64> {
    if root_index[0] == 0 && delta_index[0] < 0 || root_index[1] == 0 && delta_index[1] < 0 {
        return None;
    }

    let middle_index: GridPosition = [
        ((root_index[0] as i32) + delta_index[0]) as usize,
        ((root_index[1] as i32) + delta_index[1]) as usize,
    ];

    let [lattice_w, lattice_h] = times_grid.lattice_dimensions();
    if middle_index[0] >= lattice_w || middle_index[1] >= lattice_h {
        return None;
    }

    let time_root = *times_grid.value_at(root_index);
    let time_middle = *times_grid.value_at(middle_index);
    let speed_root = *speed_grid.value_at(root_index);
    let speed_middle = *speed_grid.value_at(middle_index);

    if time_middle > time_root {
        return None;
    }

    straigt_first_order_distance(time_middle, speed_middle, speed_root, distance)
}

fn straigt_first_order_distance(
    time_from: f64,
    speed_from: f64,
    speed_to: f64,
    distance: f64,
) -> Option<f64> {
    let avg_speed = (speed_from + speed_to) * 0.5;
    Some(time_from + distance / avg_speed)
}
