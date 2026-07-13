use crate::geometry::LineSegment;

pub struct LengthMap(Vec<f64>);

#[allow(unused)]
pub struct LengthMapPosition {
    pub index: usize,
    pub frac: f64,
}

impl LengthMap {
    pub fn new<I>(segments: I) -> Self
    where
        I: IntoIterator<Item = LineSegment>,
    {
        let mut lengths = Vec::new();
        lengths.push(0.0);

        let mut total = 0.0;
        for seg in segments {
            total += seg.length();
            lengths.push(total);
        }

        Self(lengths)
    }

    #[allow(unused)]
    pub fn lengths(&self) -> &[f64] {
        &self.0
    }

    pub fn length(&self) -> f64 {
        self.0.last().copied().unwrap_or(0.0)
    }

    #[allow(unused)]
    pub fn into_lengths(self) -> Vec<f64> {
        self.0
    }

    #[allow(unused)]
    pub fn position_at_length(&self, p: f64) -> LengthMapPosition {
        let m = &self.0;
        let n = m.len();

        if n <= 1 {
            return LengthMapPosition {
                index: 0,
                frac: 0.0,
            };
        }

        if p <= m[0] {
            return LengthMapPosition {
                index: 0,
                frac: 0.0,
            };
        }

        if p >= m[n - 1] {
            return LengthMapPosition {
                index: n - 2,
                frac: 1.0,
            };
        }

        match m.binary_search_by(|x| x.total_cmp(&p)) {
            Ok(0) => LengthMapPosition {
                index: 0,
                frac: 0.0,
            },
            Ok(i) => LengthMapPosition {
                index: i - 1,
                frac: 1.0,
            },
            Err(i) => {
                let index = i - 1;
                let start = m[index];
                let end = m[index + 1];
                let frac = if end > start {
                    (p - start) / (end - start)
                } else {
                    0.0
                };

                LengthMapPosition { index, frac }
            }
        }
    }

    #[allow(unused)]
    pub fn length_at(&self, p: LengthMapPosition) -> f64 {
        let m = &self.0;

        if m.len() <= 1 {
            return 0.0;
        }

        let index = p.index.min(m.len() - 2);
        let frac = p.frac.clamp(0.0, 1.0);

        let start = m[index];
        let end = m[index + 1];
        start + (end - start) * frac
    }
}
