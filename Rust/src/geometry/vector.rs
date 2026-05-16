use crate::numerics::eps::approx_eq;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Vector {
    pub x: f64,
    pub y: f64,
}

impl Vector {
    pub fn new(x: f64, y: f64) -> Vector {
        Vector { x, y }
    }

    pub fn normalize(&self) -> Vector {
        let len = self.length();
        return self.scale(1.0 / len);
    }

    pub fn add(self, other: Vector) -> Vector {
        Vector {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }

    pub fn subtract(self, other: Vector) -> Vector {
        Vector {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }

    pub fn scale(self, factor: f64) -> Vector {
        Vector {
            x: self.x * factor,
            y: self.y * factor,
        }
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

        Vector {
            x: self.x * cos + self.y * sin,
            y: -self.x * sin + self.y * cos,
        }
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
        Vector {
            x: coord.x,
            y: coord.y,
        }
    }
}

impl From<&geo::Coord> for Vector {
    fn from(coord: &geo::Coord) -> Self {
        Vector {
            x: coord.x,
            y: coord.y,
        }
    }
}

impl From<geo::Point> for Vector {
    fn from(point: geo::Point) -> Self {
        let coord = point.0;
        Vector {
            x: coord.x,
            y: coord.y,
        }
    }
}

impl From<&geo::Point> for Vector {
    fn from(point: &geo::Point) -> Self {
        let coord = point.0;
        Vector {
            x: coord.x,
            y: coord.y,
        }
    }
}

impl From<Vector> for Vec<f64> {
    fn from(vertex: Vector) -> Vec<f64> {
        vec![vertex.x, vertex.y]
    }
}
