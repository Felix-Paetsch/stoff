// Implementation of https://essay.utwente.nl/fileshare/file/75601/Alblas_BA_EWI.pdf
// Rough reference: Dieuwertje Alblas, Implementing and Analysing the Fast Marching Method (Bachelors Thesis)

use crate::{
    geometry::Vector,
    grid::{
        algorithms::fast_marching::{
            arrival_time_update_fns::{
                base_second_order::base_second_order_arrival_time_update_fn,
                directional::directional_arrival_time_update_fn,
            },
            initialize::{FastMarchingState, initialize},
        },
        grid_struct::{Grid, GridPosition},
    },
};

pub fn solve_general_fast_marching(
    times: &mut Grid<f64>,
    arrival_update_fn: &impl Fn(&FastMarchingState, GridPosition) -> f64,
) {
    let mut fast_marching_data = initialize(times);

    while let Some(min_pos) = fast_marching_data.heap.extract_min() {
        if !min_pos.1.is_finite() {
            break;
        }
        fast_marching_data.status_grid.make_known(min_pos.0);

        for p in fast_marching_data.times_grid.adjacent_positions8(min_pos.0) {
            fast_marching_data.status_grid.consider(p);
            let curr_time = *fast_marching_data.times_grid.value_at(p);
            let new_time = arrival_update_fn(&fast_marching_data, p);
            if new_time < curr_time {
                fast_marching_data.times_grid.set_value_at(p, new_time);
                fast_marching_data.heap.insert_or_decrease_key(p, new_time);
            }
        }
    }
}

pub fn solve_fast_marching(times: &mut Grid<f64>, speed_map: &Grid<f64>) {
    let update_fn = base_second_order_arrival_time_update_fn(speed_map);
    // let update_fn = multi_stencil_second_order_arrival_time_update_fn(speed_map);
    solve_general_fast_marching(times, &update_fn);
}

#[allow(unused)]
pub fn solve_directional_fast_marching(times: &mut Grid<f64>, tensor_map: &Grid<Vector>) {
    let update_fn = directional_arrival_time_update_fn(tensor_map);
    solve_general_fast_marching(times, &update_fn);
}
