// Implementation of https://essay.utwente.nl/fileshare/file/75601/Alblas_BA_EWI.pdf
// Rough reference: Dieuwertje Alblas, Implementing and Analysing the Fast Marching Method (Bachelors Thesis)

use geometry::Matrix;

use crate::grid::{
    algorithms::fast_marching::{
        arrival_time_update_fns::{
            anisotropic_triangle::anisotropic_triangle_arrival_time_update_fn,
            isotropic_second_order_single_stencil::isotropic_second_order_single_stencil_arrival_time_update_fn,
        },
        initialize::{FastMarchingState, initialize},
    },
    grid_struct::{Grid, GridPosition},
};

// pub enum FastMarchingNeighborhoodSize {
//     Four,
//     Eight,
// }

pub fn solve_general_fast_marching(
    times: &mut Grid<f64>,
    arrival_update_fn: &impl Fn(&FastMarchingState, GridPosition) -> f64,
    // update_nbh: FastMarchingNeighborhoodSize,
) {
    let mut fast_marching_data = initialize(times);

    while let Some(min_pos) = fast_marching_data.heap.extract_min() {
        debug_assert!(!fast_marching_data.status_grid.is_known(min_pos.0));

        if !min_pos.1.is_finite() {
            break;
        }

        fast_marching_data.status_grid.make_known(min_pos.0);

        for p in fast_marching_data.times_grid.adjacent_positions4(min_pos.0) {
            if fast_marching_data.status_grid.is_known(p) {
                continue;
            }

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
    let update_fn = isotropic_second_order_single_stencil_arrival_time_update_fn(speed_map);
    solve_general_fast_marching(times, &update_fn);
}

/// Solve the anisotropic eikonal equation:
///
///     grad(T)^T M grad(T) = 1
///
/// where `M` is a symmetric positive-definite squared-speed tensor.
///
/// For a diagonal tensor:
///
///     M = diag(vx^2, vy^2)
///
/// propagation speeds are `vx` horizontally and `vy` vertically.
///
/// `times[p]` has special source semantics:
///
/// - `INFINITY`: no externally scheduled source at `p`.
/// - finite value `s`: a source activates at time `s`, unless a wave reaches
///   `p` earlier.
///
/// In other words, every finite input value is an upper bound on the final
/// arrival time at that grid point.
pub fn solve_tensor_fast_marching(times: &mut Grid<f64>, tensor_map: &Grid<Matrix>) {
    assert_eq!(
        times.lattice_dimensions(),
        tensor_map.lattice_dimensions(),
        "times and tensor_map must have equal lattice dimensions"
    );

    let update_fn = anisotropic_triangle_arrival_time_update_fn(tensor_map);
    solve_general_fast_marching(times, &update_fn);
}
