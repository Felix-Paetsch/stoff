use std::ops::{Add, AddAssign, Div, DivAssign, Mul, MulAssign, Neg, Sub, SubAssign};

use crate::Vector;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Matrix([f64; 4]);

impl Matrix {
    #[inline]
    pub fn inner(&self) -> &[f64; 4] {
        &self.0
    }

    #[inline]
    pub fn into_inner(self) -> [f64; 4] {
        self.0
    }

    pub fn new(a: f64, b: f64, c: f64, d: f64) -> Self {
        // a b
        // c d
        debug_assert!(a.is_finite() && b.is_finite() && c.is_finite() && d.is_finite());

        Self([a, b, c, d])
    }

    pub fn new_column_wise(a: f64, b: f64, c: f64, d: f64) -> Self {
        Self::new(a, c, b, d)
    }

    pub fn cols(&self) -> [[f64; 2]; 2] {
        [[self.0[0], self.0[2]], [self.0[1], self.0[3]]]
    }

    pub fn rows(&self) -> [[f64; 2]; 2] {
        [[self.0[0], self.0[1]], [self.0[2], self.0[3]]]
    }

    #[inline]
    pub fn a(&self) -> f64 {
        self.0[0]
    }

    #[inline]
    pub fn b(&self) -> f64 {
        self.0[1]
    }

    #[inline]
    pub fn c(&self) -> f64 {
        self.0[2]
    }

    #[inline]
    pub fn d(&self) -> f64 {
        self.0[3]
    }

    pub fn det(&self) -> f64 {
        self.a() * self.d() - self.b() * self.c()
    }

    pub fn transpose(&self) -> Self {
        Self::new(self.a(), self.c(), self.b(), self.d())
    }

    pub fn from_vector(v: Vector) -> Self {
        Self::new(v.x(), 0.0, 0.0, v.y())
    }

    pub fn from_scalar(x: f64) -> Self {
        Self::new(x, 0.0, 0.0, x)
    }

    pub fn mult_vec(&self, v: Vector) -> Vector {
        Vector::new(
            self.a() * v.x() + self.b() * v.y(),
            self.c() * v.x() + self.d() * v.y(),
        )
    }
}

/*
 * Matrix + Matrix
 */

impl Add for Matrix {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Self::new(
            self.a() + rhs.a(),
            self.b() + rhs.b(),
            self.c() + rhs.c(),
            self.d() + rhs.d(),
        )
    }
}

impl AddAssign for Matrix {
    fn add_assign(&mut self, rhs: Self) {
        self.0[0] += rhs.0[0];
        self.0[1] += rhs.0[1];
        self.0[2] += rhs.0[2];
        self.0[3] += rhs.0[3];
    }
}

/*
 * Matrix - Matrix
 */

impl Sub for Matrix {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        Self::new(
            self.a() - rhs.a(),
            self.b() - rhs.b(),
            self.c() - rhs.c(),
            self.d() - rhs.d(),
        )
    }
}

impl SubAssign for Matrix {
    fn sub_assign(&mut self, rhs: Self) {
        self.0[0] -= rhs.0[0];
        self.0[1] -= rhs.0[1];
        self.0[2] -= rhs.0[2];
        self.0[3] -= rhs.0[3];
    }
}

/*
 * Matrix * Matrix
 *
 * [a b] [e f]   [ae + bg  af + bh]
 * [c d] [g h] = [ce + dg  cf + dh]
 */

impl Mul for Matrix {
    type Output = Self;

    fn mul(self, rhs: Self) -> Self::Output {
        Self::new(
            self.a() * rhs.a() + self.b() * rhs.c(),
            self.a() * rhs.b() + self.b() * rhs.d(),
            self.c() * rhs.a() + self.d() * rhs.c(),
            self.c() * rhs.b() + self.d() * rhs.d(),
        )
    }
}

impl MulAssign for Matrix {
    fn mul_assign(&mut self, rhs: Self) {
        *self = *self * rhs;
    }
}

/*
 * Matrix * Vector
 *
 * [a b] [x]   [ax + by]
 * [c d] [y] = [cx + dy]
 */

impl Mul<Vector> for Matrix {
    type Output = Vector;

    fn mul(self, rhs: Vector) -> Self::Output {
        self.mult_vec(rhs)
    }
}

/*
 * Matrix * scalar
 */

impl Mul<f64> for Matrix {
    type Output = Self;

    fn mul(self, rhs: f64) -> Self::Output {
        Self::new(
            self.a() * rhs,
            self.b() * rhs,
            self.c() * rhs,
            self.d() * rhs,
        )
    }
}

impl MulAssign<f64> for Matrix {
    fn mul_assign(&mut self, rhs: f64) {
        self.0[0] *= rhs;
        self.0[1] *= rhs;
        self.0[2] *= rhs;
        self.0[3] *= rhs;
    }
}

impl Mul<Matrix> for f64 {
    type Output = Matrix;

    fn mul(self, rhs: Matrix) -> Self::Output {
        rhs * self
    }
}

/*
 * Matrix / scalar
 */

impl Div<f64> for Matrix {
    type Output = Self;

    fn div(self, rhs: f64) -> Self::Output {
        Self::new(
            self.a() / rhs,
            self.b() / rhs,
            self.c() / rhs,
            self.d() / rhs,
        )
    }
}

impl DivAssign<f64> for Matrix {
    fn div_assign(&mut self, rhs: f64) {
        self.0[0] /= rhs;
        self.0[1] /= rhs;
        self.0[2] /= rhs;
        self.0[3] /= rhs;
    }
}

/*
 * -Matrix
 */

impl Neg for Matrix {
    type Output = Self;

    fn neg(self) -> Self::Output {
        Self::new(-self.a(), -self.b(), -self.c(), -self.d())
    }
}

impl Default for Matrix {
    fn default() -> Self {
        Matrix([0.0, 0.0, 0.0, 0.0])
    }
}
