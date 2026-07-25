use geo::{Intersects, Validation};

use crate::{Geometry, Shape};

pub fn geometries_intersect(l1: &Geometry, l2: &Geometry) -> bool {
    let geogeom1: geo::Geometry = l1.clone().into();
    let geogeom2: geo::Geometry = l2.clone().into();
    geogeom1.intersects(&geogeom2)
}

pub fn shape_self_intersects(s: &Shape) -> bool {
    match s {
        Shape::Polygon(p) => {
            let geogon: geo::Polygon = p.clone().into();
            geogon.is_valid()
        }
        Shape::Polyline(l) => {
            let geoline: geo::LineString = l.clone().into();
            geoline.is_valid()
        }
    }
}
