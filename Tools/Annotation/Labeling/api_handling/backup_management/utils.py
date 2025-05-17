import os
import traceback

def sucessive_requests(fn_calls, propagate_results = True):
    current_res = fn_calls[0]()

    for f in fn_calls[1:]:
        if current_res["error"] is True:
            return current_res
        
        if propagate_results:
            current_res = f(current_res)
        else:
            current_res = f()

    return current_res

def create_folder(folder_path):
    try:
        os.makedirs(folder_path)
        return {"error": False, "fp": folder_path}
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}