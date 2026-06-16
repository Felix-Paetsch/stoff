use itertools::Itertools;
use std::{collections::VecDeque, rc::Rc};
use union_find::{QuickFindUf, Union, UnionFind};

use crate::{
    geometry::{
        algorithms::merge_shapes::{
            lazy_closest_shape_positions::LazyClosestShapePositions,
            types::{MergePosition, ShapeDistanceDatum, ShapeEndpoint, ShapeEndpointPairDatum},
        },
        utils::distance_graph::distance_graph,
        Shape, ShapeT, Vector,
    },
    graph::algorithms::minimum_weight_perfect_matching::min_weight_matching_f64,
};

pub struct ShapeMergingUFData {
    // If this happens to become a polygon, we will merge into this (pot. stitched together) Polyline (can't be gon)
    // We need to keep an array for the case we merge into a line which becomes a gon again
    // Sorted from least distance to most distance
    pub merge_into_polyline: VecDeque<Rc<ShapeDistanceDatum>>,
    pub is_polygon: bool,
    pub merged_vertex_bound: usize,
}

impl Union for ShapeMergingUFData {
    fn union(lval: Self, rval: Self) -> union_find::UnionResult<Self> {
        // We make sure there are no inter-shape connections
        // We merge the shapes together

        // If we merged lines into a polygon this will be set later
        let is_polygon = lval.is_polygon && rval.is_polygon;
        let merged_vertex_bound = lval.merged_vertex_bound + rval.merged_vertex_bound + 4;
        let merge_into_polyline: VecDeque<Rc<ShapeDistanceDatum>> = {
            let mut a = lval.merge_into_polyline;
            let mut b = rval.merge_into_polyline;

            if a.is_empty() {
                b
            } else if b.is_empty() {
                a
            } else {
                let mut merged = VecDeque::with_capacity(a.len() + b.len());

                while !a.is_empty() && !b.is_empty() {
                    let front_a = a.front().unwrap();
                    let front_b = b.front().unwrap();

                    // If there is a connection between the two shape collections it is in both vecs with the
                    // same distance. We call those things duplicates
                    if front_a == front_b {
                        // most common case if there aren't intersections
                        if Rc::ptr_eq(front_a, front_b) {
                            a.pop_front();
                            b.pop_front();
                        } else {
                            // is it is a dublicate it must appear in b with the exact same distance
                            // every duplicate in a and thus in b is filtered out this way
                            let occurrence_in_b = b
                                .iter()
                                .skip(1)
                                .take_while(|item_b| *item_b == front_a)
                                .position(|item_b| Rc::ptr_eq(item_b, front_a))
                                .map(|p| p + 1);
                            if let Some(b_index) = occurrence_in_b {
                                a.pop_front();
                                b.remove(b_index);
                            } else {
                                merged.push_back(a.pop_front().unwrap());
                            }
                        }
                    } else if a.front() < b.front() {
                        let front = a.pop_front().unwrap();
                        merged.push_back(front);
                    } else {
                        let front = b.pop_front().unwrap();
                        merged.push_back(front);
                    }
                }

                // There can't be any more duplicates as a or b are empty
                merged.extend(a);
                merged.extend(b);
                merged
            }
        };

        debug_assert!(merge_into_polyline
            .iter()
            .is_sorted_by(|a, b| a.2.distance <= b.2.distance));

        union_find::UnionResult::Left(ShapeMergingUFData {
            merge_into_polyline,
            is_polygon,
            merged_vertex_bound,
        })
    }
}

pub struct MergeShapePositionsProvider<'a> {
    // Stores which shapes are merged together
    // Also used to compute if a set of polylines becomes a polygon which then could be merged into
    // another shape (always polyline)
    merged_shapes_uf: QuickFindUf<ShapeMergingUFData>,
    // Will be set if we close a polyline to a polygon and it wants to be merged into something
    // Is always valid if it exists
    next_merge: Option<Rc<ShapeDistanceDatum>>,

    lazy_closest_shape_positions: LazyClosestShapePositions<'a>,
    // Sorted. The smallest item is at the end for ez pop
    // An endpoint can appear at most once
    // Only line endpoints can appear
    possible_endpoint_merges: Vec<ShapeEndpointPairDatum>,
    // Count of remaining polygons such that when it reaches 0 and we merged all lines we can early
    // return
    remaining_polygons: usize,
}

