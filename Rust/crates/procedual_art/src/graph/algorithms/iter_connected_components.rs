use petgraph::Undirected;
use petgraph::graph::{Graph, NodeIndex};
use std::collections::HashSet;

pub fn iter_connected_components<'a, S, T>(
    g: &'a Graph<S, T, Undirected>,
) -> impl Iterator<Item = Graph<&'a S, &'a T, Undirected>> + 'a {
    let mut visited = HashSet::<NodeIndex>::new();
    let mut components = Vec::new();

    for start in g.node_indices() {
        if visited.contains(&start) {
            continue;
        }

        // Find every node in this connected component.
        let mut stack = vec![start];
        let mut nodes = Vec::new();
        visited.insert(start);

        while let Some(node) = stack.pop() {
            nodes.push(node);

            for neighbor in g.neighbors(node) {
                if visited.insert(neighbor) {
                    stack.push(neighbor);
                }
            }
        }

        // Map original node indices to indices in the component graph.
        let mut component = Graph::<&S, &T, Undirected>::new_undirected();
        let mut index_map = std::collections::HashMap::new();

        for old_index in &nodes {
            let new_index = component.add_node(&g[*old_index]);
            index_map.insert(*old_index, new_index);
        }

        // Add each undirected edge once.
        for edge in g.edge_indices() {
            let (source, target) = g.edge_endpoints(edge).unwrap();

            if let (Some(&new_source), Some(&new_target)) =
                (index_map.get(&source), index_map.get(&target))
            {
                component.add_edge(new_source, new_target, &g[edge]);
            }
        }

        components.push(component);
    }

    components.into_iter()
}
