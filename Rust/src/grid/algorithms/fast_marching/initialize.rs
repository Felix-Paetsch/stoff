use crate::grid::{
    algorithms::fast_marching::{heap::FastMarchingHeap, status::FastMarchingStatus},
    grid_struct::Grid,
};

pub struct FastMarchingState<'a> {
    pub(super) heap: FastMarchingHeap,
    pub status_grid: Grid<FastMarchingStatus>,
    pub times_grid: &'a mut Grid<f64>,
}

pub fn initialize<'a>(times: &'a mut Grid<f64>) -> FastMarchingState<'a> {
    let mut heap = FastMarchingHeap::new();

    let status_grid = times.map(|p, v| {
        debug_assert!(v.is_finite() || *v == f64::INFINITY);
        debug_assert!(*v >= 0.0);

        if v.is_finite() {
            heap.insert_or_decrease_key(p, *v);
            FastMarchingStatus::Considered
        } else {
            debug_assert!(*v > 0.0);
            FastMarchingStatus::Far
        }
    });

    FastMarchingState {
        heap,
        status_grid,
        times_grid: times,
    }
}
