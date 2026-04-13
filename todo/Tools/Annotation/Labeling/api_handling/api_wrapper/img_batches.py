import requests
import traceback
import os
import mimetypes

from api_wrapper.main import base_url, auth
from api_wrapper.projects import get_all_projects

def create_batch(project_id, batch_name):
    try:
        data = {"project_id": project_id, "batch_name": batch_name}
        response = requests.post(f"{base_url()}/create_batch", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def rename_batch(batch_id, new_name):
    try:
        data = {"batch_id": batch_id, "name": new_name}
        response = requests.post(f"{base_url()}/rename_batch", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def delete_batch(batch_id):
    try:
        project_id_res = get_project_id_from_batch_id(batch_id)
        if project_id_res["error"]:
            return project_id_res

        project_id = project_id_res["id"]
        data = {"project_id": project_id, "batch_id": batch_id}
        response = requests.post(f"{base_url()}/delete_batch", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def get_batch(batch_id):
    try:
        response = requests.get(f"{base_url()}/get_batch/{batch_id}", auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def get_batches(project_id):
    try:
        response = requests.get(f"{base_url()}/get_batches/{project_id}", auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def upload_image_to_img_batch(batch_id, file_path, backup_img_data = None):
    try:
        project_id_res = get_project_id_from_batch_id(batch_id)
        if project_id_res["error"]:
            return project_id_res

        project_id = project_id_res["id"]

        post_url = f'{base_url()}/upload_img_to_img_set/project/{project_id}/batch/{batch_id}'

        # Determine the MIME type of the file
        content_type, _ = mimetypes.guess_type(file_path)

        with open(file_path, 'rb') as image_file:
            # Include filename and content type
            files = {'image': (os.path.basename(file_path), image_file, content_type)}
            response = requests.post(post_url, files=files, auth=auth(), params=backup_img_data)
        # Return the server's response
        return response.json()
    except Exception as e:
        return {"error": True, "value": "Failed to upload image", "stack": traceback.format_exc()}

def delete_img(img_id):
    try:
        response = requests.post(f"{base_url()}/delete_img/{img_id}", auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to delete img", "stack": traceback.format_exc()}

def get_project_id_from_batch_id(bid):
    res = get_all_projects()
    if res["error"]:
        return res
        
    try:
        return dict(
                error = False,
                id = [
                    p for p in res["projects"] if
                        len([b for b in p["batches"] if b["id"] == bid]) > 0
                ][0]["id"]
        )
    except:
        return dict(
            error = True,
            value = "Batch doesn't exist"
        )