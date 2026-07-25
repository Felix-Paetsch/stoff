use crate::Vector;

#[derive(Clone, Copy)]
pub struct BoundingBox([f64; 4]);

#[allow(unused)]
impl BoundingBox {
    pub fn new(x: f64, y: f64, w: f64, h: f64) -> Self {
        debug_assert!(x.is_finite() && y.is_finite() && w.is_finite() && h.is_finite());
        debug_assert!(w >= 0.0 && h >= 0.0);
        BoundingBox([x, y, w, h])
    }

    pub fn from_x1_y1_x2_y2(x1: f64, y1: f64, x2: f64, y2: f64) -> Self {
        BoundingBox::new(x1, y1, x2 - x1, y2 - y1)
    }

    pub fn from_vectors<I>(iter: I) -> Option<Self>
    where
        I: IntoIterator<Item = Vector>,
    {
        let mut min_x = f64::INFINITY;
        let mut min_y = f64::INFINITY;
        let mut max_x = -f64::INFINITY;
        let mut max_y = -f64::INFINITY;

        for vec in iter.into_iter() {
            min_x = min_x.min(vec.x());
            min_y = min_y.min(vec.y());
            max_x = max_x.max(vec.x());
            max_y = max_y.max(vec.y());
        }

        if min_x.is_finite() {
            Some(BoundingBox::from_x1_y1_x2_y2(min_x, min_y, max_x, max_y))
        } else {
            None
        }
    }

    #[allow(unused)]
    pub fn x(&self) -> f64 {
        self.0[0]
    }

    #[allow(unused)]
    pub fn y(&self) -> f64 {
        self.0[1]
    }

    pub fn x1(&self) -> f64 {
        self.0[0]
    }

    pub fn y1(&self) -> f64 {
        self.0[1]
    }

    pub fn x2(&self) -> f64 {
        self.0[0] + self.0[2]
    }

    pub fn y2(&self) -> f64 {
        self.0[1] + self.0[3]
    }

    #[allow(unused)]
    pub fn width(&self) -> f64 {
        self.0[2]
    }

    #[allow(unused)]
    pub fn height(&self) -> f64 {
        self.0[3]
    }

    pub fn distance(self, other: BoundingBox) -> f64 {
        let dx = f64::max(
            0.0,
            f64::max(self.x1() - other.x2(), other.x1() - self.x2()),
        );
        let dy = f64::max(
            0.0,
            f64::max(self.y1() - other.y2(), other.y1() - self.y2()),
        );

        (dx * dx + dy * dy).sqrt()
    }

    pub fn contains(&self, v: Vector) -> bool {
        self.x1() <= v.x() && self.x2() >= v.x() && self.y1() <= v.y() && self.y2() >= v.y()
    }

    pub fn contains_properly(&self, v: Vector) -> bool {
        self.x1() < v.x() && self.x2() > v.x() && self.y1() < v.y() && self.y2() > v.y()
    }
}
