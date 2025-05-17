import os
import sys
import traceback

if __name__ == '__main__':
    # Act as if called from /api_handling
    sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

from backup_management.upload_project import upload_project

def upload_everything(folder):
    try:
        for project_folder in os.listdir(folder):
            upload_res = upload_project(
                os.path.join(folder, project_folder)
            )

            if upload_res["error"]:
                return upload_res

        return {"error": False}
    except Exception:
        return {"error": True, "value": "Failed to upload", "stack": traceback.format_exc()}

if __name__ == "__main__":
    backups_dir = "../data/backups"

    try:
        # Get list of all backup folders in the directory
        backup_folders = [
            os.path.join(backups_dir, folder)
            for folder in os.listdir(backups_dir)
            if os.path.isdir(os.path.join(backups_dir, folder))
        ]

        # Find the latest backup folder based on the timestamp in the folder name
        latest_backup = max(backup_folders, key=os.path.getmtime, default=None)

        if not latest_backup:
            raise FileNotFoundError("No backup available")

        # Call the upload function with the latest backup folder
        result = upload_everything(latest_backup)
        print(result)

    except FileNotFoundError as e:
        print({"error": True, "value": str(e)})
    except Exception:
        print({"error": True, "value": "Failed to upload", "stack": traceback.format_exc()})
