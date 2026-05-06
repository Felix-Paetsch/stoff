use crate::numerics::eps::approx_eq;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Vertex {
    pub x: f64,
    pub y: f64,
}

impl Vertex {
    pub fn new(x: f64, y: f64) -> Vertex {
        Vertex { x, y }
    }

    pub fn add(self, other: Vertex) -> Vertex {
        Vertex {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }

    pub fn subtract(self, other: Vertex) -> Vertex {
        Vertex {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }

    pub fn scale(self, factor: f64) -> Vertex {
        Vertex {
            x: self.x * factor,
            y: self.y * factor,
        }
    }

    pub fn dot(self, other: Vertex) -> f64 {
        self.x * other.x + self.y * other.y
    }

    pub fn cross(self, other: Vertex) -> f64 {
        self.x * other.y - self.y * other.x
    }

    pub fn length(self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    pub fn distance(self, to: Vertex) -> f64 {
        self.subtract(to).length()
    }

    pub fn length_squared(self) -> f64 {
        self.x * self.x + self.y * self.y
    }

    pub fn approx_equals(self, other: Vertex) -> bool {
        let scale = Vertex::pair_scale(self, other);
        approx_eq(self.x, other.x, scale) && approx_eq(self.y, other.y, scale)
    }

    pub fn coord_scale(self) -> f64 {
        self.x.abs().max(self.y.abs())
    }

    pub fn pair_scale(a: Vertex, b: Vertex) -> f64 {
        a.coord_scale().max(b.coord_scale()).max(1.0)
    }

    pub fn lerp(a: Vertex, b: Vertex, t: f64) -> Vertex {
        a.add(b.subtract(a).scale(t))
    }
}

impl From<Vertex> for geo::Coord {
    fn from(vertex: Vertex) -> Self {
        geo::Coord {
            x: vertex.x,
            y: vertex.y,
        }
    }
}

impl From<Vertex> for geo::Point {
    fn from(vertex: Vertex) -> Self {
        let coord: geo::Coord = vertex.into();
        coord.into()
    }
}

impl From<geo::Coord> for Vertex {
    fn from(coord: geo::Coord) -> Self {
        Vertex {
            x: coord.x,
            y: coord.y,
        }
    }
}

impl From<&geo::Coord> for Vertex {
    fn from(coord: &geo::Coord) -> Self {
        Vertex {
            x: coord.x,
            y: coord.y,
        }
    }
}

impl From<geo::Point> for Vertex {
    fn from(point: geo::Point) -> Self {
        let coord = point.0;
        Vertex {
            x: coord.x,
            y: coord.y,
        }
    }
}

impl From<&geo::Point> for Vertex {
    fn from(point: &geo::Point) -> Self {
        let coord = point.0;
        Vertex {
            x: coord.x,
            y: coord.y,
        }
    }
}

impl From<Vertex> for Vec<f64> {
    fn from(vertex: Vertex) -> Vec<f64> {
        vec![vertex.x, vertex.y]
    }
}
