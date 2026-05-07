use crate::geometry::{polygon::Polygon, polyline::Polyline, vertex::Vertex};

pub enum Geometry {
    Point(Vertex),
    Polyline(Polyline),
    Polygon(Polygon),
}

impl Geometry {
    pub fn geometry_vec_to_vecf64(g: &[Geometry]) -> Vec<f64> {
        let mut out = Vec::new();

        for (i, geometry) in g.iter().enumerate() {
            if i > 0 {
                out.push(f64::NAN);
            }

            out.extend(Vec::<f64>::from(geometry));
        }

        out
    }

    pub fn vecf64_to_geometry_vec(v: &[f64]) -> Option<Vec<Geometry>> {
        if v.is_empty() {
            return Some(Vec::new());
        }

        let mut result = Vec::new();
        let mut start = 0usize;

        for (i, value) in v.iter().enumerate() {
            if value.is_nan() {
                if i == start {
                    return None;
                }

                let geometry = Geometry::try_from(&v[start..i]).ok()?;
                result.push(geometry);
                start = i + 1;
            }
        }

        if start == v.len() {
            return None;
        }

        let geometry = Geometry::try_from(&v[start..]).ok()?;
        result.push(geometry);

        Some(result)
    }

    pub fn serialize(&self) -> Vec<f64> {
        self.into()
    }

    pub fn deserialize(from: &[f64]) -> Option<Geometry> {
        Geometry::try_from(from).ok()
    }
}

impl From<Vertex> for Geometry {
    fn from(v: Vertex) -> Self {
        Geometry::Point(v)
    }
}

impl From<Polygon> for Geometry {
    fn from(g: Polygon) -> Self {
        Geometry::Polygon(g)
    }
}

impl From<Polyline> for Geometry {
    fn from(l: Polyline) -> Self {
        Geometry::Polyline(l)
    }
}

impl TryFrom<&[f64]> for Geometry {
    type Error = String;

    fn try_from(values: &[f64]) -> Result<Self, Self::Error> {
        if values.is_empty() {
            return Err("geometry slice is empty".to_string());
        }

        let tag = values[0];

        if tag.is_nan() {
            return Err("geometry tag cannot be NaN".to_string());
        }

        if tag.fract() != 0.0 {
            return Err("geometry tag must be an integer value".to_string());
        }

        match tag as i32 {
            0 => {
                if values.len() != 3 {
                    return Err("Point geometry must contain tag, x, y".to_string());
                }

                Ok(Geometry::Point(Vertex::new(values[1], values[2])))
            }
            1 => {
                if values.len() < 3 {
                    return Err("Polyline must contain at least one x,y pair".to_string());
                }

                if !(values.len() - 1).is_multiple_of(2) {
                    return Err(
                        "Polyline coordinate data must contain an even number of values"
                            .to_string(),
                    );
                }

                let vertices: Vec<Vertex> = values[1..]
                    .chunks_exact(2)
                    .map(|chunk| Vertex::new(chunk[0], chunk[1]))
                    .collect();

                Ok(Geometry::Polyline(Polyline::new(vertices)))
            }
            2 => {
                if values.len() < 3 {
                    return Err("Polygon must contain at least one x,y pair".to_string());
                }

                if !(values.len() - 1).is_multiple_of(2) {
                    return Err(
                        "Polygon coordinate data must contain an even number of values".to_string(),
                    );
                }

                let vertices: Vec<Vertex> = values[1..]
                    .chunks_exact(2)
                    .map(|chunk| Vertex::new(chunk[0], chunk[1]))
                    .collect();

                Ok(Geometry::Polygon(Polygon::new(vertices)))
            }
            _ => Err("geometry tag must be 0, 1, or 2".to_string()),
        }
    }
}

impl From<&Geometry> for Vec<f64> {
    fn from(geometry: &Geometry) -> Self {
        match geometry {
            Geometry::Point(vertex) => vec![0.0, vertex.x, vertex.y],
            Geometry::Polyline(polyline) => {
                let mut values = Vec::with_capacity(1 + polyline.0.len() * 2);
                values.push(1.0);

                for vertex in &polyline.0 {
                    values.push(vertex.x);
                    values.push(vertex.y);
                }

                values
            }
            Geometry::Polygon(polygon) => {
                let mut values = Vec::with_capacity(1 + polygon.0.len() * 2);
                values.push(2.0);

                for vertex in &polygon.0 {
                    values.push(vertex.x);
                    values.push(vertex.y);
                }

                values
            }
        }
    }
}

impl From<Geometry> for geo::Geometry {
    fn from(geometry: Geometry) -> Self {
        match geometry {
            Geometry::Point(p) => geo::Geometry::Point(Vertex::into(p)),
            Geometry::Polyline(l) => geo::Geometry::LineString(Polyline::into(l)),
            Geometry::Polygon(g) => geo::Geometry::Polygon(Polygon::into(g)),
        }
    }
}
