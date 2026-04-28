use geo::Coord;

pub const EPS_ABS: f64 = 1e-9;
pub const EPS_REL: f64 = 1e-9;

pub fn add(a: Coord, b: Coord) -> Coord {
    Coord {
        x: a.x + b.x,
        y: a.y + b.y,
    }
}

pub fn subtract(a: Coord, b: Coord) -> Coord {
    Coord {
        x: a.x - b.x,
        y: a.y - b.y,
    }
}

pub fn scale(c: Coord, factor: f64) -> Coord {
    Coord {
        x: c.x * factor,
        y: c.y * factor,
    }
}

pub fn midpoint(a: Coord, b: Coord) -> Coord {
    Coord {
        x: 0.5 * (a.x + b.x),
        y: 0.5 * (a.y + b.y),
    }
}

pub fn dot(a: Coord, b: Coord) -> f64 {
    a.x * b.x + a.y * b.y
}

pub fn cross(a: Coord, b: Coord) -> f64 {
    a.x * b.y - a.y * b.x
}

pub fn length(c: Coord) -> f64 {
    (c.x * c.x + c.y * c.y).sqrt()
}

pub fn distance(a: Coord, b: Coord) -> f64 {
    length(subtract(a, b))
}

pub fn length_squared(c: Coord) -> f64 {
    c.x * c.x + c.y * c.y
}

pub fn coord_scale(c: Coord) -> f64 {
    c.x.abs().max(c.y.abs())
}

pub fn pair_scale(a: Coord, b: Coord) -> f64 {
    coord_scale(a).max(coord_scale(b)).max(1.0)
}

pub fn segment_scale(a: Coord, b: Coord) -> f64 {
    let geom = length(subtract(b, a));
    pair_scale(a, b).max(geom).max(1.0)
}

pub fn scaled_epsilon(scale: f64) -> f64 {
    EPS_ABS + EPS_REL * scale
}

pub fn approx_eq(a: f64, b: f64, scale: f64) -> bool {
    (a - b).abs() <= scaled_epsilon(scale)
}

pub fn same_coord(a: Coord, b: Coord) -> bool {
    let scale = pair_scale(a, b);
    approx_eq(a.x, b.x, scale) && approx_eq(a.y, b.y, scale)
}

pub fn clamp01_with_eps(t: f64, eps: f64) -> Option<f64> {
    if t < -eps || t > 1.0 + eps {
        None
    } else {
        Some(t.clamp(0.0, 1.0))
    }
}
