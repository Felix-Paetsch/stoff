use crate::{
    geometry::{polyline::Polyline, vertex::Vertex},
    numerics::eps::scaled_epsilon,
};

#[derive(Debug, Clone, Copy)]
pub struct LineSegment {
    pub start: Vertex,
    pub end: Vertex,
}

pub struct ProjectionResult {
    pub vertex: Vertex,
    pub fraction: f64,
    pub distance: f64,
}

impl LineSegment {
    pub fn new(start: Vertex, end: Vertex) -> Self {
        LineSegment { start, end }
    }

    pub fn segment_scale(&self) -> f64 {
        let geom = self.start.subtract(self.end).length();
        Vertex::pair_scale(self.start, self.end).max(geom).max(1.0)
    }

    pub fn project(&self, point: Vertex) -> ProjectionResult {
        let seg = self.end.subtract(self.start);
        let seg_len2 = seg.length_squared();

        let seg_scale = self.segment_scale();
        let eps = scaled_epsilon(seg_scale);

        if seg_len2 <= eps * eps {
            let center = Vertex::lerp(self.start, self.end, 0.5);

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
        let proj = Vertex::lerp(self.start, self.end, t);
        let d = point.distance(proj);

        ProjectionResult {
            vertex: proj,
            fraction: t,
            distance: d,
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
        Polyline(vec![l.start, l.end])
    }
}
