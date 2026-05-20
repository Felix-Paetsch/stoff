// Credit: https://github.com/danieledapo/marching_squares/tree/master
// This section is thus under MIT License

use crate::{
    geometry::{Polygon, Polyline, ShapeT, Vector},
    numerics::eps::EPS_ABS,
};

impl Polygon {
    fn simplify(&self) -> Polygon {
        self.clone().into_simplified()
    }

    fn into_simplified(self) -> Polygon {
        self.into_polyline().into_simplified().into_polygon()
    }
}

impl Polyline {
    fn simplify(&self) -> Polyline {
        self.clone().into_simplified()
    }

    fn into_simplified(self) -> Polyline {
        let coords: Vec<(f64, f64)> = self
            .into_vertices()
            .into_iter()
            .map(|v| v.into_tuple())
            .collect();

        let simplified = simplify_with_eps(&coords, EPS_ABS);

        Polyline::new(simplified.into_iter().map(Vector::from_tuple).collect())
    }
}

/// Simplify a given polyline by reducing the amount of points that do not
/// actually contribute a lot of details to the overall shape.
pub fn simplify(poly: &[(f64, f64)]) -> Vec<(f64, f64)> {
    simplify_with_eps(poly, EPS_ABS)
}

pub fn simplify_with_eps(poly: &[(f64, f64)], eps: f64) -> Vec<(f64, f64)> {
    let mut r = vec![];
    _simplify_with_eps(&mut r, poly, eps);
    r
}

pub fn _simplify_with_eps(r: &mut Vec<(f64, f64)>, poly: &[(f64, f64)], eps: f64) {
    // Ramer Douglas Peucker doesn't work with closed paths, thus simplify the
    // open path and then close it manually
    if !poly.is_empty() && poly[0] == poly[poly.len() - 1] {
        rdp(r, &poly[..poly.len() - 1], eps);
        r.push(poly[poly.len() - 1]);
    } else {
        rdp(r, poly, eps);
    }
}

/// Implementation of the Ramer–Douglas–Peucker algorithm to simplify an open
/// path.
fn rdp(r: &mut Vec<(f64, f64)>, poly: &[(f64, f64)], eps: f64) {
    if poly.len() < 3 {
        r.extend_from_slice(poly);
        return;
    }

    let sp = poly[0];
    let ep = *poly.last().unwrap();

    let mut farthest_i = 0;
    let mut max_dist = f64::NEG_INFINITY;
    for (i, p) in poly.iter().enumerate().take(poly.len() - 1).skip(1) {
        let d = perpendicular_dist(*p, (sp, ep));
        if d > max_dist {
            max_dist = d;
            farthest_i = i;
        }
    }

    if max_dist > eps {
        rdp(r, &poly[..=farthest_i], eps);

        // remove point with max dist, it will be added with the right vec
        r.pop();

        _simplify_with_eps(r, &poly[farthest_i..], eps);
    } else {
        r.push(sp);
        r.push(ep);
    }
}

fn perpendicular_dist(p: (f64, f64), (s, e): ((f64, f64), (f64, f64))) -> f64 {
    let num = ((e.1 - s.1) * p.0 - (e.0 - s.0) * p.1 + e.0 * s.1 - e.1 * s.0).abs();
    let den = ((e.0 - s.0).powi(2) + (e.1 - s.1).powi(2)).sqrt();

    num / den
}
