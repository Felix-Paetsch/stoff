import requests
import traceback

from api_wrapper.main import base_url, auth

def get_points_for_project(project_id):
    try:
        response = requests.get(f"{base_url()}/get_points_for_project", json={"project_id": project_id}, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def get_joints_for_project(project_id):
    try:
        response = requests.get(f"{base_url()}/get_joints_for_project", json={"project_id": project_id}, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def create_point(project_id, name, color = "white"):
    try:
        data = {"project_id": project_id, "name": name, "color": color}
        response = requests.post(f"{base_url()}/create_point", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def rename_point(point_id, new_name):
    try:
        data = {"point_id": point_id, "new_name": new_name}
        response = requests.post(f"{base_url()}/rename_point", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def delete_point(point_id):
    try:
        response = requests.post(f"{base_url()}/delete_point", json={"point_id": point_id}, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def change_point_color(point_id, new_color):
    try:
        data = {"point_id": point_id, "new_color": new_color}
        response = requests.post(f"{base_url()}/change_point_color", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def set_point_position(point_id, positon):
    try:
        data = {"point_id": point_id, "position": position}
        response = requests.post(f"{base_url()}/set_point_position", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def create_joint(point1_id, point2_id):
    try:
        data = {"point1_id": point1_id, "point2_id": point2_id}
        response = requests.post(f"{base_url()}/create_joint", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def change_joint(joint_id, point1_id, point2_id):
    try:
        data = {"joint_id": joint_id, "point1_id": point1_id, "point2_id": point2_id}
        response = requests.post(f"{base_url()}/change_joint", json=data, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}

def delete_joint(joint_id):
    try:
        response = requests.post(f"{base_url()}/delete_joint", json={"joint_id": joint_id}, auth = auth())
        return response.json()
    except Exception:
        return {"error": True, "value": "Failed to make request", "stack": traceback.format_exc()}