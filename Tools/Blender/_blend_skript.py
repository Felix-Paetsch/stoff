import bpy # type: ignore
import os
import sys

# Get the directory of the current Blender file
blend_file_directory = os.path.dirname(bpy.data.filepath)
code_directory = os.path.join(blend_file_directory, "code")
if blend_file_directory not in sys.path:
    sys.path.append(code_directory)
    
# Construct the path to the external script
script_path = os.path.join(code_directory, "main.py")

# Execute the script
with open(script_path) as file:
    exec(file.read())
