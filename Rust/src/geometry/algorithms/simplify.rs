// Credit: https://github.com/danieledapo/marching_squares/tree/master
// This section is thus under MIT License
//

/* MIT License

Copyright (c) 2020 Daniele D'Orazio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

use crate::{
    geometry::{Polygon, Polyline, Shape, ShapeT, Vector},
    numerics::eps::EPS_ABS,
};

#[allow(unused)]
pub fn simplify_shape(shape: &impl ShapeT) -> Shape {
    simplify_shape_with_eps(shape, EPS_ABS)
}

pub fn into_simplified_shape(shape: Shape) -> Shape {
    into_simplified_shape_with_eps(shape, EPS_ABS)
}

pub fn simplify_shape_with_eps(shape: &impl ShapeT, eps: f64) -> Shape {
    into_simplified_shape_with_eps(shape.clone_to_shape(), eps)
}

pub fn into_simplified_shape_with_eps(shape: Shape, eps: f64) -> Shape {
    let is_polygon = shape.is_polygon();
    let coords: Vec<(f64, f64)> = shape
        .into_polyline()
        .into_vertices()
        .into_iter()
        .map(|v| v.into_tuple())
        .collect();

    let simplified = simplify_with_eps(&coords, eps);

    if is_polygon {
        Shape::Polygon(Polygon::new(
            simplified.into_iter().map(Vector::from_tuple).collect(),
        ))
    } else {
        Shape::Polyline(Polyline::new(
            simplified.into_iter().map(Vector::from_tuple).collect(),
        ))
    }
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
