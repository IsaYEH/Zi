
import json, os
from importlib.resources import files

def load_json(package_path:str):
    return json.loads(files("ziwei_core").joinpath(package_path).read_text(encoding="utf-8"))

def try_load_anchor(external_data_dir:str):
    """
    Look for data/ziwei_anchor.json under external_data_dir.
    Return a dict or None.
    """
    if not external_data_dir:
        return None
    path = os.path.join(external_data_dir, "data", "ziwei_anchor.json")
    if os.path.isfile(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None
