import requests
import traceback

from api_wrapper.main import base_url, auth

def get_all_projects():
    try:
        response = requests.get(f"{base_url()}/get_projects", auth = auth())  # Adjust the endpoint as needed
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def get_project(pid):
    try:
        response = requests.get(f"{base_url()}/get_project/{pid}", auth = auth())  # Adjust the endpoint as needed
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def create_project(project_name):
    try:
        response = requests.post(f"{base_url()}/create_project", json={"project_name": project_name}, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def delete_project(project_id):
    try:
        response = requests.post(f"{base_url()}/delete_project", json={"project_id": project_id}, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def rename_project(project_id, new_name):
    try:
        response = requests.post(f"{base_url()}/rename_project", json={"project_id": project_id, "project_name": new_name}, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}