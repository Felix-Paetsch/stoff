use crate::grid::grid_struct::{Grid, GridPosition};

#[derive(PartialEq, Debug)]
pub enum Status {
    Known,
    Considered,
    Far,
}

impl Grid<Status> {
    pub fn make_known(&mut self, p: GridPosition) {
        debug_assert_eq!(*self.value_at(p), Status::Considered);
        self.set_value_at(p, Status::Known);
    }

    pub fn consider(&mut self, p: GridPosition) {
        if *self.value_at(p) == Status::Far {
            self.set_value_at(p, Status::Considered);
        }
    }

    #[allow(unused)]
    pub fn is_known(&self, p: GridPosition) -> bool {
        matches!(self.value_at(p), Status::Known)
    }
}
