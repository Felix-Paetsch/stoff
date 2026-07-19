use crate::grid::grid_struct::{Grid, GridPosition};

#[derive(PartialEq, Debug)]
pub enum FastMarchingStatus {
    Known,
    Considered,
    Far,
}

impl Grid<FastMarchingStatus> {
    pub fn make_known(&mut self, p: GridPosition) {
        debug_assert_eq!(*self.value_at(p), FastMarchingStatus::Considered);
        self.set_value_at(p, FastMarchingStatus::Known);
    }

    pub fn consider(&mut self, p: GridPosition) {
        self.set_value_at(p, FastMarchingStatus::Considered);
    }

    pub fn is_known(&self, p: GridPosition) -> bool {
        matches!(self.value_at(p), FastMarchingStatus::Known)
    }

    pub fn is_considered(&self, p: GridPosition) -> bool {
        matches!(self.value_at(p), FastMarchingStatus::Considered)
    }
}
