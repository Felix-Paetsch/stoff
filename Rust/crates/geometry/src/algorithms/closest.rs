mod closest_linesegment_linesegment;
mod closest_linesegment_point;
mod closest_linesegment_shape_position;
mod closest_point_shape_position;
mod closest_shape_shape_position;

mod lazy_closest_shape_positions;
pub use lazy_closest_shape_positions::{LazyClosestShapePositions, ShapeDistanceDatum};

pub use closest_linesegment_linesegment::{ClosestLineSegmentPoints, closest_linesegment_points};
pub use closest_linesegment_point::{
    ClosestPointOnLinesegmentResult, closest_point_on_linesegment,
};

pub use closest_linesegment_shape_position::{
    ClosestPointToLinesegmentOnShapeResult, closest_point_to_linesegment_on_shape,
    closest_point_to_linesegment_on_shape_with_length_map,
};
pub use closest_point_shape_position::{
    ClosestPointOnShapeResult, closest_point_on_shape, closest_point_on_shape_with_length_map,
};
pub use closest_shape_shape_position::{
    ClosestShapePositionsResult, closest_shape_positions, closest_shape_positions_with_length_maps,
};

pub(crate) use closest_point_shape_position::closest_point_on_shape_with_length_map_recursion;
