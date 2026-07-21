use crate::geometry::{Matrix, Vector};

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

impl RVectorSpace for [f64; 3] {
    fn add(&self, other: &Self) -> Self {
        [self[0] + other[0], self[1] + other[1], self[2] + other[2]]
    }

    fn zero() -> Self {
        [0.0, 0.0, 0.0]
    }

    fn scale(&self, with: f64) -> Self {
        [self[0] * with, self[1] * with, self[2] * with]
    }
}

impl RVectorSpace for Matrix {
    fn add(&self, other: &Self) -> Self {
        Matrix::new(
            self.a() + other.a(),
            self.b() + other.b(),
            self.c() + other.c(),
            self.d() + other.d(),
        )
    }

    fn zero() -> Self {
        Matrix::new(0.0, 0.0, 0.0, 0.0)
    }

    fn scale(&self, with: f64) -> Self {
        Matrix::new(
            self.a() * with,
            self.b() * with,
            self.c() * with,
            self.d() * with,
        )
    }
}
