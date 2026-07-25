use geometry::Vector;

pub trait Lerp: Sized {
    fn lerp(a: Self, b: Self, t: f64) -> Self;
}

impl Lerp for f64 {
    fn lerp(a: Self, b: Self, t: f64) -> Self {
        a + (b - a) * t
    }
}

impl Lerp for Vector {
    fn lerp(a: Self, b: Self, t: f64) -> Self {
        Vector::lerp(a, b, t)
    }
}

impl Lerp for [f64; 3] {
    fn lerp(a: Self, b: Self, t: f64) -> Self {
        [
            f64::lerp(a[0], b[0], t),
            f64::lerp(a[1], b[1], t),
            f64::lerp(a[2], b[2], t),
        ]
    }
}
