use std::ops::{Add, AddAssign, Div, DivAssign, Mul, MulAssign, Neg, Sub, SubAssign};

use crate::epsilon::approx_eq;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Vector {
    x: f64,
    y: f64,
}

impl Vector {
    pub fn new(x: f64, y: f64) -> Self {
        debug_assert!(x.is_finite() && y.is_finite());

        Self { x, y }
    }

    pub fn into_array(self) -> [f64; 2] {
        [self.x, self.y]
    }

    pub fn into_tuple(self) -> (f64, f64) {
        (self.x, self.y)
    }

    pub fn x(&self) -> f64 {
        self.x
    }

    pub fn y(&self) -> f64 {
        self.y
    }

    pub fn normalize(self) -> Self {
        self / self.length()
    }

    pub fn dot(self, other: Self) -> f64 {
        self.x * other.x + self.y * other.y
    }

    pub fn cross(self, other: Self) -> f64 {
        self.x * other.y - self.y * other.x
    }

    pub fn length(self) -> f64 {
        self.x.hypot(self.y)
    }

    pub fn distance(self, to: Self) -> f64 {
        (self - to).length()
    }

    pub fn length_squared(self) -> f64 {
        self.x * self.x + self.y * self.y
    }

    pub fn distance_squared(self, to: Self) -> f64 {
        (self - to).length_squared()
    }

    pub fn approx_equals(self, other: Self) -> bool {
        let scale = Self::pair_scale(self, other);

        approx_eq(self.x, other.x, scale) && approx_eq(self.y, other.y, scale)
    }

    pub fn abs(self) -> Self {
        Self::new(self.x.abs(), self.y.abs())
    }

    pub fn max(self) -> f64 {
        self.x.max(self.y)
    }

    pub fn pair_scale(a: Self, b: Self) -> f64 {
        a.abs().max().max(b.abs().max()).max(1.0)
    }

    pub fn lerp(a: Self, b: Self, t: f64) -> Self {
        a + (b - a) * t
    }

    pub fn lerp_abs(a: Self, b: Self, t: f64) -> Self {
        Self::lerp(a, b, t / a.distance(b))
    }

    pub fn angle(a: Self, b: Self) -> f64 {
        let lengths_product = a.length() * b.length();

        if lengths_product == 0.0 {
            return 0.0;
        }

        let cosine_theta = (a.dot(b) / lengths_product).clamp(-1.0, 1.0);

        cosine_theta.acos()
    }

    pub fn angle_clockwise(a: Self, b: Self) -> f64 {
        let lengths_product = a.length() * b.length();

        if lengths_product == 0.0 {
            return std::f64::consts::PI;
        }

        let cosine_theta = (a.dot(b) / lengths_product).clamp(-1.0, 1.0);
        let mut angle = cosine_theta.acos();

        if a.cross(b) < 0.0 {
            angle = 2.0 * std::f64::consts::PI - angle;
        }

        angle
    }

    pub fn rotate(self, angle: f64) -> Self {
        let (sin, cos) = angle.sin_cos();

        Self::new(self.x * cos + self.y * sin, -self.x * sin + self.y * cos)
    }

    pub fn rotate_around(self, around: Self, angle: f64) -> Self {
        (self - around).rotate(angle) + around
    }

    pub fn rotate90(self) -> Self {
        Self::new(self.y, -self.x)
    }

    pub fn rotate270(self) -> Self {
        Self::new(-self.y, self.x)
    }
}

impl Add for Vector {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Self::new(self.x + rhs.x, self.y + rhs.y)
    }
}

impl AddAssign for Vector {
    fn add_assign(&mut self, rhs: Self) {
        self.x += rhs.x;
        self.y += rhs.y;
    }
}

impl Sub for Vector {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        Self::new(self.x - rhs.x, self.y - rhs.y)
    }
}

impl SubAssign for Vector {
    fn sub_assign(&mut self, rhs: Self) {
        self.x -= rhs.x;
        self.y -= rhs.y;
    }
}

impl Mul<f64> for Vector {
    type Output = Self;

    fn mul(self, rhs: f64) -> Self::Output {
        Self::new(self.x * rhs, self.y * rhs)
    }
}

impl MulAssign<f64> for Vector {
    fn mul_assign(&mut self, rhs: f64) {
        self.x *= rhs;
        self.y *= rhs;
    }
}

impl Mul<Vector> for f64 {
    type Output = Vector;

    fn mul(self, rhs: Vector) -> Self::Output {
        rhs * self
    }
}

impl Div<f64> for Vector {
    type Output = Self;

    fn div(self, rhs: f64) -> Self::Output {
        Self::new(self.x / rhs, self.y / rhs)
    }
}

impl DivAssign<f64> for Vector {
    fn div_assign(&mut self, rhs: f64) {
        self.x /= rhs;
        self.y /= rhs;
    }
}

impl Neg for Vector {
    type Output = Self;

    fn neg(self) -> Self::Output {
        Self::new(-self.x, -self.y)
    }
}

impl Default for Vector {
    fn default() -> Self {
        Vector::new(0.0, 0.0)
    }
}
