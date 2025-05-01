import os
import sys
import traceback
from datetime import datetime

if __name__ == '__main__':
    # Act as if called from /api_handling
    sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

from api_wrapper.projects import get_all_projects
from backup_management.download_project import download_project

def download_everything(folder):
    try:
        os.makedirs(folder, exist_ok=True)
        project_res = get_all_projects()
        if project_res["error"]:
            return project_res

        for project in project_res["projects"]:
            download_res = download_project(
                project["id"],
                os.path.join(folder, f'project_{ project["id"] }')
            )

            if download_res["error"]:
                return download_res

        return {"error": False}
    except Exception:
        return {"error": True, "value": "Failed to download", "stack": traceback.format_exc()}

if __name__ == "__main__":
    # Get the current date, time, and timestamp
    current_time = datetime.now()
    formatted_time = current_time.strftime("%Y-%m-%d_%Hh-%Mm-%Ss")
    timestamp = int(current_time.timestamp())

    # Define the backup folder path with date, time, and timestamp
    folder_path = f"../data/backups/backup_{formatted_time}_{timestamp}"

    # Call the function with the generated folder path
    result = download_everything(folder_path)
    print(result)
