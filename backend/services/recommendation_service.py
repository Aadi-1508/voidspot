from services.scoring_service import calculate_opportunities
from services.data_loader import load_all_datasets


def get_city_data(city: str):
    datasets = load_all_datasets()

    city = city.lower()

    if city == "nyc":
        return datasets["nyc"]

    if city == "dfw":
        return datasets["dfw"]

    raise ValueError("Unsupported city. Use 'nyc' or 'dfw'.")


def get_corridor(city: str, corridor_id: str):
    data = get_city_data(city)

    for corridor in data.get("corridors", []):
        if corridor.get("corridor_id") == corridor_id:
            return corridor

    return None


def build_explanation(result, corridor):
    signals = result["signals"]

    reasons = []

    if signals["category_fit"] >= 60:
        reasons.append("strong category fit")
    elif signals["category_fit"] >= 40:
        reasons.append("moderate category fit")

    if signals["whitespace"] >= 60:
        reasons.append("high whitespace opportunity")

    if signals["demand"] >= 60:
        reasons.append("strong consumer demand")

    if signals["resilience"] >= 60:
        reasons.append("good resilience")

    if not reasons:
        reasons.append(
            "a balanced combination of demand and market signals"
        )

    if len(reasons) == 1:
        explanation = (
            f"{result['corridor_name']} is a promising location "
            f"because of {reasons[0]}."
        )
    else:
        explanation = (
            f"{result['corridor_name']} is a promising location because it "
            f"shows {', '.join(reasons[:-1])}, and {reasons[-1]}."
        )

    return explanation


def get_recommendation(city: str, category_id: str):
    opportunities = calculate_opportunities(
        city,
        category_id.upper()
    )

    if not opportunities:
        return None

    top = opportunities[0]

    corridor = get_corridor(
        city,
        top["corridor_id"]
    )

    explanation = build_explanation(
        top,
        corridor
    )

    return {
        "recommendation": top,
        "why": explanation,
        "top_3": opportunities[:3]
    }


def compare_corridors(
    city: str,
    category_id: str,
    corridor_ids: list[str]
):
    opportunities = calculate_opportunities(
        city,
        category_id.upper()
    )

    selected = [
        item
        for item in opportunities
        if item["corridor_id"] in corridor_ids
    ]

    selected.sort(
        key=lambda item: item["voidspot_score"],
        reverse=True
    )

    return {
        "city": city,
        "category": category_id.upper(),
        "corridors": selected,
        "winner": selected[0] if selected else None
    }