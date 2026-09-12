from services.data_loader import load_all_datasets
from services.scoring_service import calculate_opportunities


CATEGORY_PLACE_MAP = {
    "CAFE": "CAFE",
    "RESTAURANT": "RESTAURANT",
    "RETAIL": "RETAIL",
    "GROCERY": "GROCERY_SUPERMARKET",
    "FITNESS": "FITNESS",
    "BEAUTY_WELLNESS": "PERSONAL_CARE",
}


def get_city_data(city: str):
    datasets = load_all_datasets()

    city = city.lower()

    if city == "nyc":
        return datasets["nyc"]

    if city == "dfw":
        return datasets["dfw"]

    raise ValueError("Unsupported city. Use 'nyc' or 'dfw'.")


def find_corridor(data, corridor_id: str):
    for corridor in data.get("corridors", []):
        if corridor.get("corridor_id") == corridor_id:
            return corridor

    return None


def get_category_competition(corridor, category_id: str):
    places = corridor.get("places") or {}
    classes = places.get("classes") or {}

    place_class = CATEGORY_PLACE_MAP.get(
        category_id.upper(),
        category_id.upper()
    )

    category_data = classes.get(place_class) or {}

    return {
        "place_class": place_class,
        "listing_count": category_data.get("listing_count", 0),
        "coordinate_site_count": category_data.get(
            "coordinate_site_count", 0
        ),
        "shared_coordinate_listing_count": category_data.get(
            "shared_coordinate_listing_count", 0
        ),
    }


def get_demand_profile(corridor):
    demand_sources = corridor.get("demand_sources") or {}
    demand_magnets = corridor.get("demand_magnets") or {}

    sorted_sources = sorted(
        demand_sources.items(),
        key=lambda item: item[1],
        reverse=True
    )

    sorted_magnets = sorted(
        demand_magnets.items(),
        key=lambda item: item[1],
        reverse=True
    )

    return {
        "sources": demand_sources,
        "top_sources": [
            {
                "name": name,
                "score": round(score * 100, 2)
            }
            for name, score in sorted_sources[:5]
        ],
        "magnets": demand_magnets,
        "top_magnets": [
            {
                "name": name,
                "score": round(score * 100, 2)
            }
            for name, score in sorted_magnets[:5]
        ],
    }


def get_activity_profile(corridor):
    behavior = corridor.get("behavior") or {}

    daypart_density = behavior.get(
        "daypart_occasion_density"
    ) or {}

    sorted_dayparts = sorted(
        daypart_density.items(),
        key=lambda item: item[1],
        reverse=True
    )

    safety = behavior.get("crime_safety") or {}

    return {
        "timing_alpha": behavior.get("timing_alpha"),
        "neighborhood_momentum": behavior.get(
            "neighborhood_momentum"
        ),
        "daypart_density": daypart_density,
        "top_dayparts": [
            {
                "daypart": name,
                "score": score
            }
            for name, score in sorted_dayparts
        ],
        "safety": safety,
        "path_of_travel_friction": behavior.get(
            "path_of_travel_friction"
        ),
        "transit_car_orientation": behavior.get(
            "transit_car_orientation"
        ),
    }


def get_resilience_profile(corridor):
    behavior = corridor.get("behavior") or {}
    resilience = behavior.get("resilience") or {}

    seasonality = resilience.get(
        "seasonality_amplitude",
        50
    )

    event_dependency = resilience.get(
        "event_dependency",
        50
    )

    development_dependency = resilience.get(
        "development_dependency",
        50
    )

    return {
        "shock_resilience": resilience.get(
            "shock_resilience",
            50
        ),
        "seasonality_amplitude": seasonality,
        "event_dependency": event_dependency,
        "development_dependency": development_dependency,
        "resilience_interpretation": {
            "seasonality_risk": round(seasonality, 2),
            "event_dependency_risk": round(
                event_dependency,
                2
            ),
            "development_dependency_risk": round(
                development_dependency,
                2
            ),
        },
    }


def get_best_archetype(corridor, category_id: str):
    category_id = category_id.upper()

    if category_id == "CAFE":
        matches = corridor.get(
            "cafe_archetype_matches"
        ) or []

        valid_matches = [
            item
            for item in matches
            if item.get("score") is not None
        ]

        if valid_matches:
            best = max(
                valid_matches,
                key=lambda item: item.get(
                    "score",
                    0
                )
            )

            return {
                "archetype_id": best.get(
                    "archetype_id"
                ),
                "name": best.get("name"),
                "score": round(
                    best.get("score", 0) * 100,
                    2
                ),
                "decision_track": best.get(
                    "decision_track"
                ),
                "location_check": best.get(
                    "location_check"
                ),
            }

    return None


def analyze_corridor(
    city: str,
    corridor_id: str,
    category_id: str
):
    data = get_city_data(city)

    corridor = find_corridor(
        data,
        corridor_id
    )

    if corridor is None:
        raise ValueError(
            f"Corridor '{corridor_id}' not found."
        )

    category_id = category_id.upper()

    opportunities = calculate_opportunities(
        city,
        category_id
    )

    result = next(
        (
            item
            for item in opportunities
            if item["corridor_id"] == corridor_id
        ),
        None
    )

    if result is None:
        raise ValueError(
            f"No analysis available for "
            f"category '{category_id}' in this corridor."
        )

    competition = get_category_competition(
        corridor,
        category_id
    )

    demand = get_demand_profile(
        corridor
    )

    activity = get_activity_profile(
        corridor
    )

    resilience = get_resilience_profile(
        corridor
    )

    best_archetype = get_best_archetype(
        corridor,
        category_id
    )

    behavior = corridor.get("behavior") or {}
    whitespace = behavior.get(
        "whitespace_quality"
    ) or {}

    anchor = corridor.get(
        "anchor_concentration"
    ) or {}

    return {
        "corridor": {
            "id": corridor.get("corridor_id"),
            "name": corridor.get("name"),
            "district": corridor.get("district"),
            "borough": corridor.get("borough"),
            "character": corridor.get("character"),
            "form": corridor.get("form"),
            "object_form": corridor.get(
                "object_form"
            ),
        },

        "category": category_id,

        "voidspot": {
            "score": result["voidspot_score"],
            "signals": result["signals"],
        },

        "competition": competition,

        "demand": demand,

        "activity": activity,

        "whitespace": {
            "all_categories": whitespace,
            "selected_category": whitespace.get(
                category_id.lower()
            ),
        },

        "resilience": resilience,

        "anchors": {
            "concentration_proxy": anchor.get(
                "anchor_concentration_proxy"
            ),
            "top_anchor_share": anchor.get(
                "top_anchor_share"
            ),
            "top_three_anchor_share": anchor.get(
                "top_three_anchor_share"
            ),
            "hhi": anchor.get("hhi"),
            "effective_anchor_count": anchor.get(
                "effective_anchor_count"
            ),
        },

        "best_archetype": best_archetype,

        "magnet_diversity": corridor.get(
            "magnet_diversity"
        ),

        "data_quality": corridor.get(
            "data_quality"
        ),
    }