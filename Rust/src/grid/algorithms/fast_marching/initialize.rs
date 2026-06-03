use crate::grid::{
    algorithms::fast_marching::{heap::FastMarchingHeap, status::Status},
    grid_struct::Grid,
};

pub struct FastMarchingState<'a> {
    pub heap: FastMarchingHeap,
    pub status_grid: Grid<Status>,
    pub times_grid: &'a mut Grid<f64>,
}

pub fn initialize<'a>(times: &'a mut Grid<f64>) -> FastMarchingState<'a> {
    let mut heap = FastMarchingHeap::new();

    let status_grid = times.map(|p, v| {
        if v.is_finite() {
            heap.insert_or_decrease_key(p, *v);
            Status::Considered
        } else {
            debug_assert!(*v > 0.0);
            Status::Far
        }
    });

    FastMarchingState {
        heap,
        status_grid,
        times_grid: times,
    }
}
