import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def load_json(filename: str):
    file_path = DATA_DIR / filename

    if not file_path.exists():
        raise FileNotFoundError(f"Dataset not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def load_all_datasets():
    return {
        "nyc": load_json("NYC_CORRIDORS.full.json"),
        "nyc_ownership": load_json("NYC_CORRIDOR_H3_10_OWNERSHIP.json"),
        "dfw": load_json("DALLAS_FORT_WORTH_CORRIDORS.full.json"),
    }