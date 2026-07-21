mod closest_linesegment_linesegment;
mod closest_linesegment_point;
mod closest_linesegment_shape_position;
mod closest_point_shape_position;
mod closest_shape_shape_position;

#[allow(unused)]
pub use closest_linesegment_linesegment::{ClosestLineSegmentPoints, closest_linesegment_points};
#[allow(unused)]
pub use closest_linesegment_point::{
    ClosestPointOnLinesegmentResult, closest_point_on_linesegment,
};
#[allow(unused)]
pub use closest_linesegment_shape_position::{
    ClosestLinesegmentToShapePosition, closest_linesegment_shape_position,
    closest_linesegment_shape_position_with_length_map,
};
#[allow(unused)]
pub use closest_point_shape_position::{
    ClosestPointOnShapeResult, closest_point_on_shape, closest_point_on_shape_with_length_map,
};
#[allow(unused)]
pub use closest_shape_shape_position::{
    ClosestShapePositionsResult, closest_shape_positions, closest_shape_positions_with_length_maps,
};

pub(super) use closest_point_shape_position::*;

mod lazy_closest_shape_positions;
pub use lazy_closest_shape_positions::{LazyClosestShapePositions, ShapeDistanceDatum};