impl<'a> MergeShapePositionsProvider<'a> {
    pub fn into_uf_and_matching(
        self,
    ) -> (QuickFindUf<ShapeMergingUFData>, Vec<ShapeEndpointPairDatum>) {
        (self.merged_shapes_uf, self.possible_endpoint_merges)
    }

    pub fn initialize_with_fixed_endpoints(
        shapes: &'a [Shape],
        mut fixed_endpoints: Vec<ShapeEndpoint>,
    ) -> MergeShapePositionsProvider<'a> {
        debug_assert!(shapes.iter().all(|s| !s.is_empty()));

        fixed_endpoints.sort_by(|a, b| b.0.cmp(&a.0));
        let mut mergable_endpoints: Vec<ShapeEndpoint> = Vec::with_capacity(shapes.len() * 2);
        // Treat a shape as polygon if it is a polygon and the endpoints aren't fixed
        let mut treat_shape_as_polygon: Vec<bool> = vec![true; shapes.len()];
        for i in 0..shapes.len() {
            if shapes[i].is_polygon() {
                if let Some(last) = fixed_endpoints.last() {
                    if i == last.shape_index() {
                        fixed_endpoints.pop();
                        treat_shape_as_polygon[i] = false;
                        if let Some(last) = fixed_endpoints.last() {
                            if i == last.shape_index() {
                                fixed_endpoints.pop();
                            }
                        }
                    }
                }
            } else {
                treat_shape_as_polygon[i] = false;
                if let Some(last) = fixed_endpoints.last() {
                    if i == last.0 {
                        fixed_endpoints.pop();
                    } else {
                        mergable_endpoints.push(ShapeEndpoint(i));
                    }
                } else {
                    mergable_endpoints.push(ShapeEndpoint(i))
                }
            }
        }

        let vecs: Vec<Vector> = mergable_endpoints
            .iter()
            .map(|ep| {
                let s = &shapes[ep.shape_index()];
                if ep.is_p1() {
                    s.vertex_at(0)
                } else {
                    s.vertex_at(s.looping_vertex_count() - 1)
                }
            })
            .collect();

        let distance_graph = distance_graph(&vecs);
        let matching = min_weight_matching_f64(&distance_graph);
        let matchable_endpoints: Vec<ShapeEndpointPairDatum> = matching
            .into_iter()
            .map(|(a, b)| {
                ShapeEndpointPairDatum(
                    mergable_endpoints[a],
                    mergable_endpoints[b],
                    vecs[a].distance(vecs[b]),
                )
            })
            .collect();

        // Validate the conditions on matchable endpoints
        // - sortedness (least as last)
        // - both ends are lines
        // - ends appear only once
        debug_assert!(matchable_endpoints.is_sorted_by(|a, b| a.2 > b.2));
        debug_assert!(matchable_endpoints
            .iter()
            .all(|p| !treat_shape_as_polygon[p.0.shape_index()]
                && !treat_shape_as_polygon[p.1.shape_index()]));
        debug_assert!({
            let points: Vec<ShapeEndpoint> = matchable_endpoints
                .iter()
                .cloned()
                .flat_map(|p| [p.0, p.1])
                .collect();

            let counts = points.into_iter().counts_by(|a| a.0);
            counts.into_values().all(|v| v == 1)
        });

