use geo::ConvexHull;

use crate::{Polygon, Vector, geo_compatibility::VectorSlice};

pub fn convex_hull(of: &[Vector]) -> Polygon {
    let hull = ConvexHull::convex_hull(&VectorSlice::Raw(of));
    Polygon::from(hull)
}
