use geo::Winding;

use crate::{Polygon, geo_compatibility::copy_shape_into_geo_linestring};

pub enum WindingOrder {
    Clockwise,
    CounterClockwise,
}

pub fn polygon_winding_order(gon: &Polygon) -> Option<WindingOrder> {
    let geoline: geo::LineString = copy_shape_into_geo_linestring(gon);

    match geoline.winding_order() {
        None => None,
        Some(geo::winding_order::WindingOrder::Clockwise) => Some(WindingOrder::Clockwise),
        Some(geo::winding_order::WindingOrder::CounterClockwise) => {
            Some(WindingOrder::CounterClockwise)
        }
    }
}
