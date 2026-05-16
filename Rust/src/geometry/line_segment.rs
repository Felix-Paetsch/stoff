use crate::{
    geometry::{polyline::Polyline, vector::Vector},
    numerics::eps::{scaled_epsilon, EPS_ABS},
};

#[derive(Debug, Clone, Copy)]
pub struct LineSegment {
    pub start: Vector,
    pub end: Vector,
}

pub struct ProjectionResult {
    pub vertex: Vector,
    pub fraction: f64,
    pub distance: f64,
}

impl LineSegment {
    pub fn new(start: Vector, end: Vector) -> Self {
        LineSegment { start, end }
    }

    pub fn segment_scale(&self) -> f64 {
        let geom = self.start.subtract(self.end).length();
        Vector::pair_scale(self.start, self.end).max(geom).max(1.0)
    }

    pub fn project(&self, point: Vector) -> ProjectionResult {
        let seg = self.end.subtract(self.start);
        let seg_len2 = seg.length_squared();

        let seg_scale = self.segment_scale();
        let eps = scaled_epsilon(seg_scale);

        if seg_len2 <= eps * eps {
            let center = Vector::lerp(self.start, self.end, 0.5);

            let d_start = point.distance(self.start);
            let d_end = point.distance(self.end);
            let d_center = point.distance(center);

            let (vertex, fraction, distance) = if d_start <= d_end && d_start <= d_center {
                (self.start, 0.0, d_start)
            } else if d_end <= d_start && d_end <= d_center {
                (self.end, 1.0, d_end)
            } else {
                (center, 0.5, d_center)
            };

            return ProjectionResult {
                vertex,
                fraction,
                distance,
            };
        }

        let t = point.subtract(self.start).dot(seg) / seg_len2;
        let t = t.clamp(0.0, 1.0);
        let proj = Vector::lerp(self.start, self.end, t);
        let d = point.distance(proj);

        ProjectionResult {
            vertex: proj,
            fraction: t,
            distance: d,
        }
    }

    pub fn vector(&self) -> Vector {
        self.end.subtract(self.start)
    }

    pub fn lerp(&self, f: f64) -> Vector {
        let v = self.vector();
        if v.length() < EPS_ABS {
            self.start.add(v.scale(0.5))
        } else {
            self.start.add(v.scale(f))
        }
    }
}

impl From<geo::Line> for LineSegment {
    fn from(l: geo::Line) -> Self {
        LineSegment {
            start: l.start.into(),
            end: l.end.into(),
        }
    }
}

impl From<LineSegment> for geo::Line {
    fn from(l: LineSegment) -> Self {
        geo::Line {
            start: l.start.into(),
            end: l.end.into(),
        }
    }
}

impl From<LineSegment> for Polyline {
    fn from(l: LineSegment) -> Self {
        Polyline::new(vec![l.start, l.end])
    }
}
