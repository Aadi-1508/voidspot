from services.data_loader import load_all_datasets


DERIVED_CATEGORIES = [
    {
        "category_id": "RETAIL",
        "name": "Retail",
        "decision_track": "OPEN_MARKET_SITE",
    },
    {
        "category_id": "GROCERY",
        "name": "Grocery",
        "decision_track": "OPEN_MARKET_SITE",
    },
    {
        "category_id": "FITNESS",
        "name": "Fitness",
        "decision_track": "OPEN_MARKET_SITE",
    },
    {
        "category_id": "BEAUTY_WELLNESS",
        "name": "Beauty & Wellness",
        "decision_track": "OPEN_MARKET_SITE",
    },
]


def get_city_data(city: str):
    datasets = load_all_datasets()

    city = city.lower()

    if city == "nyc":
        return datasets["nyc"]

    if city == "dfw":
        return datasets["dfw"]

    raise ValueError("Unsupported city. Use 'nyc' or 'dfw'.")


def get_corridors(city: str):
    data = get_city_data(city)

    return [
        {
            "corridor_id": corridor.get("corridor_id"),
            "name": corridor.get("name"),
            "district": corridor.get("district"),
            "borough": corridor.get("borough"),
            "level": corridor.get("level"),
            "form": corridor.get("form"),
            "object_form": corridor.get("object_form"),
            "character": corridor.get("character"),
        }
        for corridor in data.get("corridors", [])
    ]


def get_categories(city: str):
    data = get_city_data(city)

    categories = {}

    # Dataset-native categories
    for archetype in data.get("archetypes", []):
        category_id = archetype.get("category_id")

        if category_id not in categories:
            categories[category_id] = {
                "category_id": category_id,
                "name": category_id.replace("_", " ").title(),
                "source": "dataset",
                "archetypes": [],
            }

        categories[category_id]["archetypes"].append(
            {
                "archetype_id": archetype.get("archetype_id"),
                "name": archetype.get("name"),
                "decision_track": archetype.get("decision_track"),
            }
        )

    # Add derived categories
    for category in DERIVED_CATEGORIES:
        category_id = category["category_id"]

        if category_id not in categories:
            categories[category_id] = {
                "category_id": category_id,
                "name": category["name"],
                "source": "voidspot_derived",
                "archetypes": [],
            }

    return list(categories.values())