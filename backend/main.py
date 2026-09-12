from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from services.data_loader import load_all_datasets
from services.corridor_service import get_corridors, get_categories
from services.scoring_service import calculate_opportunities
from services.recommendation_service import get_recommendation, compare_corridors
from services.analysis_service import analyze_corridor
from services.twin_service import find_cross_metro_twin
from services.map_service import get_map_corridors, get_h3_grid
from services.ai_tools import (
    tool_find_opportunities,
    tool_get_recommendation,
    tool_analyze_corridor,
    tool_compare_corridors,
    tool_find_cross_metro_twin,
    get_available_tools,
)
from services.agent_service import run_agent_chat, get_agent_status

app = FastAPI(
    title="VoidSpot API",
    description="Retail Gap & Opportunity Intelligence Engine",
    version="1.0.0",
)

# Allow the frontend to communicate with the FastAPI backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "name": "VoidSpot",
        "message": "Retail Gap & Opportunity Engine is running!",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/data-status")
def data_status():
    datasets = load_all_datasets()

    return {
        "nyc_loaded": datasets["nyc"] is not None,
        "nyc_ownership_loaded": datasets["nyc_ownership"] is not None,
        "dfw_loaded": datasets["dfw"] is not None,
    }


@app.get("/corridors/{city}")
def corridors(city: str):
    try:
        return {
            "city": city,
            "corridors": get_corridors(city),
        }
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/categories/{city}")
def categories(city: str):
    try:
        return {
            "city": city,
            "categories": get_categories(city),
        }
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/opportunities/{city}/{category_id}")
def opportunities(city: str, category_id: str):
    try:
        results = calculate_opportunities(
            city,
            category_id.upper(),
        )

        return {
            "city": city,
            "category": category_id.upper(),
            "count": len(results),
            "opportunities": results,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/recommend/{city}/{category_id}")
def recommend(city: str, category_id: str):
    try:
        result = get_recommendation(
            city,
            category_id,
        )

        if result is None:
            raise HTTPException(
                status_code=404,
                detail="No opportunity found for this category.",
            )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/compare/{city}/{category_id}")
def compare(
    city: str,
    category_id: str,
    corridor_ids: str,
):
    try:
        ids = [
            corridor_id.strip()
            for corridor_id in corridor_ids.split(",")
            if corridor_id.strip()
        ]

        if len(ids) < 2:
            raise HTTPException(
                status_code=400,
                detail="Provide at least 2 corridor IDs.",
            )

        if len(ids) > 3:
            raise HTTPException(
                status_code=400,
                detail="Compare up to 3 corridors.",
            )

        return compare_corridors(
            city,
            category_id,
            ids,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/analysis/{city}/{category_id}/{corridor_id}")
def corridor_analysis(
    city: str,
    category_id: str,
    corridor_id: str,
):
    try:
        return analyze_corridor(
            city,
            corridor_id,
            category_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/ai-tools")
def ai_tools():
    return {
        "name": "VoidSpot AI Tools",
        "tools": get_available_tools(),
    }


@app.get("/ai-tools/opportunities/{city}/{category_id}")
def ai_tool_opportunities(
    city: str,
    category_id: str,
    limit: int = 5,
):
    try:
        return tool_find_opportunities(
            city,
            category_id,
            limit,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/ai-tools/recommend/{city}/{category_id}")
def ai_tool_recommend(
    city: str,
    category_id: str,
):
    try:
        return tool_get_recommendation(
            city,
            category_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/ai-tools/analyze/{city}/{category_id}/{corridor_id}")
def ai_tool_analyze(
    city: str,
    category_id: str,
    corridor_id: str,
):
    try:
        return tool_analyze_corridor(
            city,
            category_id,
            corridor_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/ai-tools/compare/{city}/{category_id}")
def ai_tool_compare(
    city: str,
    category_id: str,
    corridor_ids: str,
):
    try:
        ids = [
            corridor_id.strip()
            for corridor_id in corridor_ids.split(",")
            if corridor_id.strip()
        ]

        if len(ids) < 2:
            raise HTTPException(
                status_code=400,
                detail="Provide at least 2 corridor IDs.",
            )

        if len(ids) > 3:
            raise HTTPException(
                status_code=400,
                detail="Compare up to 3 corridors.",
            )

        return tool_compare_corridors(
            city,
            category_id,
            ids,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


class AgentChatRequest(BaseModel):
    message: str


class AgentChatResponse(BaseModel):
    message: str
    tool_used: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None


@app.get("/agent/status")
def agent_status():
    return get_agent_status()


@app.post("/agent/chat", response_model=AgentChatResponse)
def agent_chat(payload: AgentChatRequest):
    try:
        return run_agent_chat(payload.message)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@app.get("/twin/{city}/{category_id}/{corridor_id}")
def cross_metro_twin(city: str, category_id: str, corridor_id: str):
    try:
        return find_cross_metro_twin(city, category_id, corridor_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.get("/ai-tools/twin/{city}/{category_id}/{corridor_id}")
def ai_tool_twin(city: str, category_id: str, corridor_id: str):
    try:
        return tool_find_cross_metro_twin(city, category_id, corridor_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.get("/map/corridors/{city}/{category_id}")
def map_corridors(city: str, category_id: str):
    try:
        return get_map_corridors(city, category_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@app.get("/map/h3/{city}/{category_id}")
def map_h3(city: str, category_id: str):
    try:
        return get_h3_grid(city, category_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
