use crate::geometry::*;

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

    pub fn length(&self) -> f64 {
        self.vector().length()
    }

    pub fn try_project(&self, point: Vector) -> Option<ProjectionResult> {
        let seg = self.end.subtract(self.start);
        let seg_len2 = seg.length_squared();

        let t = point.subtract(self.start).dot(seg) / seg_len2;
        if !t.is_finite() {
            return None;
        }

        let proj = Vector::lerp(self.start, self.end, t);
        let d = point.distance(proj);

        Some(ProjectionResult {
            vertex: proj,
            fraction: t,
            distance: d,
        })
    }

    pub fn project(&self, point: Vector) -> ProjectionResult {
        let seg = self.end.subtract(self.start);
        let seg_len2 = seg.length_squared();

        let t = point.subtract(self.start).dot(seg) / seg_len2;
        debug_assert!(t.is_finite());

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
        self.start.add(self.vector().scale(f))
    }

    pub fn inverse_lerp(&self, v: Vector) -> f64 {
        self.project(v).fraction
    }

    pub fn try_inverse_lerp(&self, v: Vector) -> Option<f64> {
        self.try_project(v).map(|a| a.fraction)
    }

    pub fn midpoint(&self) -> Vector {
        self.lerp(0.5)
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
