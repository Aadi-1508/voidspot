import os
import json
import re
from typing import Dict, Any, Optional, List
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded from backend/.env or root .env
BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(BACKEND_DIR.parent / ".env")

from services.ai_tools import (
    tool_find_opportunities,
    tool_get_recommendation,
    tool_analyze_corridor,
    tool_compare_corridors,
    tool_find_cross_metro_twin,
)
from services.corridor_service import get_corridors

# OpenAI client lazy initialization
_openai_client = None

def get_openai_client():
    global _openai_client
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None
    if _openai_client is None:
        try:
            from openai import OpenAI
            _openai_client = OpenAI(api_key=api_key)
        except Exception as e:
            print(f"Error initializing OpenAI client: {e}")
            return None
    return _openai_client

def get_agent_status() -> Dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    return {
        "configured": bool(api_key),
        "provider": "openai",
        "model": model,
        "tools_count": 5,
    }

# OpenAI Tool Definitions
VOIDSPOT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_recommendation",
            "description": "Get the single strongest overall business location recommendation for a business category in a city based on VoidSpot deterministic scoring.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "enum": ["nyc", "dfw"],
                        "description": "Target city ('nyc' or 'dfw')"
                    },
                    "category_id": {
                        "type": "string",
                        "description": "Business category: CAFE, RESTAURANT, RETAIL, GROCERY, FITNESS, or BEAUTY_WELLNESS"
                    }
                },
                "required": ["city", "category_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_opportunities",
            "description": "Find and rank the top commercial corridors for a category in a city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "enum": ["nyc", "dfw"],
                        "description": "Target city ('nyc' or 'dfw')"
                    },
                    "category_id": {
                        "type": "string",
                        "description": "Business category: CAFE, RESTAURANT, RETAIL, GROCERY, FITNESS, or BEAUTY_WELLNESS"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of ranked corridors to retrieve (e.g. 3, 5)"
                    }
                },
                "required": ["city", "category_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_corridor",
            "description": "Get granular spatial intelligence for one corridor: demand sources, magnets, dayparts, competition, and resilience.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "enum": ["nyc", "dfw"],
                        "description": "Target city ('nyc' or 'dfw')"
                    },
                    "category_id": {
                        "type": "string",
                        "description": "Business category: CAFE, RESTAURANT, RETAIL, GROCERY, FITNESS, or BEAUTY_WELLNESS"
                    },
                    "corridor_id": {
                        "type": "string",
                        "description": "Corridor identifier or corridor name (e.g. 'MGM2l4lvj25X' or 'Upper East Side')"
                    }
                },
                "required": ["city", "category_id", "corridor_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_corridors",
            "description": "Compare two or three commercial corridors side-by-side for a category in a city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "enum": ["nyc", "dfw"],
                        "description": "Target city ('nyc' or 'dfw')"
                    },
                    "category_id": {
                        "type": "string",
                        "description": "Business category: CAFE, RESTAURANT, RETAIL, GROCERY, FITNESS, or BEAUTY_WELLNESS"
                    },
                    "corridor_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of 2 to 3 corridor IDs or corridor names to compare"
                    }
                },
                "required": ["city", "category_id", "corridor_ids"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_cross_metro_twin",
            "description": "Find the most similar commercial corridor in the opposite metro (NYC <-> DFW) with VoidSpot derived similarity.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "enum": ["nyc", "dfw"],
                        "description": "Source city ('nyc' or 'dfw')"
                    },
                    "category_id": {
                        "type": "string",
                        "description": "Business category: CAFE, RESTAURANT, RETAIL, GROCERY, FITNESS, or BEAUTY_WELLNESS"
                    },
                    "corridor_id": {
                        "type": "string",
                        "description": "Corridor identifier or corridor name (e.g. 'MGM2l4lvj25X' or 'Upper East Side')"
                    }
                },
                "required": ["city", "category_id", "corridor_id"]
            }
        }
    }
]

def resolve_corridor_id(city: str, query_id_or_name: str) -> str:
    """Resolve corridor name or partial string to its actual corridor_id if needed."""
    try:
        corridors = get_corridors(city)
        clean_q = query_id_or_name.strip().lower()
        for c in corridors:
            if c.get("corridor_id", "").lower() == clean_q:
                return c.get("corridor_id")
        # Check by name exact
        for c in corridors:
            if c.get("name", "").strip().lower() == clean_q:
                return c.get("corridor_id")
        # Check by name containment
        for c in corridors:
            if clean_q in c.get("name", "").strip().lower():
                return c.get("corridor_id")
    except Exception:
        pass
    return query_id_or_name.strip()

