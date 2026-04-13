from api_wrapper.img_batches import *
from .utils import sucessive_requests
from api_wrapper.main import base_url, auth
import json

def upload_folder_images_to_batch(batch_id, folder):
    for file in os.listdir(folder):
        if file.endswith(('.jpg', '.jpeg', '.png')):
            full_path = os.path.join(folder, file)
            res = upload_image_to_img_batch(batch_id, full_path, allowNameOverwrite = False)
            if res.Error:
                return res

def create_batch_from_folder(project_id, batch_name, folder_path):
    return sucessive_requests([
        lambda : create_batch(project_id, batch_name),
        lambda batch_res : upload_folder_images_to_batch(batch_res.batch_id, folder_path)
    ])

def upload_img_batch_from_batch_data(data):
    # usually batch_data.json
    try:
        batch_res = create_batch(data["new_project_id"], data["name"])
        if batch_res["error"]:
            return batch_res

        batch_id = batch_res["batch_id"]
        data["new_batch_id"] = batch_id

        # Examples images
        for img in data["images"]:
            img["new_batch_id"] = batch_id
            img_res = upload_image_to_img_batch(batch_id, img["local_path"], backup_img_data = img)
            if img_res["error"]:
                return img_res
            
            img["new_id"] = img_res["id"]
        

        annotation_res = make_img_annotation_req(data)
        if annotation_res["error"]:
            return annotation_res

        return { "error": False }
    except Exception:
        return {"error": True, "value": "Something seems wrong with the saved data", "stack": traceback.format_exc()}

def make_img_annotation_req(data):
    # Note: points will only be restored if called via upload_project -> upload_img_batch_from_batch_data
    for im in data["images"]:
        im["id"] = im["new_id"]
        if "points" not in data:
            im["point_data"] = "[]"
            continue

        try:
            im_points = json.loads(im["points"])
            for pt in im_points:
                pt["point_id"] = [npt["new_id"] for npt in data["points"] if npt["id"] == pt["point_id"]][0]

            im["point_data"] = json.dumps(im_points)
        except Exception:
            im["point_data"] = "[]"

    # Create img_data with a new object for each image, excluding 'path' if present
    img_data = [
        {k: v for k, v in im.items() if k != "path"} for im in data["images"]
    ]

    try:
        response = requests.post(f"{base_url()}/requests/upload_all_annotations_force", json={
            "imgBatchId": str(data["new_batch_id"]),
            "project_id": str(data["new_project_id"]),
            "img_data": img_data
        }, auth=auth())
        return {"error": False}
    except Exception:
        return {"error": True, "value": "Failed to delete img", "stack": traceback.format_exc()}
