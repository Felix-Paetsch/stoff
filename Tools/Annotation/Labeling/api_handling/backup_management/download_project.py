import os
import traceback

from api_wrapper.projects import *
from api_wrapper.img_batches import *
from .utils import *
from .download_batch import *
from api_wrapper.example_image import *
from api_wrapper.main import *

def download_project(project_id, folder):
    res = sucessive_requests([
        lambda : create_folder(folder),
        lambda _: get_batches(project_id),
        lambda batch_res: download_image_batches_to_folder(batch_res, folder),
        lambda _: get_example_images_for_project(project_id),
        lambda example_img_res: download_example_images_to_folder(example_img_res["images"], folder),
        lambda _: get_project(project_id),
        lambda project_res: save_project_meta_data(project_res, folder)
    ])

    return res

def download_image_batches_to_folder(batch_res, folder):
    for batch in batch_res["batches"]:
        res = download_batch(batch["id"], os.path.join(folder, "batch_" + str(batch["id"])))
        if res["error"]:
            return res

    return { "error": False }

def download_example_images_to_folder(images, folder):
    try:
        img_folder_path = os.path.join(folder, "example_images")
        os.makedirs(img_folder_path)

        for im in images:
            # Assuming base_url() returns the base URL
            url = base_url() + im['path']
            filename = im['path'].split('/')[-1]
            save_path = os.path.join(img_folder_path, filename)
            
            # Use requests to download the file
            response = requests.get(url, auth = auth())
            if response.status_code == 200:
                try:
                    with open(save_path, 'wb') as file:
                        file.write(response.content)
                except:
                    return {
                        "error": True, 
                        "value": "Failed to save image", 
                        "stack": traceback.format_exc()
                    }

            else:
                return {
                    "error": True,
                    "value": "Failed to download {url}, status code {response.status_code}"
                }
            
        json_file_path = os.path.join(img_folder_path, "example_img_data.json")
        with open(json_file_path, 'w') as json_file:
            json.dump(images, json_file, indent=4)

        return {"error": False}
    except Exception:
        return {"error": True, "value": "Failed to save example images", "stack": traceback.format_exc()}


def save_project_meta_data(project_res, folder):
    try:
        project_res.pop("error", None)
        json_file_path = os.path.join(folder, "project_meta_data.json")
        with open(json_file_path, 'w') as json_file:
            json.dump(project_res, json_file, indent=4)

        return {"error": False}
    except Exception:
        return {"error": True, "value": "Failed to save project meta data", "stack": traceback.format_exc()}