use crate::numerics::eps::approx_eq;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Vector {
    x: f64,
    y: f64,
}

impl Vector {
    pub fn new(x: f64, y: f64) -> Vector {
        debug_assert!(x.is_finite() && y.is_finite());

        Vector { x, y }
    }

    pub fn into_array(self) -> [f64; 2] {
        [self.x, self.y]
    }

    pub fn into_tuple(self) -> (f64, f64) {
        (self.x, self.y)
    }

    pub fn from_tuple(t: (f64, f64)) -> Vector {
        Vector::new(t.0, t.1)
    }

    pub fn x(&self) -> f64 {
        self.x
    }

    pub fn y(&self) -> f64 {
        self.y
    }

    pub fn normalize(&self) -> Vector {
        let len = self.length();
        self.scale(1.0 / len)
    }

    pub fn add(self, other: Vector) -> Vector {
        Vector::new(self.x + other.x, self.y + other.y)
    }

    pub fn subtract(self, other: Vector) -> Vector {
        Vector::new(self.x - other.x, self.y - other.y)
    }

    pub fn scale(self, factor: f64) -> Vector {
        Vector::new(self.x * factor, self.y * factor)
    }

    pub fn dot(self, other: Vector) -> f64 {
        self.x * other.x + self.y * other.y
    }

    pub fn cross(self, other: Vector) -> f64 {
        self.x * other.y - self.y * other.x
    }

    pub fn length(self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    pub fn distance(self, to: Vector) -> f64 {
        self.subtract(to).length()
    }

    pub fn length_squared(self) -> f64 {
        self.x * self.x + self.y * self.y
    }

    pub fn distance_squared(self, to: Vector) -> f64 {
        self.subtract(to).length_squared()
    }

    pub fn approx_equals(self, other: Vector) -> bool {
        let scale = Vector::pair_scale(self, other);
        approx_eq(self.x, other.x, scale) && approx_eq(self.y, other.y, scale)
    }

    pub fn coord_scale(self) -> f64 {
        self.x.abs().max(self.y.abs())
    }

    pub fn pair_scale(a: Vector, b: Vector) -> f64 {
        a.coord_scale().max(b.coord_scale()).max(1.0)
    }

    pub fn lerp(a: Vector, b: Vector, t: f64) -> Vector {
        a.add(b.subtract(a).scale(t))
    }

    pub fn lerp_abs(a: Vector, b: Vector, t: f64) -> Vector {
        Vector::lerp(a, b, t / a.distance(b))
    }

    pub fn angle(a: Vector, b: Vector) -> f64 {
        let dot = a.dot(b);
        let lengths_product = a.length() * b.length();

        let cosine_theta = (dot / lengths_product).clamp(-1.0, 1.0);
        let angle = cosine_theta.acos();

        if angle.is_nan() {
            0.0
        } else {
            angle
        }
    }

    pub fn angle_clockwise(a: Vector, b: Vector) -> f64 {
        let dot = a.dot(b);
        let cross = a.cross(b);
        let lengths_product = a.length() * b.length();

        let cosine_theta = (dot / lengths_product).clamp(-1.0, 1.0);
        let mut angle = cosine_theta.acos();

        if angle.is_nan() {
            return std::f64::consts::PI;
        }

        if cross < 0.0 {
            angle = 2.0 * std::f64::consts::PI - angle;
        }

        angle
    }

    pub fn rotate(self, angle: f64) -> Vector {
        let (sin, cos) = angle.sin_cos();

        Vector::new(self.x * cos + self.y * sin, -self.x * sin + self.y * cos)
    }

    pub fn rotate90(self) -> Vector {
        Vector::new(self.y, -self.x)
    }

    pub fn rotate270(self) -> Vector {
        Vector::new(-self.y, self.x)
    }
}

impl From<Vector> for geo::Coord {
    fn from(vertex: Vector) -> Self {
        geo::Coord {
            x: vertex.x,
            y: vertex.y,
        }
    }
}

impl From<Vector> for geo::Point {
    fn from(vertex: Vector) -> Self {
        let coord: geo::Coord = vertex.into();
        coord.into()
    }
}

impl From<geo::Coord> for Vector {
    fn from(coord: geo::Coord) -> Self {
        Vector::new(coord.x, coord.y)
    }
}

impl From<&geo::Coord> for Vector {
    fn from(coord: &geo::Coord) -> Self {
        Vector::new(coord.x, coord.y)
    }
}

impl From<geo::Point> for Vector {
    fn from(point: geo::Point) -> Self {
        let coord = point.0;
        Vector::new(coord.x, coord.y)
    }
}

impl From<&geo::Point> for Vector {
    fn from(point: &geo::Point) -> Self {
        let coord = point.0;
        Vector::new(coord.x, coord.y)
    }
}

impl From<Vector> for Vec<f64> {
    fn from(vertex: Vector) -> Vec<f64> {
        vec![vertex.x, vertex.y]
    }
}
