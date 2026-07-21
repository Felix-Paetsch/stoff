mod line_segments;

mod intersection_bools;
mod self_intersections;
mod shape_intersections;
mod utils;

pub use intersection_bools::{geometries_intersect, shape_self_intersects};
pub use self_intersections::find_shape_self_intersections;
pub use shape_intersections::find_shape_intersections;
pub use utils::Intersection as ShapeIntersection;
