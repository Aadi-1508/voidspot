from services.scoring_service import calculate_opportunities
from services.recommendation_service import get_recommendation
from services.analysis_service import analyze_corridor
from services.twin_service import find_cross_metro_twin


def tool_find_cross_metro_twin(
    city: str,
    category_id: str,
    corridor_id: str,
):
    """
    Find the most similar commercial corridor in the other metro (NYC <-> DFW).
    """
    return find_cross_metro_twin(
        city=city,
        category_id=category_id.upper(),
        corridor_id=corridor_id,
    )



def tool_find_opportunities(
    city: str,
    category_id: str,
    limit: int = 5,
):
    """
    Find the best business opportunities
    for a category in a city.
    """

    results = calculate_opportunities(
        city,
        category_id.upper(),
    )

    return {
        "city": city,
        "category": category_id.upper(),
        "results": results[:limit],
    }


def tool_get_recommendation(
    city: str,
    category_id: str,
):
    """
    Get the strongest overall recommendation.
    """

    result = get_recommendation(
        city,
        category_id.upper(),
    )

    if result is None:
        return {
            "found": False,
            "message": (
                "No opportunity found for "
                "this category."
            ),
        }

    return {
        "found": True,
        **result,
    }


def tool_analyze_corridor(
    city: str,
    category_id: str,
    corridor_id: str,
):
    """
    Get detailed intelligence for one corridor.
    """

    return analyze_corridor(
        city,
        corridor_id,
        category_id.upper(),
    )


def tool_compare_corridors(
    city: str,
    category_id: str,
    corridor_ids: list[str],
):
    """
    Compare multiple corridors for a category.
    """

    opportunities = calculate_opportunities(
        city,
        category_id.upper(),
    )

    selected = [
        item
        for item in opportunities
        if item["corridor_id"] in corridor_ids
    ]

    selected.sort(
        key=lambda item: item["voidspot_score"],
        reverse=True,
    )

    return {
        "city": city,
        "category": category_id.upper(),
        "compared_count": len(selected),
        "corridors": selected,
        "winner": (
            selected[0]
            if selected
            else None
        ),
    }


def get_available_tools():
    """
    Return the tools available to the AI agent.
    """

    return [
        {
            "name": "find_opportunities",
            "description": (
                "Find the highest opportunity "
                "corridors for a business category."
            ),
            "parameters": {
                "city": "nyc or dfw",
                "category_id": (
                    "business category such as "
                    "CAFE or RESTAURANT"
                ),
                "limit": (
                    "number of results to return"
                ),
            },
        },
        {
            "name": "get_recommendation",
            "description": (
                "Get the strongest business "
                "location recommendation."
            ),
            "parameters": {
                "city": "nyc or dfw",
                "category_id": "business category",
            },
        },
        {
            "name": "analyze_corridor",
            "description": (
                "Get detailed demand, whitespace, "
                "competition, activity and resilience "
                "analysis for a corridor."
            ),
            "parameters": {
                "city": "nyc or dfw",
                "category_id": "business category",
                "corridor_id": "corridor identifier",
            },
        },
        {
            "name": "compare_corridors",
            "description": (
                "Compare two or three corridors "
                "for a business category."
            ),
            "parameters": {
                "city": "nyc or dfw",
                "category_id": "business category",
                "corridor_ids": (
                    "list of corridor identifiers"
                ),
            },
        },
        {
            "name": "find_cross_metro_twin",
            "description": (
                "Find the most similar commercial corridor in the opposite metro "
                "(NYC <-> DFW) with VoidSpot derived similarity."
            ),
            "parameters": {
                "city": "nyc or dfw",
                "category_id": "business category",
                "corridor_id": "corridor identifier or name",
            },
        },
    ]