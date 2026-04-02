import numpy as np

def get_orthogonal(vec):
    return np.array([vec[1], -vec[0]])

def is_point_in_polygon(point, polygon):
    intersections = 0
    n = len(polygon)

    for i in range(n):
        v1 = polygon[i]
        v2 = polygon[(i + 1) % n]

        if is_ray_intersecting_edge(point, v1, v2):
            intersections += 1

    return intersections % 2 != 0

def is_point_on_polygon(point, polygon, tolerance):
    n = len(polygon)

    for i in range(n):
        v1 = polygon[i]
        v2 = polygon[(i + 1) % n]

        if distance_from_line_segment(np.array([v1, v2]), point) < tolerance:
            return True

    return False

def is_ray_intersecting_edge(point, v1, v2):
    if v1[1] > v2[1]:
        v1, v2 = v2, v1

    if point[1] == v1[1] or point[1] == v2[1]:
        point[1] += 1e-9

    if point[1] < v1[1] or point[1] > v2[1]:
        return False

    intersection_x = v1[0] + (point[1] - v1[1]) * (v2[0] - v1[0]) / (v2[1] - v1[1])
    return point[0] < intersection_x

def distance_from_line_segment(line_points, point):
    v1, v2 = line_points[0], line_points[1]
    line_vec = v2 - v1
    point_vec = point - v1

    line_len = np.linalg.norm(line_vec)
    line_dir = line_vec / line_len

    projection = np.dot(point_vec, line_dir)
    if projection < 0:
        closest_point = v1
    elif projection > line_len:
        closest_point = v2
    else:
        closest_point = v1 + projection * line_dir

    return np.linalg.norm(point - closest_point)

def closest_vec_on_line_segment(line_segment, point):
        v1, v2 = line_segment[0], line_segment[1]
        line_vec = v2 - v1
        point_vec = point - v1

        line_len = np.linalg.norm(line_vec)
        line_dir = line_vec / line_len

        projection = np.dot(point_vec, line_dir)
        if projection < 0:
            closest_point = v1
        elif projection > line_len:
            closest_point = v2
        else:
            closest_point = v1 + projection * line_dir

        return closest_point