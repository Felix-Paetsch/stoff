use crate::geometry::vertex::Vertex;

// vertices given as (x,y) array
pub fn vecf64_to_vertex_vec(vec: &[f64]) -> Option<Vec<Vertex>> {
    if !vec.len().is_multiple_of(2) {
        return None;
    }

    let mut out = Vec::with_capacity(vec.len() / 2);

    for i in (0..vec.len()).step_by(2) {
        let x = vec[i];
        let y = vec[i + 1];

        if !x.is_finite() || !y.is_finite() {
            return None;
        }

        out.push(Vertex { x, y });
    }

    Some(out)
}

pub fn vertex_vec_to_vecf64(vertices: &[Vertex]) -> Vec<f64> {
    let mut out = Vec::with_capacity(vertices.len() * 2);

    for v in vertices {
        out.push(v.x);
        out.push(v.y);
    }

    out
}

// Linestrings are expected to be prefixed with a nan each
pub fn vecf64_to_vertex_vec_vec(coords: &[f64]) -> Option<Vec<Vec<Vertex>>> {
    if coords.is_empty() {
        return Some(Vec::new());
    }

    if !coords[0].is_nan() {
        return None;
    }

    let mut result = Vec::new();
    let mut current = Vec::new();

    for &v in coords {
        if v.is_nan() {
            result.push(vecf64_to_vertex_vec(&current)?);
            current.clear();
        } else {
            current.push(v);
        }
    }

    if !current.is_empty() {
        result.push(vecf64_to_vertex_vec(&current)?);
    }

    Some(result)
}

pub fn vertex_vec_vec_to_vecf64(linestrings: &[Vec<Vertex>]) -> Vec<f64> {
    let total_coords = linestrings.iter().map(|ls| ls.len() * 2 + 1).sum();

    let mut out = Vec::with_capacity(total_coords);

    for linestring in linestrings {
        out.push(f64::NAN);
        out.extend(linestring.iter().flat_map(|v| [v.x, v.y]));
    }

    out
}
