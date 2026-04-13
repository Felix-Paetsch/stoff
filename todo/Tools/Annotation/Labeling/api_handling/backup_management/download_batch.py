import traceback

from api_wrapper.img_batches import *
from .utils import *
from api_wrapper.main import *

def download_batch(batch_id, folder):
    res = sucessive_requests([
        lambda : create_folder(folder),
        lambda _: get_batch(batch_id),
        lambda batch_res: save_batch(batch_res, folder)
    ])
    return res

def save_batch(batch_res, folder):
    try:
        batch_res.pop("error", None)

        for im in batch_res["images"]:
            # Assuming base_url() returns the base URL
            url = base_url() + im['path']
            filename = im['path'].split('/')[-1]
            save_path = os.path.join(folder, filename)
            
            # Use requests to download the file
            response = requests.get(url, auth = auth())
            if response.status_code == 200:
                with open(save_path, 'wb') as file:
                    file.write(response.content)
            else:
                return {
                    "error": True,
                    "value": f"Failed to download {url}, status code {response.status_code}",
                    "stack": traceback.format_exc()
                }
            
        json_file_path = os.path.join(folder, "batch_data.json")
        with open(json_file_path, 'w') as json_file:
            json.dump(batch_res, json_file, indent=4)

        return {"error": False}
    except Exception:
        return {"error": True, "value": "Failed to save batch images", "stack": traceback.format_exc()}