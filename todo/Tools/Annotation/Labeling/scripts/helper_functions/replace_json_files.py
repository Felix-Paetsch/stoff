import json
import shutil

def replace_json_files(config_file, input_arg):
    with open(config_file, 'r') as f:
        config = json.load(f)

    if input_arg not in config:
        raise ValueError(f"'{input_arg}' is not a valid key in the configuration file.")

    for item in config[input_arg]:
        file_path = item.get('file')
        
        if 'replacement' in item:
            replacement_path = item['replacement']
            print(f"Replacing {file_path} with {replacement_path}")
            shutil.copy(replacement_path, file_path)
        elif 'data' in item:
            data = item['data']
            print(f"Writing data to {file_path}")
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=4)
        else:
            print(f"Invalid item format in config: {item}")
