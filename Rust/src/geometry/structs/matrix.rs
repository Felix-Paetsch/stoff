use crate::geometry::Vector;

#[derive(Clone, Copy)]
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

    pub fn new(a: f64, b: f64, c: f64, d: f64) -> Matrix {
        Matrix([a, b, c, d])
    }

    pub fn new_column_wise(a: f64, b: f64, c: f64, d: f64) -> Matrix {
        Matrix([a, c, b, d])
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

    pub fn transpose(&self) -> Matrix {
        Matrix::new(self.a(), self.b(), self.c(), self.d())
    }

    pub fn from_vector(v: Vector) -> Matrix {
        Matrix::new(v.x(), 0.0, 0.0, v.y())
    }

    pub fn add(&self, other: &Matrix) -> Matrix {
        Matrix::new(
            self.a() + other.a(),
            self.b() + other.b(),
            self.c() + other.c(),
            self.d() + other.d(),
        )
    }

    pub fn mult_vec(&self, v: Vector) -> Vector {
        Vector::new(
            v.x() * self.a() + v.y() * self.b(),
            v.x() * self.c() + v.y() * self.d(),
        )
    }
}
