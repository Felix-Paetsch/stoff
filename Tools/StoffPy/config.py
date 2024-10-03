import json
import os

_config = None

def config(file=None):
    global _config
    if _config is None:
        if file is None:
            file = os.path.join(os.path.dirname(__file__), 'config.json')
        try:
            with open(file, 'r') as f:
                _config = json.load(f)
        except Exception as e:
            print(f"Error loading config: {e}")
            _config = None
    return _config