pub const EPS_ABS: f64 = 1e-9;
pub const EPS_REL: f64 = 1e-9;

pub fn scaled_epsilon(scale: f64) -> f64 {
    EPS_ABS + EPS_REL * scale
}

pub fn approx_eq(a: f64, b: f64, scale: f64) -> bool {
    (a - b).abs() <= scaled_epsilon(scale)
}

pub fn clamp01_with_eps(t: f64, eps: f64) -> Option<f64> {
    if t < -eps || t > 1.0 + eps {
        None
    } else {
        Some(t.clamp(0.0, 1.0))
    }
}
