use crate::{ShapeT, Vector};

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

impl<'a> LengthRecursionData<'a> {
    pub fn new(
        shape: &impl ShapeT,
        lengths: &'a [f64],
        v: impl Fn(Vector) -> f64,
    ) -> LengthRecursionData<'a> {
        debug_assert!(!shape.is_empty());
        debug_assert_eq!(shape.looping_vertex_count(), lengths.len() + 1);

        LengthRecursionData {
            lengths,
            left: RecursiveLineBoundary {
                vertex_index: 0,
                guaranteed_distance: v(shape.vertex_at(0)),
            },
            right: RecursiveLineBoundary {
                vertex_index: shape.looping_vertex_count(),
                guaranteed_distance: v(shape.vertex_at(shape.looping_vertex_count())),
            },
        }
    }
}
