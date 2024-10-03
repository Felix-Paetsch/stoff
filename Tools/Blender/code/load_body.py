import bpy  # type: ignore
import mathutils # type: ignore

from tools import absolute_filepath

def load_body(filepath = "./assets/bodies/human1.fbx"):
    model_path = absolute_filepath(filepath)
    bpy.ops.import_scene.fbx(filepath=model_path)

    imported_objects = bpy.context.selected_objects

    human_obj = None
    for obj in imported_objects:
        if obj.type == 'MESH': 
            human_obj = obj
            human_obj.location = (0, 0, 0)
            human_obj.scale = (1, 1, 1)
            break  # Assuming the first mesh object is the human body

    if human_obj:
        # Calculate the bounding box in world coordinates
        bounding_box = human_obj.bound_box
        bb_world_coords = [human_obj.matrix_world @ mathutils.Vector(corner) for corner in bounding_box]
        
        # Find the minimum Z value (feet position)
        min_z = min([v[2] for v in bb_world_coords])
        
        # Adjust the location to place the feet at Z = 0
        human_obj.location.z -= min_z

    # Hide bones but keep the armature
    for obj in imported_objects:
        if obj.type == 'ARMATURE':
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.mode_set(mode='POSE')
            bpy.ops.pose.select_all(action='SELECT')
            bpy.ops.pose.hide()
            bpy.ops.object.mode_set(mode='OBJECT') 

    return human_obj
