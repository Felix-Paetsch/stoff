use crate::geometry::Vector;

pub trait RVectorSpace: Sized {
    fn add(&self, other: &Self) -> Self;
    fn scale(&self, with: f64) -> Self;
    fn zero() -> Self;
}

impl RVectorSpace for f64 {
    fn add(&self, other: &Self) -> Self {
        self + other
    }

    fn zero() -> Self {
        0.0
    }

    fn scale(&self, with: f64) -> Self {
        self * with
    }
}

impl RVectorSpace for Vector {
    fn add(&self, other: &Self) -> Self {
        Vector::add(*self, *other)
    }

    fn zero() -> Self {
        Vector::new(0.0, 0.0)
    }

    fn scale(&self, with: f64) -> Self {
        Vector::scale(*self, with)
    }
}
