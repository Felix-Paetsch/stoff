use crate::geometry::{
    algorithms::intersections::modify_polyline_intersections::{
        build_shape_graph::build_shape_graph,
        types::{EdgeGrouping, NextEdgeRule, TraversalEdgeIdent, TraversalShapeGraphNode},
    },
    polyline::Polyline,
    vector::Vector,
};

pub fn walk_polyline_without_intersections(l: &Polyline) -> Polyline {
    modify_polyline_intersections(l, NextEdgeRule::Adjacent)
}

pub fn walk_polyline_with_intersections(l: &Polyline) -> Polyline {
    modify_polyline_intersections(l, NextEdgeRule::Skip)
}

fn modify_polyline_intersections(l: &Polyline, edge_rule: NextEdgeRule) -> Polyline {
    let shape_graph = match build_shape_graph(&l) {
        Some(g) => g,
        None => return Polyline::empty(),
    };

    let mut shape_graph_with_orientation: Vec<_> = shape_graph
        .into_iter()
        .map(|g| {
            let len = g.len();
            TraversalShapeGraphNode {
                edges: g,
                grouping: EdgeGrouping::NoOffset,
                visited: vec![false; len],
            }
        })
        .collect();

    loop {
        shape_graph_with_orientation[0].visited[0] = true;
        let mut current_edge: TraversalEdgeIdent =
            shape_graph_with_orientation[0].edges[0].into_traversal_edge_ident();

        // Walk from beginning to end
        loop {
            let next_index = current_edge.next_node_index;
            let next_node_edge_index = current_edge.next_node_edge_index;
            let next_node = &mut shape_graph_with_orientation[next_index];

            next_node.visited[next_node_edge_index] = true;
            let next_next_edge_index =
                compute_next_edge_index(next_node, next_node_edge_index, edge_rule);
            match next_next_edge_index {
                Some(index) => {
                    next_node.visited[index] = true;
                    current_edge = next_node.edges[index].into_traversal_edge_ident();
                }
                None => break,
            }
        }

        let mut exit_outer = true;
        for node in shape_graph_with_orientation.iter_mut() {
            if node.visited.iter().any(|b| !b) && node.visited.iter().any(|b| *b) {
                node.grouping.flip();
                exit_outer = false;
                break;
            }
        }

        if exit_outer {
            break;
        }

        for node in shape_graph_with_orientation.iter_mut() {
            node.visited.fill(false);
        }
    }

    walk_shape_graph_with_orientation(&mut shape_graph_with_orientation, edge_rule)
}

fn walk_shape_graph_with_orientation(
    g: &mut Vec<TraversalShapeGraphNode>,
    edge_rule: NextEdgeRule,
) -> Polyline {
    for node in g.iter_mut() {
        node.visited.fill(false);
    }

    g[0].visited[0] = true;
    let mut current_edge: TraversalEdgeIdent = g[0].edges[0].into_traversal_edge_ident();

    let mut res: Vec<Vector> = g[0].edges[0].subshape.clone();

    // Walk from beginning to end
    loop {
        let next_index = current_edge.next_node_index;
        let next_node_edge_index = current_edge.next_node_edge_index;
        let next_node = &mut g[next_index];

        next_node.visited[next_node_edge_index] = true;
        let next_next_edge_index =
            compute_next_edge_index(&next_node, next_node_edge_index, edge_rule);
        match next_next_edge_index {
            Some(index) => {
                next_node.visited[index] = true;
                res.extend(next_node.edges[index].subshape.clone());
                current_edge = next_node.edges[index].into_traversal_edge_ident();
            }
            None => break,
        }
    }

    Polyline(res)
}

fn compute_next_edge_index(
    g: &TraversalShapeGraphNode,
    index: usize,
    next_edge_rule: NextEdgeRule,
) -> Option<usize> {
    let unmodded_next_index = match (g.grouping, next_edge_rule) {
        (EdgeGrouping::NoOffset, NextEdgeRule::Adjacent) => {
            if index.is_multiple_of(2) {
                index + 1
            } else {
                index + g.edges.len() - 1
            }
        }
        (EdgeGrouping::Offset, NextEdgeRule::Adjacent) => {
            if !index.is_multiple_of(2) {
                index + 1
            } else {
                index + g.edges.len() - 1
            }
        }
        (EdgeGrouping::NoOffset, NextEdgeRule::Skip) => {
            if index.is_multiple_of(2) {
                index + 2
            } else {
                index + g.edges.len() - 2
            }
        }
        (EdgeGrouping::Offset, NextEdgeRule::Skip) => {
            if !index.is_multiple_of(2) {
                index + 2
            } else {
                index + g.edges.len() - 2
            }
        }
    };

    let next_index = unmodded_next_index % g.edges.len();
    if g.visited[next_index] {
        None
    } else {
        Some(next_index)
    }
}
