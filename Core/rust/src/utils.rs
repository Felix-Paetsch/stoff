use geo::LineString;

pub fn coords_to_linestring(coords: &[f64]) -> Option<LineString> {
    if coords.len() < 2 || !coords.len().is_multiple_of(2) {
        return None;
    }

    let points: Vec<_> = coords
        .chunks(2)
        .map(|chunk| geo::Point::new(chunk[0], chunk[1]))
        .collect();

    Some(LineString::from(points))
}
