import bpy # type: ignore
import os
import importlib.util

def clear():
    bpy.ops.object.select_all(action='SELECT')  # Select all objects
    bpy.ops.object.delete()  # Delete all selected objects

def load(mod):
    absFp = absolute_filepath("code/" + mod + ".py")

    if not os.path.exists(absFp):
        raise ImportError(f"load_body.py not found at {absFp}")

    # Load the module dynamically
    spec = importlib.util.spec_from_file_location(mod, absFp)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module

def absolute_filepath(fp):
    # Path absolue to blender, not to code
    blend_file_directory = os.path.dirname(bpy.data.filepath)
    return os.path.join(blend_file_directory, fp)