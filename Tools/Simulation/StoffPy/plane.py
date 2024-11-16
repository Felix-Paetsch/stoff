import numpy as np
import triangle as tr
import matplotlib.pyplot as plt
import matplotlib.collections as mc
from geometry_tools import is_point_on_polygon, is_point_in_polygon

class Plane:
    def __init__(self, vertices=None, joints=None, boundaries=None, bb=None):
        self.vertices = vertices if vertices is not None else []
        self.joints = joints if joints is not None else []
        self.boundaries = boundaries if boundaries is not None else []
        self.bb = bb if bb is not None else [np.array([0.0, 0.0]), np.array([0.0, 0.0])]

    def triangulate(self):
        # Convert vertices and boundary edges to Triangle's input format
        segments = []
        for boundary in self.boundaries:
            for i in range(boundary.start, boundary.end):
                p1_i = i
                p2_i = boundary.start if i + 1 == boundary.end else i + 1
                segments.append((p1_i, p2_i))

        # Prepare the input dictionary for the Triangle library
        A = {
            'vertices': np.array(self.vertices),
            'segments': np.array(segments)
        }

        # Perform Constrained Delaunay Triangulation
        B = tr.triangulate(A, 'p')
        edge_set = set()

        if 'triangles' in B:
            triangles = B['triangles']
            for triangle in triangles:
                # Extract edges as pairs of vertex indices
                edges = [
                    (min(triangle[0], triangle[1]), max(triangle[0], triangle[1])),
                    (min(triangle[1], triangle[2]), max(triangle[1], triangle[2])),
                    (min(triangle[2], triangle[0]), max(triangle[2], triangle[0])),
                ]
                # Add each edge to the set (automatically handles duplicates)
                for edge in edges:
                    edge_set.add(edge)

        # Convert the set to a list for self.joints
        self.joints = list(edge_set)

        # Filter out edges that are not inside the first boundary
        filtered_edges = set()

        for edge in self.joints:
            p1_i, p2_i = edge
            center = (self.vertices[p1_i] + self.vertices[p2_i]) * 0.5

            # Check if the midpoint of the edge is within the first boundary
            if is_point_in_polygon(center, self.vertices[self.boundaries[0].start:self.boundaries[0].end]) \
            or is_point_on_polygon(center, self.vertices[self.boundaries[0].start:self.boundaries[0].end], 0.00001):
                filtered_edges.add(edge)

        self.joints = list(filtered_edges)

    def render(self, filename="plane.png"):
        # Initialize the plot
        fig, ax = plt.subplots()

        # Plot the vertices
        vertices_array = np.array(self.vertices)
        ax.plot(vertices_array[:, 0], vertices_array[:, 1], 'o', markersize=5, color='black', zorder=3)

        # Plot the joints (edges)
        lines = []
        for p1_i, p2_i in self.joints:
            p1 = self.vertices[p1_i]
            p2 = self.vertices[p2_i]
            lines.append([p1, p2])

        if lines:
            lc = mc.LineCollection(lines, colors='blue', linewidths=1, zorder=2)
            ax.add_collection(lc)

        # Plot the boundaries
        for boundary in self.boundaries:
            boundary_vertices = vertices_array[boundary.start:boundary.end]
            boundary_vertices = np.vstack((boundary_vertices, boundary_vertices[0]))  # Close the loop
            ax.plot(boundary_vertices[:, 0], boundary_vertices[:, 1], 'r-', linewidth=2, zorder=1)

        # Set the bounding box limits
        ax.set_xlim(self.bb[0][0], self.bb[1][0])
        ax.set_ylim(self.bb[0][1], self.bb[1][1])
        ax.set_aspect('equal', adjustable='box')

        # Save the plot to a PNG file
        plt.savefig(filename)
        plt.close(fig)
