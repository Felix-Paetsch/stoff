use std::cmp::Ordering;

use crate::{
    geometry::Vector,
    grid::{
        algorithms::fast_marching::initialize::FastMarchingState,
        grid_struct::{Grid, GridPosition},
    },
};

pub fn tensor_arrival_time_update_fn<'a>(
    speed_grid: &'a Grid<Vector>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    let [w, h] = speed_grid.lattice_dimensions();
    debug_assert!(w > 2 && h > 2);
    debug_assert!(speed_grid.iter().all(|v| v.x().min(v.y()) >= 0.0));

    let v00 = speed_grid.vector_at([0, 0]);
    let v01 = speed_grid.vector_at([1, 0]);
    let v11 = speed_grid.vector_at([1, 1]);

    let dir_vectors = [v01.subtract(v00), v11.subtract(v01), v11.subtract(v00)];
    let tensor_coeffs = [
        dir_vectors[0].scale(1.0 / dir_vectors[0].length_squared()),
        dir_vectors[1].scale(1.0 / dir_vectors[1].length_squared()),
        dir_vectors[2].scale(1.0 / dir_vectors[2].length_squared()),
    ];

    move |data: &FastMarchingState, p: GridPosition| {
        let times: &Grid<f64> = data.times_grid;
        debug_assert!(times.same_dimensions(speed_grid));

        let positions8 = [
            // Cross (4-way)
            (p[0] > 0).then(|| ([p[0] - 1, p[1]], tensor_coeffs[0])), // left
            (p[0] < w - 1).then(|| ([p[0] + 1, p[1]], tensor_coeffs[0])), // right
            (p[1] > 0).then(|| ([p[0], p[1] - 1], tensor_coeffs[1])), // up
            (p[1] < h - 1).then(|| ([p[0], p[1] + 1], tensor_coeffs[1])), // down
            // Diagonals
            (p[0] > 0 && p[1] > 0).then(|| ([p[0] - 1, p[1] - 1], tensor_coeffs[2])),
            (p[0] > 0 && p[1] < h - 1).then(|| ([p[0] - 1, p[1] + 1], tensor_coeffs[2])),
            (p[0] < w - 1 && p[1] > 0).then(|| ([p[0] + 1, p[1] - 1], tensor_coeffs[2])),
            (p[0] < w - 1 && p[1] < h - 1).then(|| ([p[0] + 1, p[1] + 1], tensor_coeffs[2])),
        ]
        .into_iter()
        .flatten();

        let orig_time = *times.value_at(p);
        positions8
            .map(|q| tensor_calculate_arrival_time_from_to(times, q.0, p, speed_grid, q.1))
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

fn tensor_calculate_arrival_time_from_to(
    times_grid: &Grid<f64>,
    from: GridPosition,
    to: GridPosition,
    speed_map: &Grid<Vector>,
    tensor_coeff: Vector,
) -> f64 {
    let time_from = times_grid.value_at(from);
    let time_to = times_grid.value_at(to);

    if time_from > time_to {
        return *time_to;
    }

    let speed_from = speed_map.value_at(from);
    let speed_to = speed_map.value_at(to);

    let avg_speed = speed_from.add(*speed_to).scale(0.5);

    time_from + 1.0 / avg_speed.dot(tensor_coeff)
}
