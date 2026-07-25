use crate::grid::{
    algorithms::fast_marching::initialize::FastMarchingState,
    grid_struct::{Grid, GridPosition},
};
use geometry::{Matrix, Vector};

/// Create a local anisotropic FMM update using accepted 8-neighborhood
/// vertices and adjacent accepted-neighbor triangles.
///
/// The update considers:
///
/// 1. Edge updates:
///    T(p) <= T(q) + sqrt((p-q)^T M_edge (p-q))
///
/// 2. Triangle updates:
///    interpolate T along an accepted edge q0--q1 and minimize
///
///    T(lambda) + distance_M(p, q(lambda))
///
///    for lambda in [0, 1].
///
/// Triangle updates permit oblique characteristic directions and therefore
/// handle nonzero tensor off-diagonal terms much better than a purely
/// coordinate-axis stencil.
pub fn anisotropic_triangle_arrival_time_update_fn<'a>(
    tensor_map: &'a Grid<Matrix>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    let [w, h] = tensor_map.lattice_dimensions();
    assert!(w >= 2 && h >= 2);

    let [_, _, domain_w, domain_h] = tensor_map.domain_dimensions();

    let hx = domain_w / (w as f64 - 1.0);
    let hy = domain_h / (h as f64 - 1.0);

    // Clockwise ordering around a pixel in grid coordinates.
    //
    // The physical vectors are computed below, so this ordering remains
    // correct regardless of hx != hy.
    const DIRECTIONS: [[i32; 2]; 8] = [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
        [1, -1],
    ];

    move |data: &FastMarchingState, p: GridPosition| {
        let old_time = *data.times_grid.value_at(p);
        let mp = tensor_map.value_at(p);

        let Some((mxx, mxy, myy)) = symmetric_tensor_components(mp) else {
            // Invalid, singular, or non-positive-definite tensors are not
            // valid finite-speed eikonal tensors. Leave the current upper
            // bound unchanged.
            return old_time;
        };

        let metric = SymmetricTensor { mxx, mxy, myy };
        let px = p[0] as i32;
        let py = p[1] as i32;

        let mut known_neighbors: [Option<KnownNeighbor>; 8] =
            [None, None, None, None, None, None, None, None];

        let mut best = old_time;

        for (i, [sx, sy]) in DIRECTIONS.iter().copied().enumerate() {
            let qx = px + sx;
            let qy = py + sy;

            if !in_bounds(qx, qy, w, h) {
                continue;
            }

            let q = [qx as usize, qy as usize];

            if !data.status_grid.is_known(q) {
                continue;
            }

            let tq = *data.times_grid.value_at(q);
            if !tq.is_finite() {
                continue;
            }

            let delta = Vector::new(sx as f64 * hx, sy as f64 * hy);

            // A more accurate edge cost can average tensors at p and q.
            // For monotonicity and a simple local model, use M(p).
            let edge_cost_sq = metric.quadratic_form(delta);

            if edge_cost_sq < 0.0 || !edge_cost_sq.is_finite() {
                continue;
            }

            best = best.min(tq + edge_cost_sq.sqrt());

            known_neighbors[i] = Some(KnownNeighbor {
                offset: delta,
                time: tq,
            });
        }

        // Adjacent directions form triangles:
        //
        //      q0 ---- q1
        //       \      /
        //        \ p /
        //
        // More precisely, q0 and q1 are neighboring points around p and
        // their edge is one side of a local cell triangle.
        for i in 0..8 {
            let j = (i + 1) % 8;

            let (Some(q0), Some(q1)) = (known_neighbors[i], known_neighbors[j]) else {
                continue;
            };

            let candidate = triangle_update(metric, q0, q1);

            if let Some(candidate) = candidate {
                // A valid triangle update must be no earlier than either
                // accepted endpoint. This rejects non-upwind roots.
                if candidate >= q0.time && candidate >= q1.time && candidate.is_finite() {
                    best = best.min(candidate);
                }
            }
        }

        best
    }
}

#[derive(Clone, Copy)]
struct SymmetricTensor {
    mxx: f64,
    mxy: f64,
    myy: f64,
}

impl SymmetricTensor {
    fn quadratic_form(self, v: Vector) -> f64 {
        self.mxx * v.x() * v.x() + 2.0 * self.mxy * v.x() * v.y() + self.myy * v.y() * v.y()
    }
}

#[derive(Clone, Copy)]
struct KnownNeighbor {
    /// Physical vector from p to this neighbor.
    offset: Vector,

    /// Already accepted arrival time at the neighbor.
    time: f64,
}

