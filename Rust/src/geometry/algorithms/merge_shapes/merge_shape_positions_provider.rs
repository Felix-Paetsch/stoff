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
        // If we merged lines into a polygon this will be set later
        let is_polygon = lval.is_polygon && rval.is_polygon;
        let merged_vertex_bound = if !lval.is_polygon && !rval.is_polygon {
            lval.merged_vertex_bound + rval.merged_vertex_bound
        } else {
            lval.merged_vertex_bound + rval.merged_vertex_bound + 4
        };

        // We make sure there are no inter-shape connections
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
                    if front_a.2.distance == front_b.2.distance {
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
                                .take_while(|item_b| item_b.2.distance == front_a.2.distance)
                                .position(|item_b| Rc::ptr_eq(item_b, front_a))
                                .map(|p| p + 1);
                            if let Some(b_index) = occurrence_in_b {
                                a.pop_front();
                                b.remove(b_index);
                            } else {
                                merged.push_back(a.pop_front().unwrap());
                            }
                        }
                    } else if front_a.2.distance < front_b.2.distance {
                        let front = a.pop_front().unwrap();
                        merged.push_back(front);
                    } else {
                        let front = b.pop_front().unwrap();
                        merged.push_back(front);
                    }
                }

                merged.extend(a);
                merged.extend(b);
                merged
            }
        };

        debug_assert!(merge_into_polyline
            .iter()
            .is_sorted_by_key(|a| a.2.distance));

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
    shape_count: usize,
    polygon_count: usize,
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
        fixed_endpoints.dedup_by_key(|a| a.0);
        let mut mergable_endpoints: Vec<ShapeEndpoint> = Vec::with_capacity(shapes.len() * 2);
        // Treat a shape as polygon if it is a polygon and the endpoints aren't fixed
        let mut treat_shape_as_polygon: Vec<bool> = shapes.iter().map(|s| s.is_polygon()).collect();
        for i in 0..shapes.len() * 2 {
            if shapes[i / 2].is_polygon() {
                if let Some(last) = fixed_endpoints.last() {
                    debug_assert!(i >= last.0);

                    // p1 comes first
                    // If this p1 and other p2 => push p1 as available and remove p2
                    // If this p1 and other p1 =>
                    //      If next is also the same shape, do nothing
                    //      Else push p2
                    if i / 2 == last.shape_index() {
                        treat_shape_as_polygon[i / 2] = false;
                        // If this p2 then nothing can happen as we already dealt with it
                        assert!(i.is_multiple_of(2));
                        if !last.is_p1() {
                            fixed_endpoints.pop();
                            mergable_endpoints.push(ShapeEndpoint(i));
                        } else if let Some(last) = fixed_endpoints.last() {
                            if last.shape_index() == i / 2 {
                                fixed_endpoints.pop();
                            } else {
                                mergable_endpoints.push(ShapeEndpoint(i + 1))
                            }
                        } else {
                            mergable_endpoints.push(ShapeEndpoint(i + 1))
                        }
                    }
                }
            } else {
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
        let mut matchable_endpoints: Vec<ShapeEndpointPairDatum> = matching
            .into_iter()
            .map(|(a, b)| {
                ShapeEndpointPairDatum(
                    mergable_endpoints[a],
                    mergable_endpoints[b],
                    vecs[a].distance(vecs[b]),
                )
            })
            .collect();
        matchable_endpoints.sort_by(|a, b| b.2.total_cmp(&a.2));

        // Validate the conditions on matchable endpoints
        // - sortedness (least as last)
        // - both ends are lines
        // - ends appear only once
        debug_assert!(matchable_endpoints.is_sorted_by(|a, b| a.2 >= b.2));
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
            shape_count: shapes.len(),
            polygon_count: treat_shape_as_polygon
                .iter()
                .cloned()
                .filter(|v| *v)
                .count(),
            next_merge: None,
            merged_shapes_uf: QuickFindUf::from_iter(
                shapes
                    .iter()
                    .zip(treat_shape_as_polygon)
                    .map(|(s, b)| ShapeMergingUFData {
                        merge_into_polyline: VecDeque::new(),
                        is_polygon: b,
                        merged_vertex_bound: if b {
                            s.vertex_count()
                        } else {
                            s.looping_vertex_count()
                        },
                    }),
            ),
            possible_endpoint_merges: matchable_endpoints,
            lazy_closest_shape_positions: LazyClosestShapePositions::new(shapes),
        }
    }

    pub fn shape_count(&mut self) -> usize {
        self.shape_count
    }

    pub fn polygon_count(&mut self) -> usize {
        self.polygon_count
    }

    pub fn pop_if_below_distance(&mut self, mut dist: f64) -> Option<MergePosition> {
        debug_assert!(self.polygon_count() <= self.shape_count());
        if dist.is_nan() {
            dist = -1.0;
        }

        if let Some(next_merge) = self.next_merge.as_ref() {
            if next_merge.2.distance <= dist {
                return self
                    .next_merge
                    .take()
                    .map(|next_merge| self.merge_gon_rc(next_merge));
            }
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
                .retain_lazy(|a, b| self.merged_shapes_uf.find(a) != self.merged_shapes_uf.find(b));
            let next_suggested_shape_merge = self.lazy_closest_shape_positions.peek();

            if next_suggested_shape_merge.is_none() {
                if let Some(endpoint_merge) = self.possible_endpoint_merges.last() {
                    return if endpoint_merge.2 <= dist {
                        self.possible_endpoint_merges
                            .pop()
                            .map(|v| self.merge_line(v))
                    } else {
                        None
                    };
                }
            }

            if self.possible_endpoint_merges.is_empty() {
                if self.polygon_count == 0 || next_suggested_shape_merge.unwrap().2.distance > dist
                {
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

            if next_suggested_shape_merge_distance.min(next_suggested_matching_merge_distance)
                > dist
            {
                return None;
            }

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
        debug_assert!(pos.0 != pos.1);
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

        self.shape_count -= 1;
        self.polygon_count -= 1;
        self.merged_shapes_uf.union(pos.0, pos.1);
        debug_assert!({
            // Check after the merging there are no intershape connections
            let merge_into_polyline: Vec<_> = self
                .merged_shapes_uf
                .get(pos.0)
                .merge_into_polyline
                .iter()
                .cloned()
                .collect();
            merge_into_polyline
                .iter()
                .all(|m| self.merged_shapes_uf.find(m.0) != self.merged_shapes_uf.find(m.1))
        });

        MergePosition::gon(Rc::try_unwrap(pos).unwrap())
    }

    fn merge_gon(&mut self, pos: ShapeDistanceDatum) -> Option<MergePosition> {
        debug_assert!(pos.0 != pos.1);
        debug_assert!(self.merged_shapes_uf.find(pos.0) != self.merged_shapes_uf.find(pos.1));

        let p0 = pos.0;
        let p1 = pos.1;

        // We can only merge if at least one of the two positions is a polygon
        if self.merged_shapes_uf.get(p0).is_polygon || self.merged_shapes_uf.get(p1).is_polygon {
            self.shape_count -= 1;
            self.polygon_count -= 1;
            self.merged_shapes_uf.union(p0, p1);
            debug_assert!({
                // Check after the merging there are no intershape connections
                let merge_into_polyline: Vec<_> = self
                    .merged_shapes_uf
                    .get(pos.0)
                    .merge_into_polyline
                    .iter()
                    .cloned()
                    .collect();
                merge_into_polyline
                    .iter()
                    .all(|m| self.merged_shapes_uf.find(m.0) != self.merged_shapes_uf.find(m.1))
            });

            return Some(MergePosition::gon(pos));
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
        debug_assert!(pos.0 .0 != pos.1 .0);
        debug_assert!(
            !self.merged_shapes_uf.get(pos.0.shape_index()).is_polygon
                && !self.merged_shapes_uf.get(pos.1.shape_index()).is_polygon
        );
        debug_assert!(self.next_merge.is_none());

        let close_line_to_polygon = self.merged_shapes_uf.find(pos.0.shape_index())
            == self.merged_shapes_uf.find(pos.1.shape_index());

        if !close_line_to_polygon {
            self.shape_count -= 1;
            self.merged_shapes_uf
                .union(pos.0.shape_index(), pos.1.shape_index());

            debug_assert!({
                // Check after the merging there are no intershape connections
                let merge_into_polylines: Vec<_> = self
                    .merged_shapes_uf
                    .get(pos.0.shape_index())
                    .merge_into_polyline
                    .iter()
                    .cloned()
                    .collect();
                merge_into_polylines
                    .iter()
                    .all(|m| self.merged_shapes_uf.find(m.0) != self.merged_shapes_uf.find(m.1))
            });

            return MergePosition::lineline(pos);
        }

        let merged_shape_data = self.merged_shapes_uf.get_mut(pos.0.shape_index());
        merged_shape_data.is_polygon = true;
        self.polygon_count += 1;
        self.next_merge = merged_shape_data.merge_into_polyline.front().cloned();

        MergePosition::lineline(pos)
    }
}
