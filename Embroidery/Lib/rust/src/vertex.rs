#[derive(Debug, Clone, Copy)]
pub struct Vertex {
    pub x: f64,
    pub y: f64,
}

impl Vertex {
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

    pub fn midpoint(self, other: Vertex) -> Vertex {
        Vertex {
            x: 0.5 * (self.x + other.x),
            y: 0.5 * (self.y + other.y),
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

    pub fn coord_scale(self) -> f64 {
        self.x.abs().max(self.y.abs())
    }

    pub fn pair_scale(self, other: Vertex) -> f64 {
        self.coord_scale().max(other.coord_scale()).max(1.0)
    }

    pub fn segment_scale(self, other: Vertex) -> f64 {
        let geom = self.subtract(other).length();
        self.pair_scale(other).max(geom).max(1.0)
    }

    pub fn same_coord(self, other: Vertex) -> bool {
        let scale = self.pair_scale(other);
        approx_eq(self.x, other.x, scale) && approx_eq(self.y, other.y, scale)
    }
}

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
