import numpy as np
import math

class Boundary:
    def __init__(self, box, start, end, orientation):
        self.start = start
        self.end = end
        self.orientation = orientation
        self.box = box

def normalize_curve(v, target_pt_distance):
    # Initialize the new vertices list with the first vertex
    new_vertices = [v[0]]

    # Append the first vertex to the end of the array to form a closed loop
    v = np.append(v, [v[0]], axis=0)
    n = len(v)

    current_distance = 0.0

    for i in range(n - 1):
        next_distance = np.linalg.norm(v[(i + 1) % n] - v[i])
        if current_distance + next_distance < target_pt_distance:
            continue

        if current_distance > 0:
            current_distance = 0
            new_vertices.append(v[i])
            continue

        dir_vec = v[(i + 1) % n] - v[i]
        dir = dir_vec / np.linalg.norm(dir_vec)
        amt = int(math.ceil(next_distance / target_pt_distance))

        partition_len = np.linalg.norm(dir_vec) / amt

        for j in range(amt):
            new_point = v[i] + dir * (j + 1) * partition_len
            new_vertices.append(new_point)

        current_distance = 0

    # Convert the list of new vertices back to a NumPy array
    new_vertices = np.array(new_vertices)

    # Implementing the final if block
    first = new_vertices[0]
    last = new_vertices[-1]
    second_last = new_vertices[-2]

    if np.linalg.norm(last - first) < 5:
        if np.linalg.norm(second_last - first) < 10:
            # Remove the last point
            new_vertices = new_vertices[:-1]
        else:
            # Move the last point to halfway between the first and second last point
            new_vertices[-1] = (second_last + first) * 0.5

    return new_vertices
