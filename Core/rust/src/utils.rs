use geo::{Coord, LineString, Point};

#[derive(PartialEq)]
pub enum GeneralizedLine {
    Empty,
    Point(Point),
    Polyline(LineString),
}

pub fn vecf64_to_generalized_line(coords: &[f64]) -> GeneralizedLine {
    if coords.len() == 0 {
        return GeneralizedLine::Empty;
    }

    if coords.len() == 2 {
        return GeneralizedLine::Point(Point::new(coords[0], coords[1]));
    }

    let points: Vec<_> = coords
        .chunks(2)
        .map(|chunk| geo::Point::new(chunk[0], chunk[1]))
        .collect();

    GeneralizedLine::Polyline(LineString::from(points))
}

// The line strings are expected to be prefixed with a nan each
pub fn vecf64_to_generalized_line_vec(coords: &[f64]) -> Vec<GeneralizedLine> {
    let mut result = Vec::new();
    let mut current = Vec::new();
    let mut started = false;

    for &v in coords {
        if v.is_nan() {
            if started {
                result.push(vecf64_to_generalized_line(&current));
                current.clear();
            }
            started = true;
        } else {
            current.push(v);
        }
    }

    if started && !current.is_empty() {
        result.push(vecf64_to_generalized_line(&current));
    }

    result
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

pub fn coords_vec_to_vecf64<'a, I, J>(lines: I) -> Vec<f64>
where
    I: IntoIterator<Item = J>,
    J: IntoIterator<Item = &'a Coord>,
{
    let mut result = Vec::new();

    for line in lines {
        result.push(f64::NAN);
        result.extend(line.into_iter().flat_map(|point| [point.x, point.y]));
    }

    result
}
