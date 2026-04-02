import requests
import traceback
import os
import mimetypes

from api_wrapper.main import base_url, auth
from api_wrapper.projects import get_all_projects

def set_example_img_title(example_img_id, example_img_title):
    try:
        endpoint = f"{base_url()}/set_example_img_title/{example_img_id}/{example_img_title}"
        response = requests.post(endpoint, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def get_example_images_for_project(project_id):
    try:
        endpoint = f"{base_url()}/example_images_for_project/{project_id}"
        response = requests.get(endpoint, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def delete_example_image(example_img_id):
    try:
        project_id_res = get_project_id_from_ex_img_id(example_img_id)
        if project_id_res["error"]:
            return project_id_res

        project_id = project_id_res["id"]

        endpoint = f"{base_url()}/delete_example_image/{project_id}/{example_img_id}"
        response = requests.post(endpoint, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def set_example_img_points(example_img_id, annotations):
    try:
        data = {"annotations": annotations}
        endpoint = f"{base_url()}/set_example_img_points/{example_img_id}"
        response = requests.post(endpoint, json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def upload_example_image(project_id, file_path, title):
    try:
        # Construct the URL for the POST request
        post_url = f'{base_url()}/upload_example_image/{project_id}/{title}'

        # Determine the MIME type of the file
        content_type, _ = mimetypes.guess_type(file_path)

        # Open the file in binary mode and prepare the files dictionary for the request
        with open(file_path, 'rb') as image_file:
            # The key 'image' matches the name expected by the Express server
            files = {'image': (os.path.basename(file_path), image_file, content_type)}
            response = requests.post(post_url, files=files, auth = auth())

        # Return the server's response as JSON
        return response.json()
    except Exception as e:
        return {"error": True, "value": "Failed to upload image", "stack": traceback.format_exc()}

def get_project_id_from_ex_img_id(iid):
    res = get_all_projects()
    if res["error"]:
        return res

    try:
        return dict(
                error = False,
                id = [
                    p for p in res["projects"] if
                        len([i for i in p["example_images"] if i["id"] == iid]) > 0
                ][0]["id"]
        )
    except:
        return dict(
            error = True,
            value = "Example image doesn't exist"
        )