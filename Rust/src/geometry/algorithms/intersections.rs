mod line_segments;

mod intersection_bools;
mod modify_polyline_intersections;
mod self_intersections;
mod shape_intersections;
mod utils;

#[allow(unused)]
pub use intersection_bools::{intersects, self_intersects};
#[allow(unused)]
pub use self_intersections::find_self_intersections as self_intersections;
#[allow(unused)]
pub use shape_intersections::find_shape_intersections as shape_intersections;

#[allow(unused)]
pub use modify_polyline_intersections::*;
