import sys
from pathlib import Path

# Add backend folder to Python path
BACKEND_DIR = Path(__file__).resolve().parent.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


from mcp.server import MCPServer

from services.ai_tools import (
    tool_find_opportunities,
    tool_get_recommendation,
    tool_analyze_corridor,
    tool_compare_corridors,
    tool_find_cross_metro_twin,
)


mcp = MCPServer(
    "VoidSpot Intelligence",
    version="1.0.0",
)


@mcp.tool()
def find_opportunities(
    city: str,
    category_id: str,
    limit: int = 5,
) -> dict:
    """Find the best business opportunities for a category in a city."""
    return tool_find_opportunities(
        city=city,
        category_id=category_id,
        limit=limit,
    )


@mcp.tool()
def get_recommendation(
    city: str,
    category_id: str,
) -> dict:
    """Get the strongest overall business location recommendation."""
    return tool_get_recommendation(
        city=city,
        category_id=category_id,
    )


@mcp.tool()
def analyze_corridor(
    city: str,
    category_id: str,
    corridor_id: str,
) -> dict:
    """Analyze demand, competition, whitespace, activity and resilience."""
    return tool_analyze_corridor(
        city=city,
        category_id=category_id,
        corridor_id=corridor_id,
    )


@mcp.tool()
def compare_corridors(
    city: str,
    category_id: str,
    corridor_ids: list[str],
) -> dict:
    """Compare two or three corridors for a business category."""
    return tool_compare_corridors(
        city=city,
        category_id=category_id,
        corridor_ids=corridor_ids,
    )


@mcp.tool()
def find_cross_metro_twin(
    city: str,
    category_id: str,
    corridor_id: str,
) -> dict:
    """Find the most similar commercial corridor in the opposite metro (NYC <-> DFW)."""
    return tool_find_cross_metro_twin(
        city=city,
        category_id=category_id,
        corridor_id=corridor_id,
    )


if __name__ == "__main__":
    mcp.run()