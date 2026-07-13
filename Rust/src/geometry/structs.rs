mod bounding_box;
mod geometry;
mod line_segment;
mod matrix;
mod shapes;
mod vector;

pub mod geo_compatibility;

pub use geometry::Geometry;
pub use line_segment::LineSegment;

pub use matrix::Matrix;

pub use shapes::shape_utils::appreciable;
pub use shapes::shape_utils::length_map;
pub use shapes::shape_utils::shape_position::{ShapePosition, ShapePositionDescriptor};
#[allow(unused)]
pub use shapes::{Polygon, Polyline, Shape, ShapeReference, ShapeT};

pub use bounding_box::BoundingBox;
pub use vector::Vector;

