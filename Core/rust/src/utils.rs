use geo::LineString;

pub fn vecf64_to_linestring(coords: &[f64]) -> Option<LineString> {
    if !coords.len().is_multiple_of(2) {
        return None;
    }

    let points: Vec<_> = coords
        .chunks(2)
        .map(|chunk| geo::Point::new(chunk[0], chunk[1]))
        .collect();

    Some(LineString::from(points))
}

pub fn coords_to_vecf64(ls: &LineString) -> Vec<f64> {
    ls.into_iter()
        .flat_map(|point| [point.x, point.y])
        .collect()
}
