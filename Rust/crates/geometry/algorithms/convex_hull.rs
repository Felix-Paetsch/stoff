use crate::geometry::{Polygon, Vector, geo_compatibility::VectorSlice};
use geo::ConvexHull;

pub fn convex_hull(of: &[Vector]) -> Polygon {
    let hull = ConvexHull::convex_hull(&VectorSlice::Raw(of));
    Polygon::from(hull)
}
