import bpy # type: ignore
import os
import sys

import os
import sys

# Directory where your Python files are located (relative to the Blender file)
code_directory = os.path.join(os.path.dirname(bpy.data.filepath), 'code')

if code_directory not in sys.path:
    sys.path.append(code_directory)

modules_to_remove = []
for module_name, module in sys.modules.items():
    if hasattr(module, '__file__') and module.__file__:
        if code_directory in os.path.abspath(module.__file__):
            modules_to_remove.append(module_name)

for module_name in modules_to_remove:
    del sys.modules[module_name]


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
