import bpy  # type: ignore
import json
import os

from tools import clear, absolute_filepath

clear()

# Load the JSON file
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

# Position the cloth object above the sphere
cloth_obj.location = (-2.0, -2.0, 4.0)  # Move cloth 2 units above the origin

# Create a UV Sphere below the cloth
bpy.ops.mesh.primitive_uv_sphere_add(radius=cloth_width / 2, location=(0, 0, 1.0))
sphere_obj = bpy.context.active_object
sphere_obj.name = "ClothCollisionSphere"

# Create a plane to act as the ground
bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 0))
ground_obj = bpy.context.active_object
ground_obj.name = "GroundPlane"

# Apply collision physics to the ground
bpy.ops.object.modifier_add(type='COLLISION')

# Apply cloth physics to the cloth object
bpy.ops.object.select_all(action='DESELECT')
cloth_obj.select_set(True)
bpy.context.view_layer.objects.active = cloth_obj
bpy.ops.object.modifier_add(type='CLOTH')

# Set up cloth physics properties (adjust as needed)
cloth_modifier = cloth_obj.modifiers["Cloth"]
cloth_modifier.settings.quality = 5  # Set simulation quality
cloth_modifier.settings.mass = 0.3  # Adjust mass
cloth_modifier.settings.air_damping = 5  # Adjust air damping

# Set up collision for the sphere
sphere_obj.select_set(True)
bpy.context.view_layer.objects.active = sphere_obj
bpy.ops.object.modifier_add(type='COLLISION')

# Apply collision physics to the ground
ground_obj.select_set(True)
bpy.context.view_layer.objects.active = ground_obj
bpy.ops.object.modifier_add(type='COLLISION')

# Set up the cloth object to be active
bpy.context.view_layer.objects.active = cloth_obj
cloth_obj.select_set(True)

# Set up the frame range and run the simulation
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 250

print("Cloth, sphere, and ground set up successfully with subdivided cloth.")