        MergeShapePositionsProvider {
            next_merge: None,
            remaining_polygons: treat_shape_as_polygon.iter().map(|b| *b as usize).sum(),
            merged_shapes_uf: QuickFindUf::from_iter(
                shapes
                    .iter()
                    .zip(treat_shape_as_polygon)
                    .map(|(s, b)| ShapeMergingUFData {
                        merge_into_polyline: VecDeque::new(),
                        is_polygon: b,
                        merged_vertex_bound: s.vertex_count(),
                    }),
            ),
            possible_endpoint_merges: matchable_endpoints,
            lazy_closest_shape_positions: LazyClosestShapePositions::new(shapes),
        }
    }

    pub fn pop(&mut self) -> Option<MergePosition> {
        if let Some(next_merge) = self.next_merge.take() {
            return Some(self.merge_gon_rc(next_merge));
        }

        // We check the following:
        // 1. Is there at most only a matching?
        // 2. Is there only shape merge data?
        //    - can we successfully merge?
        // 3. Is matching closer?
        // 4. There is shape merge, it is closer
        //    - can we successfully merge?
        loop {
            self.lazy_closest_shape_positions
                .retain_lazy(|a, b| self.merged_shapes_uf.find(a) == self.merged_shapes_uf.find(b));
            let next_suggested_shape_merge = self.lazy_closest_shape_positions.peek();

            if next_suggested_shape_merge.is_none() {
                return self
                    .possible_endpoint_merges
                    .pop()
                    .map(|v| self.merge_line(v));
            }

            if self.possible_endpoint_merges.is_empty() {
                if self.remaining_polygons == 0 {
                    return None;
                }

                let shape_merge_data = self.lazy_closest_shape_positions.pop().unwrap();
                let merge_gon = self.merge_gon(shape_merge_data);

                if merge_gon.is_some() {
                    return merge_gon;
                }
                continue;
            }

            let next_suggested_shape_merge_distance =
                next_suggested_shape_merge.unwrap().2.distance;

            let next_suggested_matching_merge_distance =
                self.possible_endpoint_merges.last().unwrap().2;

            if next_suggested_matching_merge_distance <= next_suggested_shape_merge_distance {
                return self
                    .possible_endpoint_merges
                    .pop()
                    .map(|v| self.merge_line(v));
            }

            let shape_merge_data = self.lazy_closest_shape_positions.pop().unwrap();
            let merge_gon = self.merge_gon(shape_merge_data);

            if merge_gon.is_some() {
                return merge_gon;
            }
        }
    }

    fn merge_gon_rc(&mut self, pos: Rc<ShapeDistanceDatum>) -> MergePosition {
        // Exactly one is a polygon and they are disjoint
        debug_assert!(self.merged_shapes_uf.find(pos.0) != self.merged_shapes_uf.find(pos.1));
        debug_assert!(
            self.merged_shapes_uf.get(pos.0).is_polygon
                || self.merged_shapes_uf.get(pos.1).is_polygon
        );
        debug_assert!(
            !self.merged_shapes_uf.get(pos.0).is_polygon
                || !self.merged_shapes_uf.get(pos.1).is_polygon
        );

        self.merged_shapes_uf.union(pos.0, pos.1);
        self.remaining_polygons -= 1;

        MergePosition::Gon(Rc::try_unwrap(pos).unwrap())
    }

    fn merge_gon(&mut self, pos: ShapeDistanceDatum) -> Option<MergePosition> {
        debug_assert!(self.merged_shapes_uf.find(pos.0) != self.merged_shapes_uf.find(pos.1));

        let p0 = pos.0;
        let p1 = pos.1;

        // We can only merge if at least one of the two positions is a polygon
        if self.merged_shapes_uf.get(p0).is_polygon || self.merged_shapes_uf.get(p1).is_polygon {
            self.merged_shapes_uf.union(p0, p1);
            self.remaining_polygons -= 1;

            return Some(MergePosition::Gon(pos));
        }

        // Else remember for later that we want to merge

        let wrapped = Rc::new(pos);

        self.merged_shapes_uf
            .get_mut(p0)
            .merge_into_polyline
            .push_back(wrapped.clone());

        self.merged_shapes_uf
            .get_mut(p1)
            .merge_into_polyline
            .push_back(wrapped);

        None
    }

    fn merge_line(&mut self, pos: ShapeEndpointPairDatum) -> MergePosition {
        debug_assert!(
            !self.merged_shapes_uf.get(pos.0.shape_index()).is_polygon
                && !self.merged_shapes_uf.get(pos.1.shape_index()).is_polygon
        );
        debug_assert!(self.next_merge.is_none());

        let close_line_to_polygon = self.merged_shapes_uf.find(pos.0.shape_index())
            == self.merged_shapes_uf.find(pos.1.shape_index());

        self.merged_shapes_uf
            .union(pos.0.shape_index(), pos.1.shape_index());

        if !close_line_to_polygon {
            return MergePosition::LineLine(pos);
        }

        let union = self.merged_shapes_uf.get_mut(pos.0.shape_index());
        union.is_polygon = true;
        self.next_merge = union.merge_into_polyline.pop_front();
        self.remaining_polygons += 1;

        MergePosition::LineLine(pos)
    }
}