/// Return `(Mxx, Mxy, Myy)` when the matrix is symmetric positive definite.
///
/// IMPORTANT:
///
/// This assumes `Matrix` exposes the conventional entries:
///
///     [ a()  b() ]
///     [ c()  d() ]
///
/// If your `Matrix` has another layout, adapt this function. In particular,
/// `Myy` must be the bottom-right entry, usually `d()`, not `c()`.
fn symmetric_tensor_components(m: &Matrix) -> Option<(f64, f64, f64)> {
    let mxx = m.a();
    let mxy_upper = m.b();
    let mxy_lower = m.c();
    let myy = m.d();

    let scale = mxx
        .abs()
        .max(mxy_upper.abs())
        .max(mxy_lower.abs())
        .max(myy.abs())
        .max(1.0);

    let symmetry_epsilon = 1e-10 * scale;
    let positive_epsilon = 1e-14 * scale;

    if (mxy_upper - mxy_lower).abs() > symmetry_epsilon {
        return None;
    }

    let mxy = 0.5 * (mxy_upper + mxy_lower);
    let determinant = mxx * myy - mxy * mxy;

    if !mxx.is_finite()
        || !mxy.is_finite()
        || !myy.is_finite()
        || mxx <= positive_epsilon
        || myy <= positive_epsilon
        || determinant <= positive_epsilon * scale
    {
        return None;
    }

    Some((mxx, mxy, myy))
}

/// Compute the local triangle update.
///
/// Let q(lambda) be a point on the accepted edge:
///
///     q(lambda) = q0 + lambda (q1 - q0), lambda in [0, 1]
///
/// and interpolate its arrival time linearly:
///
///     t(lambda) = t0 + lambda (t1 - t0).
///
/// The candidate is the minimum of:
///
///     t(lambda) + sqrt((q(lambda)-p)^T M (q(lambda)-p))
///
/// over lambda in [0, 1].
///
/// This is a local Hopf-Lax update. The edge endpoints are included, so it
/// naturally agrees with the one-neighbor update when the minimizer lands on
/// an endpoint.
fn triangle_update(metric: SymmetricTensor, q0: KnownNeighbor, q1: KnownNeighbor) -> Option<f64> {
    let r0 = q0.offset;
    let edge = q1.offset - q0.offset;

    let dt = q1.time - q0.time;

    // f(lambda) = t0 + lambda dt + sqrt(A lambda^2 + 2 B lambda + C)
    //
    // with:
    //
    // A = edge^T M edge
    // B = r0^T M edge
    // C = r0^T M r0
    let a = metric.quadratic_form(edge);
    let b = bilinear_form(metric, r0, edge);
    let c = metric.quadratic_form(r0);

    if !a.is_finite() || !b.is_finite() || !c.is_finite() || a <= 0.0 || c < 0.0 {
        return None;
    }

    let mut best = q0
        .time
        .min(q1.time)
        .min(q0.time + c.max(0.0).sqrt())
        .min(q1.time + metric.quadratic_form(q1.offset).max(0.0).sqrt());

    // Stationarity:
    //
    // dt + (A lambda + B) / sqrt(A lambda^2 + 2B lambda + C) = 0
    //
    // Squaring produces:
    //
    // A(A-dt²) lambda² + 2B(A-dt²) lambda + (B²-dt² C) = 0.
    //
    // Squaring can introduce false roots, so every candidate is verified
    // against the original stationarity equation.
    let k = a - dt * dt;
    let qa = a * k;
    let qb = 2.0 * b * k;
    let qc = b * b - dt * dt * c;

    let roots = quadratic_roots(qa, qb, qc);

    for lambda in roots {
        if !lambda.is_finite() || !(0.0..=1.0).contains(&lambda) {
            continue;
        }

        let distance_sq = a * lambda * lambda + 2.0 * b * lambda + c;
        if distance_sq <= 0.0 || !distance_sq.is_finite() {
            continue;
        }

        let distance = distance_sq.sqrt();

        // Verify the unsquared derivative equation.
        let derivative = dt + (a * lambda + b) / distance;
        let derivative_tolerance = 1e-8 * (1.0 + dt.abs() + a.abs() + b.abs());

        if derivative.abs() > derivative_tolerance {
            continue;
        }

        let candidate = q0.time + lambda * dt + distance;

        if candidate.is_finite() {
            best = best.min(candidate);
        }
    }

    Some(best)
}

fn bilinear_form(metric: SymmetricTensor, u: Vector, v: Vector) -> f64 {
    metric.mxx * u.x() * v.x()
        + metric.mxy * (u.x() * v.y() + u.y() * v.x())
        + metric.myy * u.y() * v.y()
}

/// Return all real roots, handling a degenerate linear equation.
///
/// The fixed-size output avoids requiring allocation in the FMM inner loop.
fn quadratic_roots(a: f64, b: f64, c: f64) -> [f64; 2] {
    let scale = a.abs().max(b.abs()).max(c.abs()).max(1.0);
    let eps = 1e-14 * scale;

    if a.abs() <= eps {
        if b.abs() <= eps {
            return [f64::NAN, f64::NAN];
        }

        let root = -c / b;
        return [root, f64::NAN];
    }

    let discriminant = b * b - 4.0 * a * c;

    if discriminant < 0.0 {
        return [f64::NAN, f64::NAN];
    }

    let sqrt_discriminant = discriminant.sqrt();

    [
        (-b - sqrt_discriminant) / (2.0 * a),
        (-b + sqrt_discriminant) / (2.0 * a),
    ]
}

fn in_bounds(x: i32, y: i32, w: usize, h: usize) -> bool {
    x >= 0 && y >= 0 && x < w as i32 && y < h as i32
}
