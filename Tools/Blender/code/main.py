import bpy  # type: ignore
import mathutils  # type: ignore
import json
import os

from tools import clear, load, absolute_filepath

# Clear the scene
clear()

# Dynamically load the 'load_body' module
load_body = load("load_body")

# Load the human body object
human_obj = load_body.load_body()

# Calculate the bounding box of the human object
if human_obj:
    bounding_box = human_obj.bound_box
    bb_world_coords = [human_obj.matrix_world @ mathutils.Vector(corner) for corner in bounding_box]
    
    min_z = min([v[2] for v in bb_world_coords])
    max_z = max([v[2] for v in bb_world_coords])
    
    # Calculate the center above the human's bounding box
    human_center_x = (min([v[0] for v in bb_world_coords]) + max([v[0] for v in bb_world_coords])) / 2
    human_center_y = (min([v[1] for v in bb_world_coords]) + max([v[1] for v in bb_world_coords])) / 2

    print(f"Bounding Box Min: ({min_z})")
    print(f"Bounding Box Max: ({max_z})")
    print(f"Dimensions: (Height: {max_z - min_z})")

else:
    print("Failed to load the human body object.")

# Load the JSON file for the cloth
with open(absolute_filepath("./assets/test.json"), "r") as f:
    data = json.load(f)

# Extract mesh data
vertices = data['mesh']['vertices']
faces = data['mesh']['faces']

# Create a new mesh and object for the cloth
cloth_mesh = bpy.data.meshes.new(name="ClothMesh")
cloth_obj = bpy.data.objects.new(name="ClothObject", object_data=cloth_mesh)

# Link the cloth object to the scene
bpy.context.collection.objects.link(cloth_obj)

# Create the cloth mesh from the vertices and faces
cloth_mesh.from_pydata(vertices, [], faces)
cloth_mesh.update()

# Subdivide the cloth mesh to increase the number of triangles
bpy.context.view_layer.objects.active = cloth_obj
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.subdivide(number_cuts=5)  # Number of cuts determines the level of subdivision
bpy.ops.object.mode_set(mode='OBJECT')

# Calculate the cloth size
cloth_width = max(v[0] for v in vertices) - min(v[0] for v in vertices)
cloth_height = max(v[1] for v in vertices) - min(v[1] for v in vertices)

# Position the cloth object above the human model
cloth_obj.location = (human_center_x - 200, human_center_y - 200, max_z + 10)  # 0.5 units above the human's highest point

# Apply cloth physics to the cloth object
bpy.ops.object.select_all(action='DESELECT')
cloth_obj.select_set(True)
bpy.context.view_layer.objects.active = cloth_obj
bpy.ops.object.modifier_add(type='CLOTH')

# Set up cloth physics properties (adjust as needed)
cloth_modifier = cloth_obj.modifiers["Cloth"]
cloth_modifier.settings.quality = 5  # Set simulation quality
cloth_modifier.settings.mass = 5  # Adjust mass
cloth_modifier.settings.air_damping = 5  # Adjust air damping

# Apply collision physics to the human object
human_obj.select_set(True)
bpy.context.view_layer.objects.active = human_obj
bpy.ops.object.modifier_add(type='COLLISION')

# Set up the frame range and run the simulation
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 2500

print("Human body and cloth set up successfully with cloth simulation ready to run.")
