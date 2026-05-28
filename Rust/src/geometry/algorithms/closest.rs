mod closest_linesegment_linesegment;
mod closest_linesegment_point;
mod closest_linesegment_shape_position;
mod closest_point_shape_position;
mod closest_positions_wasm;
mod closest_shape_shape_position;

#[allow(unused)]
pub use closest_linesegment_linesegment::{closest_linesegment_points, ClosestLineSegmentPoints};
#[allow(unused)]
pub use closest_linesegment_point::{
    closest_point_on_linesegment, ClosestPointOnLinesegmentResult,
};
#[allow(unused)]
pub use closest_linesegment_shape_position::{
    closest_linesegment_shape_position, closest_linesegment_shape_position_with_length_map,
    ClosestLinesegmentToShapePosition,
};
#[allow(unused)]
pub use closest_point_shape_position::{
    closest_point_on_shape, closest_point_on_shape_with_length_map, ClosestPointOnShapeResult,
};
#[allow(unused)]
pub use closest_shape_shape_position::{
    closest_shape_positions, closest_shape_positions_with_length_maps, ClosestShapePositionsResult,
};

pub(super) use closest_point_shape_position::*;
