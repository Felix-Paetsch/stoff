import bpy # type: ignore
import os

def clear():
    bpy.ops.object.select_all(action='SELECT')  # Select all objects
    bpy.ops.object.delete()  # Delete all selected objects

def absolute_filepath(fp):
    # Path absolue to blender, not to code
    blend_file_directory = os.path.dirname(bpy.data.filepath)
    return os.path.join(blend_file_directory, fp)