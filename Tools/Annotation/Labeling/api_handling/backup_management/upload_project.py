import os
import json

from .utils import *
from .upload_img_batch import *
from api_wrapper.projects import *
from api_wrapper.points_and_joints import *
from api_wrapper.example_image import *

def upload_project(folder):
    res = sucessive_requests([
        lambda: gather_project_data(folder),
        lambda data: upload_project_data(data)
    ])

    return res

def upload_project_data(data):
    try:
        project_res = create_project(data["meta"]["name"])
        if project_res["error"]:
            return project_res

        project_id = project_res["id"]

        # Points
        for point in data["meta"]["points"]:
            point_res = create_point(project_id, point["name"], point["color"])

            if point_res["error"]:
                return point_res

            point["new_id"] = point_res["point_id"]

        # Joints
        for joint in data["meta"]["joints"]:
            joint_res = create_joint(
                [pt["new_id"] for pt in data["meta"]["points"] if str(pt["id"]) == str(joint["point_id"])][0],
                [pt["new_id"] for pt in data["meta"]["points"] if str(pt["id"]) == str(joint["connected_point_id"])][0]
            )

            if joint_res["error"]:
                return joint_res

        # Examples images
        for ex_img in data["example_images"]:
            ex_img_res = upload_example_image(project_id, ex_img["local_path"], ex_img["title"])
            if ex_img_res["error"]:
                return ex_img_res
            
            ex_img_points = json.loads(ex_img["points"])
            for pt in ex_img_points:
                pt["point_id"] = [p["new_id"] for p in data["meta"]["points"] if p["id"] == pt["point_id"]][0]

            set_point_res = set_example_img_points(ex_img_res["id"], ex_img_points)
            if set_point_res["error"]:
                return set_point_res

        for batch in data["batches"]:
            batch["new_project_id"] = project_id
            batch["points"] = data["meta"]["points"]
            batch_res = upload_img_batch_from_batch_data(batch)
            if batch_res["error"]:
                return batch_res

        return { "error": False }
    except Exception:
        return {"error": True, "value": "Something seems wrong with the saved data", "stack": traceback.format_exc()}

def gather_project_data(folder):
    try:
        result = {
            "meta": None,
            "example_images": None,
            "batches": []
        }

        # Load "project_meta_data.json" into "meta"
        with open(os.path.join(folder, "project_meta_data.json"), 'r') as file:
            result["meta"] = json.load(file)

        # Load "examples_img_data.json" into "example_images"
        with open(os.path.join(folder, "example_images/example_img_data.json"), 'r') as file:
            result["example_images"] = json.load(file)

        for im in result["example_images"]:
            im["local_path"] = os.path.join(folder, "example_images", im['path'].split('/')[-1])

        # Identify batch folders and load their data
        for item in os.listdir(folder):
            if not (os.path.isdir(os.path.join(folder, item)) and item.startswith("batch_")):
                continue

            batch_folder_path = os.path.join(folder, item)
            batch_data_path = os.path.join(batch_folder_path, "batch_data.json")
            with open(batch_data_path, 'r') as file:
                batch_data = json.load(file)
                for im in batch_data["images"]:
                    im["local_path"] = os.path.join(batch_folder_path, im['path'].split('/')[-1])
                result["batches"].append(batch_data)

        result["error"] = False
        return result
    except Exception:
        return {"error": True, "value": "Failed to collect project data from folder", "stack": traceback.format_exc()}