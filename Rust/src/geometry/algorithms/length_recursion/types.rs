#[derive(Clone, Copy, Debug)]
pub struct RecursiveLineBoundary {
    pub vertex_index: usize,
    pub guaranteed_distance: f64,
}

#[derive(Clone, Copy)]
pub struct LengthRecursionData<'a> {
    pub lengths: &'a [f64],
    pub left: RecursiveLineBoundary,
    pub right: RecursiveLineBoundary,
}
