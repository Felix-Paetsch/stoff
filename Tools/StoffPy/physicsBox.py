import json
import math
import numpy as np

from geometry_tools import *
from boundary import *
from plane import Plane
import config

class SimulationPoint:
    def __init__(self, pos, vel, acc, fixed):
        self.pos = pos
        self.vel = vel
        self.acc = acc
        self.fixed = fixed

    def __repr__(self):
        return f"({self.pos[0]}, {self.pos[1]})"

class PhysicsBox:
    def __init__(self, fp):
        with open(fp, 'r') as f:
            self.data = json.load(f)

        self.boundaries = []
        self.points = []

        self.target_pt_distance = math.sqrt(config.config()["area_per_pt"]/math.pi) * 2
        vertices = np.array(self.data["vertices"])
        self.vertices = normalize_curve(vertices, self.target_pt_distance)

        self.boundary(self.vertices)
        self.hex()

    def compute_bb(self, vertices):
        min_coords = np.min(vertices, axis=0)
        max_coords = np.max(vertices, axis=0)
        return [min_coords, max_coords]
    
    def boundary(self, vertices):
        if len(self.boundaries) > 0:
            assert self.point_in_boundary(vertices[0]), "Expected new boundary to be contained in the first one"
        else:
            self.bb = self.compute_bb(vertices)

        old_len = len(self.points)
        for i in range(len(vertices)):
            self.points.append(SimulationPoint(
                pos=vertices[i],
                vel=np.array([0.0, 0.0]),
                acc=np.array([0.0, 0.0]),
                fixed=True
            ))

        first_vec = vertices[1] - vertices[0]
        orth = get_orthogonal(first_vec) * 0.00001
        test_pt = vertices[0] + first_vec * 0.5 + orth

        orientation = is_point_in_polygon(test_pt, vertices)

        self.boundaries.append(Boundary(
            box=self,
            start=old_len,
            end=len(self.points),
            orientation=orientation
        ))

    def hex(self):
        assert len(self.boundaries) > 0, "We need a boundary before calling hex"

        triangle_h = math.sqrt(3) / 2 * self.target_pt_distance
        num_lines = int(math.ceil((self.bb[1][1] - self.bb[0][1]) / triangle_h))

        for i in range(num_lines + 1):
            y = self.bb[0][1] + i * triangle_h
            start_x = self.bb[0][0] + (self.target_pt_distance / 2 if i % 2 == 0 else 0)

            x = start_x
            while x <= self.bb[1][0]:
                point = np.array([x, y])
                if self.point_in_boundary(point):
                    self.points.append(SimulationPoint(
                        pos=point,
                        vel=np.array([0.0, 0.0]),
                        acc=np.array([0.0, 0.0]),
                        fixed=False
                    ))
                x += self.target_pt_distance

        return self
    
    def simulation_step(self):
        EPS = 1e-10
        cfg = config.config()
        exp = cfg["gravity_exp"]
        R = math.pow(self.target_pt_distance, exp)  # reference distance

        boundary_points = self.points[self.boundaries[0].start:self.boundaries[0].end]

        for i in range(len(self.points)):
            # Force between points
            for j in range(i + 1, len(self.points)):
                vec = self.points[j].pos - self.points[i].pos
                d = np.linalg.norm(vec)

                if d > cfg["point_force_influence_radius"] * self.target_pt_distance:
                    continue

                acc_amt = R * cfg["point_force_mult"] / math.pow(d + EPS, exp)
                acc = (vec / np.linalg.norm(vec)) * acc_amt

                if np.isnan(acc[0]):
                    acc = np.random.rand(2) * R

                self.points[i].acc -= acc
                self.points[j].acc += acc

            assert not np.isnan(self.points[i].acc[0]), "IsNaN"

            # Force from boundary (only apply if close enough)
            if self.points[i].fixed:
                continue
            for j in range(len(boundary_points)):
                e0 = boundary_points[j].pos
                e1 = boundary_points[(j + 1) % len(boundary_points)].pos

                c = closest_vec_on_line_segment(np.array([e0, e1]), self.points[i].pos)
                d = np.linalg.norm(self.points[i].pos - c)
                if d > self.target_pt_distance * cfg["boundary_force_influence_distance"]:
                    continue

                acc_amt = R * cfg["boundary_force_mult"] / math.pow(d + 0.0000001, exp)
                if np.isnan(acc_amt) or np.isinf(acc_amt):
                    acc_amt = R * 1000

                dir_vec = (e1 - e0) / np.linalg.norm(e1 - e0)
                if not self.boundaries[0].orientation:
                    dir_vec = -dir_vec

                acc = dir_vec * (acc_amt + EPS)

                self.points[i].acc += acc

            assert not np.isnan(self.points[i].acc[0]), "hwa"

        for i in range(len(self.points)):
            if not self.points[i].fixed:
                self.points[i].vel *= cfg["velocity_step_scale"]
                self.points[i].vel += self.points[i].acc

                if np.linalg.norm(self.points[i].vel) > self.target_pt_distance * cfg["velocity_max"]:
                    self.points[i].vel = (self.points[i].vel / np.linalg.norm(self.points[i].vel)) * self.target_pt_distance * cfg["velocity_max"]

                self.points[i].pos += self.points[i].vel
                self.points[i].acc = np.array([0.0, 0.0])

        return self
    
    def point_in_boundary(self, point):
        return is_point_in_polygon(point, self.vertices[self.boundaries[0].start:self.boundaries[0].end])
    
    def filter_expulsed_points(self):
        filtered_points = []
        new_boundaries = []

        currently_in_boundary = False
        boundary_start = 0
        current_index = 0
        boundary_count = 0

        for pt in self.points:
            if currently_in_boundary and not pt.fixed:
                currently_in_boundary = False
                new_boundaries.append(Boundary(
                    box=self,
                    start=boundary_start,
                    end=current_index,
                    orientation=self.boundaries[boundary_count].orientation
                ))
                boundary_count += 1
            elif not currently_in_boundary and pt.fixed:
                currently_in_boundary = True
                boundary_start = current_index

            if pt.fixed or self.point_in_boundary(pt.pos):
                filtered_points.append(pt)
                current_index += 1

        self.points = filtered_points
        self.boundaries = new_boundaries

        return self
    
    def to_plane(self):
        p = Plane()

        p.bb = self.bb  # Copy the bounding box
        p.vertices = [point.pos for point in self.points]  # Copy the vertices

        p.boundaries = self.boundaries  # Copy the boundaries

        return p