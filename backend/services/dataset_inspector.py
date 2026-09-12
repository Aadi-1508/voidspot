from services.data_loader import load_all_datasets
import json


def show(name, value):
    print(f"\n===== {name} =====")
    print(json.dumps(value, indent=2, ensure_ascii=False, default=str))


def main():
    datasets = load_all_datasets()

    nyc = datasets["nyc"]

    corridor = nyc["corridors"][0]
    archetype = nyc["archetypes"][0]
    score = nyc["corridor_archetype_scores"][0]

    show("CORRIDOR DETAILS", {
        "name": corridor.get("name"),
        "audience_scores": corridor.get("audience_scores"),
        "behavior": corridor.get("behavior"),
        "places": corridor.get("places"),
        "demand_sources": corridor.get("demand_sources"),
        "demand_magnets": corridor.get("demand_magnets"),
        "anchor_concentration": corridor.get("anchor_concentration"),
        "occasion_profile": corridor.get("occasion_profile"),
        "cafe_archetype_matches": corridor.get("cafe_archetype_matches"),
        "data_quality": corridor.get("data_quality"),
    })

    show("ARCHETYPE DETAILS", archetype)

    show("CORRIDOR ARCHETYPE SCORE", score)


if __name__ == "__main__":
    main()