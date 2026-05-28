pub mod bounding_box;
mod geometry;
mod line_segment;
mod polygon;
mod polyline;
mod shape;
mod shape_trait;
mod shape_utils;
mod vector;

pub use shape_utils::shape_position::{ShapePosition, ShapePositionDescriptor};

pub use geometry::Geometry;
pub use line_segment::LineSegment;
pub use polygon::Polygon;
pub use polyline::Polyline;
pub use shape::Shape;
pub use shape_trait::ShapeT;
pub use shape_utils::appreciable;
pub use vector::Vector;

#[allow(unused)]
pub use shape_utils::length_map;
