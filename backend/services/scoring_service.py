from services.data_loader import load_all_datasets


CATEGORY_PLACE_MAP = {
    "CAFE": "CAFE",
    "RESTAURANT": "RESTAURANT",
    "RETAIL": "RETAIL",
    "GROCERY": "GROCERY_SUPERMARKET",
    "FITNESS": "FITNESS",
    "BEAUTY_WELLNESS": "PERSONAL_CARE",
}


DERIVED_CATEGORIES = {
    "RETAIL",
    "GROCERY",
    "FITNESS",
    "BEAUTY_WELLNESS",
}


def clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))


def normalize(value, minimum, maximum):
    if maximum == minimum:
        return 0.5

    return clamp(
        (value - minimum) / (maximum - minimum)
    )


def get_city_data(city):
    datasets = load_all_datasets()

    if city.lower() == "nyc":
        return datasets["nyc"]

    if city.lower() == "dfw":
        return datasets["dfw"]

    raise ValueError("Unsupported city. Use 'nyc' or 'dfw'.")


def get_category_scores(data, category_id):
    return [
        item
        for item in data.get("corridor_archetype_scores", [])
        if item.get("category_id") == category_id
    ]


def get_average_audience_score(corridor):
    audience_scores = corridor.get("audience_scores") or {}

    if not audience_scores:
        return 0.5

    values = [
        value
        for value in audience_scores.values()
        if isinstance(value, (int, float))
    ]

    if not values:
        return 0.5

    # Audience scores in the dataset are on a 1–7 scale.
    return clamp(
        sum(values) / (len(values) * 7)
    )


def get_derived_category_fit(corridor, category_id):
    behavior = corridor.get("behavior") or {}
    whitespace = behavior.get("whitespace_quality") or {}

    category_key = category_id.lower()

    whitespace_value = whitespace.get(category_key)

    if whitespace_value is None:
        whitespace_value = 50

    whitespace_score = clamp(
        float(whitespace_value) / 100
    )

    audience_score = get_average_audience_score(corridor)

    return (
        whitespace_score * 0.60
        + audience_score * 0.40
    )


def calculate_opportunities(city, category_id):
    data = get_city_data(city)

    category_id = category_id.upper()

    category_scores = get_category_scores(
        data,
        category_id,
    )

    corridors = {
        c["corridor_id"]: c
        for c in data.get("corridors", [])
    }

    results = []

    for corridor_id, corridor in corridors.items():

        # ---------------------------------------------------------
        # 1. Native dataset category score
        # ---------------------------------------------------------
        matching_scores = [
            item
            for item in category_scores
            if item.get("corridor_id") == corridor_id
        ]

        valid_scores = [
            item.get("score", 0)
            for item in matching_scores
            if item.get("score") is not None
        ]

        category_fit = max(
            valid_scores,
            default=None,
        )

        # ---------------------------------------------------------
        # 2. Derived category fallback
        # ---------------------------------------------------------
        if category_fit is None:

            if category_id not in DERIVED_CATEGORIES:
                continue

            category_fit = get_derived_category_fit(
                corridor,
                category_id,
            )

        # ---------------------------------------------------------
        # 3. Whitespace
        # ---------------------------------------------------------
        behavior = corridor.get("behavior") or {}

        whitespace = (
            behavior.get("whitespace_quality")
            or {}
        )

        whitespace_value = whitespace.get(
            category_id.lower()
        )

        if whitespace_value is None:
            whitespace_value = 50

        whitespace_score = clamp(
            float(whitespace_value) / 100
        )

        # ---------------------------------------------------------
        # 4. Demand
        # ---------------------------------------------------------
        demand_score = get_average_audience_score(
            corridor
        )

        # ---------------------------------------------------------
        # 5. Resilience
        # ---------------------------------------------------------
        resilience = (
            behavior.get("resilience")
            or {}
        )

        shock_resilience = (
            resilience.get(
                "shock_resilience",
                50,
            ) / 100
        )

        seasonality = resilience.get(
            "seasonality_amplitude",
            50,
        )

        seasonality_score = (
            1 - clamp(
                float(seasonality) / 100
            )
        )

        event_dependency = resilience.get(
            "event_dependency",
            50,
        )

        event_score = (
            1 - clamp(
                float(event_dependency) / 100
            )
        )

        resilience_score = (
            shock_resilience
            + seasonality_score
            + event_score
        ) / 3

        # ---------------------------------------------------------
        # 6. Final VoidSpot score
        # ---------------------------------------------------------
        final_score = (
            category_fit * 0.45
            + whitespace_score * 0.25
            + demand_score * 0.20
            + resilience_score * 0.10
        ) * 100

        results.append(
            {
                "corridor_id": corridor_id,
                "corridor_name": corridor.get("name"),
                "district": corridor.get("district"),
                "category_id": category_id,
                "score_source": (
                    "dataset"
                    if matching_scores
                    else "voidspot_derived"
                ),
                "voidspot_score": round(
                    final_score,
                    2,
                ),
                "signals": {
                    "category_fit": round(
                        category_fit * 100,
                        2,
                    ),
                    "whitespace": round(
                        whitespace_score * 100,
                        2,
                    ),
                    "demand": round(
                        demand_score * 100,
                        2,
                    ),
                    "resilience": round(
                        resilience_score * 100,
                        2,
                    ),
                },
            }
        )

    return sorted(
        results,
        key=lambda item: item["voidspot_score"],
        reverse=True,
    )