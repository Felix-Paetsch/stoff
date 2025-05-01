import json
from requests.auth import HTTPBasicAuth

CONF = None

def init(config_file_path):
    global CONF
    with open(config_file_path, encoding='utf-8') as file:
        CONF = json.load(file)

def conf():
    global CONF
    if CONF is None:
        init("../data/config.json")
        # raise Exception("Config is not initialized!")

    return CONF

def base_url():
    global CONF
    if CONF is None:
        init("../data/config.json")
        # raise Exception("Config is not initialized!")

    return CONF["website_path"] 

def auth():
    auth_user = CONF.get("auth", "Auth")
    auth_password = CONF.get("auth_pw", "BrombeereNotFound")
    return HTTPBasicAuth(auth_user, auth_password)

def no_err(obj):
    if obj["error"]:
        print("====== API Error ======")
        if "stack" in obj:
            print(obj["stack"])
        raise Exception(obj["value"])

    return obj