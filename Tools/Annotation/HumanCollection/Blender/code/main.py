import os
import bpy, os, time

from tools import clear
from load_body import load_body

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../Data/Models"))
models = sorted(f for f in os.listdir(models_dir) if f.lower().endswith('.fbx'))

for model in models:
    clear()
    model_path = os.path.join(models_dir, model)
    load_body(model_path)
    print("Displayed:", model)
    time.sleep(2)

print("Finished cycling models.")
