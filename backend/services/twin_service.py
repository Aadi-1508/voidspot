import math
from typing import Dict, Any, List, Optional
from services.data_loader import load_all_datasets
from services.scoring_service import calculate_opportunities
from services.corridor_service import get_corridors

def get_other_city(city: str) -> str:
    return "dfw" if city.lower() == "nyc" else "nyc"

def find_cross_metro_twin(city: str, category_id: str, corridor_id: str) -> Dict[str, Any]:
    """
    Deterministically find the most similar commercial corridor in the opposite metro.
    NYC <-> DFW.
    Compares:
      - VoidSpot opportunity score
      - Category fit signal
      - Demand footfall signal
      - Resilience signal
      - Whitespace signal
      - Urban character / spatial form
    """
    city = city.lower()
    target_city = get_other_city(city)
    category_id = category_id.upper()

    source_opps = calculate_opportunities(city, category_id)
    source_opp = next((item for item in source_opps if item["corridor_id"] == corridor_id), None)

    if not source_opp:
        raise ValueError(f"Corridor '{corridor_id}' not found for category '{category_id}' in {city.upper()}.")

    target_opps = calculate_opportunities(target_city, category_id)
    if not target_opps:
        raise ValueError(f"No commercial corridors found in target city {target_city.upper()} for {category_id}.")

    source_signals = source_opp.get("signals", {})
    source_fit = source_signals.get("category_fit", 50.0)
    source_demand = source_signals.get("demand", 50.0)
    source_resilience = source_signals.get("resilience", 50.0)
    source_whitespace = source_signals.get("whitespace", 50.0)
    source_score = source_opp.get("voidspot_score", 50.0)

    # Fetch corridor metadata for character matching
    source_corridors = {c["corridor_id"]: c for c in get_corridors(city)}
    target_corridors = {c["corridor_id"]: c for c in get_corridors(target_city)}
    
    source_meta = source_corridors.get(corridor_id, {})
    source_character = (source_meta.get("character") or "").lower()

    matches = []

    for candidate in target_opps:
        cand_id = candidate["corridor_id"]
        cand_signals = candidate.get("signals", {})
        cand_fit = cand_signals.get("category_fit", 50.0)
        cand_demand = cand_signals.get("demand", 50.0)
        cand_resilience = cand_signals.get("resilience", 50.0)
        cand_whitespace = cand_signals.get("whitespace", 50.0)
        cand_score = candidate.get("voidspot_score", 50.0)

        # Delta metrics (0 = identical, 100 = max delta)
        delta_score = abs(source_score - cand_score)
        delta_fit = abs(source_fit - cand_fit)
        delta_demand = abs(source_demand - cand_demand)
        delta_resilience = abs(source_resilience - cand_resilience)
        delta_whitespace = abs(source_whitespace - cand_whitespace)

        # Signal similarity (1.0 - normalized delta)
        sim_score = max(0.0, 100.0 - delta_score)
        sim_fit = max(0.0, 100.0 - delta_fit)
        sim_demand = max(0.0, 100.0 - delta_demand)
        sim_resilience = max(0.0, 100.0 - delta_resilience)
        sim_whitespace = max(0.0, 100.0 - delta_whitespace)

        cand_meta = target_corridors.get(cand_id, {})
        cand_character = (cand_meta.get("character") or "").lower()

        # Character affinity boost
        char_bonus = 0.0
        if source_character and cand_character:
            if source_character == cand_character:
                char_bonus = 5.0
            elif any(word in cand_character for word in source_character.split() if len(word) > 3):
                char_bonus = 2.5

        # Weighted composite similarity
        composite_sim = (
            sim_score * 0.30 +
            sim_fit * 0.25 +
            sim_demand * 0.20 +
            sim_resilience * 0.15 +
            sim_whitespace * 0.10 +
            char_bonus
        )
        composite_sim = min(99.4, round(composite_sim, 1))

        matches.append({
            "candidate": candidate,
            "meta": cand_meta,
            "similarity_score": composite_sim,
            "similarity_signals": {
                "category_fit_similarity": round(sim_fit, 1),
                "demand_similarity": round(sim_demand, 1),
                "resilience_similarity": round(sim_resilience, 1),
                "whitespace_similarity": round(sim_whitespace, 1),
                "score_similarity": round(sim_score, 1),
            },
            "deltas": {
                "score": round(delta_score, 2),
                "fit": round(delta_fit, 2),
                "demand": round(delta_demand, 2),
                "resilience": round(delta_resilience, 2),
                "whitespace": round(delta_whitespace, 2)
            }
        })

    # Sort candidates by highest similarity score
    matches.sort(key=lambda m: m["similarity_score"], reverse=True)
    best = matches[0]

    # Generate evidence-backed bullet points
    explanations = []
    deltas = best["deltas"]
    if deltas["fit"] <= 8.0:
        explanations.append(f"Comparable category-fit profile (fit signal within {deltas['fit']:.1f}%)")
    else:
        explanations.append(f"Similar retail category alignment (fit signal delta of {deltas['fit']:.1f}%)")

    if deltas["demand"] <= 10.0:
        explanations.append(f"Similar audience footfall intensity (demand delta of {deltas['demand']:.1f}%)")
    else:
        explanations.append(f"Comparable consumer footfall engagement (demand delta: {deltas['demand']:.1f}%)")

    if deltas["resilience"] <= 12.0:
        explanations.append(f"Matching structural resilience and macro shock stability (delta: {deltas['resilience']:.1f}%)")

    if deltas["score"] <= 6.0:
        explanations.append(f"Nearly equivalent aggregate VoidSpot Opportunity Score ({source_score:.1f} vs {best['candidate']['voidspot_score']:.1f})")

    best_cand = best["candidate"]
    return {
        "source_corridor": {
            "corridor_id": source_opp["corridor_id"],
            "corridor_name": source_opp["corridor_name"],
            "district": source_opp["district"],
            "city": city,
            "category_id": category_id,
            "voidspot_score": source_opp["voidspot_score"],
            "score_source": source_opp.get("score_source", "dataset"),
            "signals": source_opp["signals"],
        },
        "target_city": target_city,
        "best_match": {
            "corridor_id": best_cand["corridor_id"],
            "corridor_name": best_cand["corridor_name"],
            "district": best_cand["district"],
            "city": target_city,
            "category_id": category_id,
            "voidspot_score": best_cand["voidspot_score"],
            "score_source": best_cand.get("score_source", "dataset"),
            "signals": best_cand["signals"],
        },
        "similarity_score": best["similarity_score"],
        "similarity_signals": best["similarity_signals"],
        "explanation": explanations,
        "metric_type": "VoidSpot Derived Similarity",
    }
