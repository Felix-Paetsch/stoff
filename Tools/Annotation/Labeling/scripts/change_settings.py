import sys
from helper_functions.replace_json_files import replace_json_files
import json

# Load valid keys from toggle_mode_config.json
with open("toggle_mode_config.json") as f:
    valid_keys = list(json.load(f).keys())

# Check if the argument is provided and valid
if len(sys.argv) < 2:
    raise ValueError("Error: Missing required argument: Project location.")

input_arg = sys.argv[1]

if input_arg not in valid_keys:
    raise ValueError(f"Error: '{input_arg}' is not a valid project location. Valid keys are: {', '.join(valid_keys)}.")

# Pass input argument to replace_json_files
replace_json_files("toggle_mode_config.json", input_arg)
