use geo::{Coord, LineString};

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

pub fn coords_to_vecf64<'a, I>(coords: I) -> Vec<f64>
where
    I: IntoIterator<Item = &'a Coord>,
{
    coords
        .into_iter()
        .flat_map(|point| [point.x, point.y])
        .collect()
}

// The line strings are expected to be seperated with Nans
pub fn vecf64_to_linestring_vec(coords: &[f64]) -> Option<Vec<LineString>> {
    let mut result = Vec::new();
    let mut current = Vec::new();

    for &v in coords {
        if v.is_nan() {
            if current.is_empty() {
                result.push(LineString::new(vec![]));
            } else {
                result.push(vecf64_to_linestring(&current)?);
                current.clear();
            }
        } else {
            current.push(v);
        }
    }

    if current.is_empty() {
        if coords.last().map_or(false, |v| v.is_nan()) {
            result.push(LineString::new(vec![]));
        }
    } else {
        result.push(vecf64_to_linestring(&current)?);
    }

    Some(result)
}

pub fn coords_vec_to_vecf64<'a, I, J>(lines: I) -> Vec<f64>
where
    I: IntoIterator<Item = J>,
    J: IntoIterator<Item = &'a Coord>,
{
    let mut result = Vec::new();
    let mut first = true;

    for line in lines {
        if !first {
            result.push(f64::NAN);
        }
        first = false;

        result.extend(line.into_iter().flat_map(|point| [point.x, point.y]));
    }

    result
}
