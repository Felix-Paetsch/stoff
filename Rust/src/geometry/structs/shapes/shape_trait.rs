use crate::geometry::{Geometry, LineSegment, Polygon, Polyline, Shape, Vector};

pub trait ShapeT: Sized {
    fn vertices(&self) -> &[Vector];
    fn into_vertices(self) -> Vec<Vector>;
    fn is_polyline(&self) -> bool;

    fn lines(&self) -> Box<dyn Iterator<Item = LineSegment> + '_> {
        if self.is_polyline() {
            Box::new(
                self.vertices()
                    .windows(2)
                    .map(|window| LineSegment::new(window[0], window[1])),
            )
        } else {
            if self.is_empty() {
                Box::new(std::iter::empty())
            } else {
                Box::new(
                    self.vertices()
                        .windows(2)
                        .map(|window| LineSegment::new(window[0], window[1]))
                        .chain(std::iter::once(LineSegment::new(
                            self.vertex_at(self.vertex_count() - 1),
                            self.vertex_at(0),
                        ))),
                )
            }
        }
    }

    fn vertices_rev(&self) -> Box<dyn Iterator<Item = Vector> + '_> {
        if self.is_polyline() {
            Box::new(self.vertices().iter().rev().copied())
        } else {
            if self.is_empty() {
                Box::new(std::iter::empty())
            } else {
                Box::new(
                    std::iter::once(self.vertex_at(0))
                        .chain(self.vertices().iter().skip(1).rev().copied()),
                )
            }
        }
    }

    fn vertex_count(&self) -> usize {
        self.vertices().len()
    }

    #[inline]
    fn vertex_at(&self, at: usize) -> Vector {
        debug_assert!(self.is_polygon() || at < self.vertex_count());
        self.vertices()[at % self.vertex_count()]
    }

    fn is_polygon(&self) -> bool {
        !self.is_polyline()
    }

    fn is_empty(&self) -> bool {
        self.vertex_count() == 0
    }

    fn linesegment_at(&self, at: usize) -> Option<LineSegment> {
        if at < self.vertex_count() - 1 {
            Some(LineSegment {
                start: self.vertex_at(at),
                end: self.vertex_at(at + 1),
            })
        } else if at == self.vertex_count() - 1 && self.is_polygon() {
            Some(LineSegment {
                start: self.vertex_at(at),
                end: self.vertex_at(0),
            })
        } else {
            None
        }
    }

    fn looping_vertex_count(&self) -> usize {
        if self.is_empty() {
            return 0;
        }

        if self.is_polyline() {
            self.vertex_count()
        } else {
            self.vertex_count() + 1
        }
    }

    fn vertices_from_to(&self, from: usize, to: usize) -> Box<dyn Iterator<Item = Vector> + '_> {
        Box::new((from..to).map(|v| self.vertex_at(v)))
    }

    fn vertices_rev_from_to(
        &self,
        from: usize,
        to: usize,
    ) -> Box<dyn Iterator<Item = Vector> + '_> {
        let len = self.looping_vertex_count();
        Box::new((from..to).map(move |v| self.vertex_at(len - v - 1)))
    }

    #[allow(unused)]
    fn vertices_looping(&self) -> Box<dyn Iterator<Item = Vector> + '_> {
        if self.is_empty() {
            Box::new(self.vertices().iter().copied())
        } else {
            Box::new(
                self.vertices()
                    .iter()
                    .copied()
                    .chain(std::iter::once(self.vertex_at(0))),
            )
        }
    }

    fn linesegment_count(&self) -> usize {
        if self.is_empty() {
            return 0;
        }

        if self.is_polyline() {
            self.vertex_count() - 1
        } else {
            self.vertex_count()
        }
    }

    fn into_polygon(self) -> Polygon {
        let mut verts: Vec<Vector> = self.into_vertices();
        if verts.last().unwrap() == verts.first().unwrap() && verts.len() > 2 {
            verts.pop();
        }
        Polygon::new(verts)
    }

    fn into_polyline(self) -> Polyline {
        match self.is_polyline() {
            true => Polyline::new(self.into_vertices()),
            false => {
                let mut verts: Vec<Vector> = self.into_vertices();
                if verts.is_empty() {
                    return Polyline::empty();
                }

                verts.push(verts[0]);
                Polyline::new(verts)
            }
        }
    }

    #[allow(unused)]
    fn into_shape(self) -> Shape {
        match self.is_polyline() {
            true => Shape::Polyline(self.into_polyline()),
            false => Shape::Polygon(self.into_polygon()),
        }
    }

    #[allow(dead_code)]
    fn into_geometry(self) -> Geometry {
        match self.is_polyline() {
            true => Geometry::Polyline(self.into_polyline()),
            false => Geometry::Polygon(self.into_polygon()),
        }
    }

    fn length(&self) -> f64 {
        let mut current_len = 0.0;
        for ls in self.lines() {
            current_len += ls.end.distance(ls.start)
        }
        current_len
    }

    #[allow(unused)]
    fn clone_to_shape(&self) -> Shape {
        if self.is_polyline() {
            Shape::Polyline(Polyline::new(self.vertices().to_vec()))
        } else {
            Shape::Polygon(Polygon::new(self.vertices().to_vec()))
        }
    }
}
