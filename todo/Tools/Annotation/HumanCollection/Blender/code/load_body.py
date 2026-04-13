# load_body.py
import bpy, os

def load_body(filepath):
    full_path = os.path.abspath(filepath)
    bpy.ops.import_scene.fbx(filepath=full_path)
    objs = bpy.context.selected_objects
    return objs[0] if objs else None