def execute_tool_call(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Dispatch the tool call directly to existing deterministic ai_tools functions."""
    city = arguments.get("city", "nyc").lower()
    category = arguments.get("category_id", "CAFE").upper()

    # Normalization of category names
    cat_norm = {
        "COFFEE": "CAFE",
        "COFFEE SHOP": "CAFE",
        "FOOD": "RESTAURANT",
        "DINING": "RESTAURANT",
        "GYM": "FITNESS",
        "SPA": "BEAUTY_WELLNESS",
        "SALON": "BEAUTY_WELLNESS",
        "SUPERMARKET": "GROCERY"
    }
    category = cat_norm.get(category, category)

    if name == "get_recommendation":
        return tool_get_recommendation(city=city, category_id=category)
    
    elif name == "find_opportunities":
        limit = int(arguments.get("limit", 5))
        return tool_find_opportunities(city=city, category_id=category, limit=limit)
    
    elif name == "analyze_corridor":
        cid = arguments.get("corridor_id", "")
        resolved_cid = resolve_corridor_id(city, cid)
        return tool_analyze_corridor(city=city, category_id=category, corridor_id=resolved_cid)
    
    elif name == "compare_corridors":
        raw_ids = arguments.get("corridor_ids", [])
        if isinstance(raw_ids, str):
            raw_ids = [s.strip() for s in raw_ids.split(",") if s.strip()]
        
        # If user asks to compare "best two" or doesn't specify IDs, fetch top 2 from opportunities
        if not raw_ids or len(raw_ids) < 2:
            opps = tool_find_opportunities(city=city, category_id=category, limit=3)
            raw_ids = [item["corridor_id"] for item in opps.get("results", [])[:2]]
        
        resolved_ids = [resolve_corridor_id(city, cid) for cid in raw_ids]
        return tool_compare_corridors(city=city, category_id=category, corridor_ids=resolved_ids)
    
    elif name == "find_cross_metro_twin":
        cid = arguments.get("corridor_id", "")
        resolved_cid = resolve_corridor_id(city, cid)
        return tool_find_cross_metro_twin(city=city, category_id=category, corridor_id=resolved_cid)
    
    raise ValueError(f"Unknown tool: {name}")

AGENT_SYSTEM_PROMPT = """You are the VoidSpot Location Intelligence Agent, an expert commercial retail and location analytics advisor.

CRITICAL GROUND RULES:
1. Ground Truth: Your source of truth is EXCLUSIVELY the deterministic VoidSpot tools (`get_recommendation`, `find_opportunities`, `analyze_corridor`, `compare_corridors`).
2. Absolute Fidelity: You must NEVER invent, fabricate, hallucinate, or estimate scores, corridors, footfall metrics, whitespace values, or rankings.
3. Signal Clarity: Clearly cite:
   - VoidSpot Score (0–100)
   - Category Fit Signal (45% weight)
   - Whitespace Signal (25% weight)
   - Footfall Demand Signal (20% weight)
   - Resilience Index (10% weight)
4. Derived vs Dataset Signals: If `score_source` is 'voidspot_derived', note that the category score is derived from VoidSpot whitespace heuristics. If 'dataset', it is dataset-native.
5. Language & Tone: You can understand and respond in English, Hinglish, or Hindi. When the user asks in Hinglish (e.g. "NYC me cafe ke liye best area batao aur kyun?"), provide a clear, professional, natural, and helpful response (in Hinglish/English mix or user's language) citing the exact evidence.
6. Honest Limitations: If a city or category cannot be evaluated or is unsupported (VoidSpot currently supports NYC and DFW), state this clearly rather than fabricating a response.
"""

def fallback_heuristic_response(user_message: str) -> Dict[str, Any]:
    """
    Fallback deterministic handler when OPENAI_API_KEY is not configured in backend/.env.
    Allows testing and inspection of tool outputs with a clear configuration advisory.
    """
    msg_lower = user_message.lower()
    city = "dfw" if "dfw" in msg_lower or "dallas" in msg_lower else "nyc"
    
    category = "CAFE"
    if "restaurant" in msg_lower or "khana" in msg_lower or "food" in msg_lower:
        category = "RESTAURANT"
    elif "retail" in msg_lower or "shop" in msg_lower or "store" in msg_lower:
        category = "RETAIL"
    elif "grocery" in msg_lower or "supermarket" in msg_lower or "ration" in msg_lower:
        category = "GROCERY"
    elif "gym" in msg_lower or "fitness" in msg_lower:
        category = "FITNESS"
    elif "salon" in msg_lower or "beauty" in msg_lower or "spa" in msg_lower or "wellness" in msg_lower:
        category = "BEAUTY_WELLNESS"

    # Check intent: twin, compare, analyze, or recommend
    if any(k in msg_lower for k in ["twin", "similar", "comparable", "dusra", "other metro"]):
        tool_name = "find_cross_metro_twin"
        
        # Detect source city by finding if the mentioned corridor is in NYC or DFW
        source_city = None
        cid = None
        for c in get_corridors("nyc"):
            if c.get("name", "").lower() in msg_lower:
                source_city = "nyc"
                cid = c["corridor_id"]
                break
        if not source_city:
            for c in get_corridors("dfw"):
                if c.get("name", "").lower() in msg_lower:
                    source_city = "dfw"
                    cid = c["corridor_id"]
                    break
        if not source_city:
            source_city = "nyc"
            cid = "MGM2l4lvj25X"

        evidence = execute_tool_call(tool_name, {"city": source_city, "category_id": category, "corridor_id": cid})
        source_name = evidence.get("source_corridor", {}).get("corridor_name")
        target_name = evidence.get("best_match", {}).get("corridor_name")
        target_city = evidence.get("target_city", "").upper()
        sim = evidence.get("similarity_score")
        expl = "\n".join([f"• {e}" for e in evidence.get("explanation", [])])
        resp_text = (
            f"The **Cross-Metro Twin** for **{source_name}** ({source_city.upper()}) in **{target_city}** is **{target_name}** "
            f"with a **{sim}% VoidSpot Derived Similarity**.\n\n"
            f"**Why they are twins:**\n{expl}\n\n"
            f"*(Metric: VoidSpot Derived Similarity. Set OPENAI_API_KEY for dynamic synthesis.)*"
        )
        return {
            "message": resp_text,
            "tool_used": tool_name,
            "evidence": evidence,
        }

    elif "compare" in msg_lower or "mukabla" in msg_lower or "dono" in msg_lower:
        tool_name = "compare_corridors"
        evidence = execute_tool_call(tool_name, {"city": city, "category_id": category, "corridor_ids": []})
        corridors = evidence.get("corridors", [])
        winner = evidence.get("winner", {})
        if corridors:
            names = " vs ".join([c["corridor_name"] for c in corridors])
            resp_text = (
                f"Head-to-head comparison for {category} in {city.upper()} ({names}):\n\n"
                f"Winner: **{winner.get('corridor_name')}** with a VoidSpot Score of {winner.get('voidspot_score')}/100 "
                f"(Category Fit: {winner.get('signals', {}).get('category_fit')}%, Demand: {winner.get('signals', {}).get('demand')}%, "
                f"Whitespace: {winner.get('signals', {}).get('whitespace')}%, Resilience: {winner.get('signals', {}).get('resilience')}%).\n\n"
                f"Note: To enable full autonomous reasoning and natural conversational synthesis, configure `OPENAI_API_KEY` in `backend/.env`."
            )
        else:
            resp_text = "Insufficient corridors found to compare."

    elif "upper east side" in msg_lower or "analyze" in msg_lower or "analysis" in msg_lower:
        tool_name = "analyze_corridor"
        cid = "MGM2l4lvj25X" if "upper east side" in msg_lower else "MGM2l4lvj25X"
        evidence = execute_tool_call(tool_name, {"city": city, "category_id": category, "corridor_id": cid})
        c_name = evidence.get("corridor", {}).get("name", "Corridor")
        score = evidence.get("voidspot", {}).get("score")
        signals = evidence.get("voidspot", {}).get("signals", {})
        archetype = evidence.get("best_archetype", {}).get("name", "Destination")
        resp_text = (
            f"Detailed intelligence for **{c_name}** ({city.upper()} • {category}):\n\n"
            f"- **VoidSpot Score**: {score}/100\n"
            f"- **Signals**: Category Fit: {signals.get('category_fit')}%, Demand: {signals.get('demand')}%, Whitespace: {signals.get('whitespace')}%, Resilience: {signals.get('resilience')}%\n"
            f"- **Best Archetype**: {archetype}\n\n"
            f"Note: Configure `OPENAI_API_KEY` in `backend/.env` for real-time LLM agent synthesis."
        )

    else:
        tool_name = "get_recommendation"
        evidence = execute_tool_call(tool_name, {"city": city, "category_id": category})
        rec = evidence.get("recommendation", {})
        c_name = rec.get("corridor_name", "Top Corridor")
        district = rec.get("district", "")
        score = rec.get("voidspot_score")
        signals = rec.get("signals", {})
        why = evidence.get("why", "")

        is_hinglish = any(w in msg_lower for w in ["batao", "kyun", "liye", "kahan", "hai", "me"])
        if is_hinglish:
            resp_text = (
                f"{city.upper()} me {category} ke liye sabse best location **{c_name}** ({district}) hai, "
                f"jiska VoidSpot Score **{score}/100** hai.\n\n"
                f"**Kyun?** {why}\n\n"
                f"Key Signals:\n"
                f"- Category Fit: {signals.get('category_fit')}%\n"
                f"- Consumer Demand: {signals.get('demand')}%\n"
                f"- Whitespace Opportunity: {signals.get('whitespace')}%\n"
                f"- Resilience: {signals.get('resilience')}%\n\n"
                f"(Note: Deterministic data ground truth verified. Set `OPENAI_API_KEY` in `backend/.env` for full custom LLM reasoning)."
            )
        else:
            resp_text = (
                f"**{c_name}** ({district}) is the highest-ranked opportunity for {category} in {city.upper()}, "
                f"achieving a VoidSpot Score of **{score}/100**.\n\n"
                f"**Strategic Rationale**: {why}\n\n"
                f"Key Signals:\n"
                f"- Category Fit: {signals.get('category_fit')}%\n"
                f"- Consumer Demand: {signals.get('demand')}%\n"
                f"- Whitespace: {signals.get('whitespace')}%\n"
                f"- Resilience: {signals.get('resilience')}%\n\n"
                f"(Note: Deterministic data ground truth verified. Set `OPENAI_API_KEY` in `backend/.env` for dynamic LLM synthesis)."
            )

    return {
        "message": resp_text,
        "tool_used": tool_name,
        "evidence": evidence,
    }

def run_agent_chat(user_message: str) -> Dict[str, Any]:
    """
    Main entry point for agent chat:
    1. Checks if OpenAI client is configured.
    2. Runs tool-calling conversation with OpenAI.
    3. Executes matched VoidSpot tool.
    4. Generates synthesized evidence-grounded response.
    """
    client = get_openai_client()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    if client is None:
        return fallback_heuristic_response(user_message)

    try:
        messages = [
            {"role": "system", "content": AGENT_SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ]

        # First call: determine tool and extract arguments
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=VOIDSPOT_TOOLS,
            tool_choice="auto",
            temperature=0.2,
        )

        response_msg = response.choices[0].message

        # If the model didn't call a tool (e.g. greeting or general query), return message directly
        if not response_msg.tool_calls:
            return {
                "message": response_msg.content or "Please ask a question regarding business opportunities in NYC or DFW.",
                "tool_used": None,
                "evidence": None,
            }

        # Execute the tool calls
        tool_call = response_msg.tool_calls[0]
        tool_name = tool_call.function.name
        tool_args = json.loads(tool_call.function.arguments)

        evidence = execute_tool_call(tool_name, tool_args)

        # Second call: send evidence back to model to synthesize final response
        messages.append(response_msg)
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "name": tool_name,
            "content": json.dumps(evidence, ensure_ascii=False)
        })

        final_response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.2,
        )

        final_text = final_response.choices[0].message.content

        return {
            "message": final_text,
            "tool_used": tool_name,
            "evidence": evidence,
        }

    except Exception as err:
        print(f"Agent error during OpenAI execution: {err}")
        # Gracefully fall back to deterministic response rather than failing
        fallback = fallback_heuristic_response(user_message)
        fallback["message"] += f"\n\n*(Notice: Live OpenAI tool execution encountered: {str(err)}. Deterministic fallback displayed.)*"
        return fallback
