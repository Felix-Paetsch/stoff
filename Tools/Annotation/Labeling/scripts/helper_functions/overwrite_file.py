import shutil
import os

def overwrite_file(source_path, destination_path):
    if not os.path.isfile(destination_path):
        raise FileNotFoundError(f"Seems like you are calling this file from the wrong directory.")
    shutil.copyfile(source_path, destination_path)
