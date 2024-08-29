import bpy # type: ignore
import json
import os

from test import hi

hi()

# Clear all objects in the current scene
bpy.ops.object.select_all(action='SELECT')  # Select all objects
bpy.ops.object.delete()  # Delete all selected objects

# Get the directory of the current Blender file
blend_file_directory = os.path.dirname(bpy.data.filepath)

# Define the relative path to the JSON file
relative_path = "./assets/test.json"

# Construct the absolute path to the JSON file
json_file_path = os.path.join(blend_file_directory, relative_path)

# Load the JSON file
with open(json_file_path, "r") as f:
    data = json.load(f)

# Extract mesh data
vertices = data['mesh']['vertices']
faces = data['mesh']['faces']

# Create a new mesh and object
mesh = bpy.data.meshes.new(name="CustomMesh")
obj = bpy.data.objects.new(name="CustomObject", object_data=mesh)

# Link the object to the scene
bpy.context.collection.objects.link(obj)

# Create the mesh from the vertices and faces
mesh.from_pydata(vertices, [], faces)
mesh.update()

# Set the object's position, rotation, and scale
obj.location = data['position']
obj.rotation_euler = data['rotation']
obj.scale = data['scale']

# Optional: Select the object and make it active
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

print("Scene cleared and mesh loaded successfully from:", json_file_path)
