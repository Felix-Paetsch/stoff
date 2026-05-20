mod area;
mod buffer;
mod closest_shape_positions;
mod closest_shape_positions_wasm;
mod concave_hull;
mod contains;
mod convex_hull;
mod intersections;
mod polygons_and_points;
mod simplify;
mod winding;

#[allow(unused)]
pub use buffer::buffer_geometries as buffer;
#[allow(unused)]
pub use closest_shape_positions::{closest_point_position_on_shape, closest_shape_positions};
