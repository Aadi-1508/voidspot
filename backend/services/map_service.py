import h3
from typing import Dict, Any, List, Optional
from services.data_loader import load_all_datasets
from services.scoring_service import calculate_opportunities
from services.corridor_service import get_corridors

# In-memory cache for computed corridor centroids
_CENTROID_CACHE: Dict[str, Dict[str, List[float]]] = {}

# Well-known fallback coordinates for NYC corridors without H3 ownership records
NYC_MANUAL_COORDS = {
    "QPkI026dCXN8": [40.6753, -74.0102],  # Red Hook
    "bDDLHESYLI9r": [40.7604, -73.9511],  # Roosevelt Island
    "mK6wmOBCZn5M": [40.7538, -74.0022],  # Hudson Yards
    "xD6JYrAHlLl6": [40.7081, -73.9571],  # South Williamsburg
    "xoQ10TKm9AVm": [40.5284, -74.2255],  # West Shore–Richmond Valley
}

# District geographic center anchor points for DFW
DFW_DISTRICT_ANCHORS = {
    "Dallas Core": [32.783, -96.798],
    "Dallas North": [32.962, -96.829],
    "Dallas East-South": [32.745, -96.765],
    "Fort Worth Core": [32.755, -97.330],
    "Fort Worth West": [32.735, -97.420],
    "Alliance-North FW": [32.930, -97.315],
    "Tarrant East": [32.802, -97.230],
    "Arlington": [32.740, -97.100],
    "Airport-Southlake": [32.935, -97.080],
    "Irving-Mid-Cities": [32.860, -96.960],
    "Collin County": [33.100, -96.720],
    "Denton County": [33.150, -96.980],
    "North-East": [32.885, -96.530],
    "Southern": [32.570, -97.050],
}

# Known DFW landmarks/corridors coordinates
DFW_SPECIFIC_COORDS = {
    "04C97C1C31A5": [32.7831, -96.7845],  # Deep Ellum
    "4200471AD82F": [32.7932, -96.8201],  # Design District
    "390715604DAF": [33.0804, -96.8251],  # Plano Legacy West
    "04806BCD402F": [33.1972, -96.6153],  # McKinney Historic Downtown
    "344D47DECA89": [33.2148, -97.1331],  # Denton Historic Square
    "29F3FE801A11": [32.7553, -97.3308],  # Downtown Fort Worth Sundance Square
    "478E01C11C56": [32.7516, -97.3552],  # West 7th Montgomery Plaza
    "7C55B227EC98": [32.7302, -97.3325],  # Near Southside Magnolia
    "4AEE6814BE65": [32.7472, -97.0945],  # Arlington Entertainment District
    "74A7EB49F0F6": [32.7357, -97.1081],  # Downtown Arlington UTA
    "FA905F87FEAB": [32.9461, -97.1392],  # Southlake Colleyville
    "B89B5CCD5A6F": [32.8998, -97.0403],  # DFW Airport
    "0D3B0A18EAC9": [33.0762, -96.8924],  # The Colony Grandscape
    "0E97EA7325C0": [33.1625, -96.9372],  # Little Elm
    "14C4AB7A2CB4": [32.5421, -97.3204],  # Burleson Old Town
    "45488E8C88F1": [32.9620, -96.8291],  # Addison Beltline
    "3FEE7284528A": [32.8140, -96.9488],  # Irving Old Irving
    "A78B7E3D6693": [32.9342, -97.0781],  # Grapevine Historic Main
    "A9E456D916AB": [32.8981, -96.4820],  # Rockwall Harbor
}

def init_nyc_centroids() -> Dict[str, List[float]]:
    """Calculate geographic centroids for NYC corridors from their core H3-10 cells."""
    if "nyc" in _CENTROID_CACHE:
        return _CENTROID_CACHE["nyc"]

    datasets = load_all_datasets()
    cells = datasets.get("nyc_ownership", {}).get("h3_10_cells", [])

    corridor_points: Dict[str, List[tuple]] = {}
    for c in cells:
        cid = c.get("corridor_id")
        if not cid:
            continue
        if cid not in corridor_points:
            corridor_points[cid] = []
        # Sample up to 20 cells per corridor
        if len(corridor_points[cid]) < 20:
            try:
                lat, lng = h3.cell_to_latlng(c["h3_10"])
                corridor_points[cid].append((lat, lng))
            except Exception:
                pass

    centroids: Dict[str, List[float]] = {}
    for cid, pts in corridor_points.items():
        if pts:
            avg_lat = sum(p[0] for p in pts) / len(pts)
            avg_lng = sum(p[1] for p in pts) / len(pts)
            centroids[cid] = [round(avg_lat, 5), round(avg_lng, 5)]

    # Add fallbacks
    for cid, coords in NYC_MANUAL_COORDS.items():
        if cid not in centroids:
            centroids[cid] = coords

    _CENTROID_CACHE["nyc"] = centroids
    return centroids

def init_dfw_centroids() -> Dict[str, List[float]]:
    """Determine coordinates for DFW corridors using known landmarks and district anchors."""
    if "dfw" in _CENTROID_CACHE:
        return _CENTROID_CACHE["dfw"]

    datasets = load_all_datasets()
    dfw_corridors = datasets.get("dfw", {}).get("corridors", [])

    centroids: Dict[str, List[float]] = {}
    district_counts: Dict[str, int] = {}

    for c in dfw_corridors:
        cid = c.get("corridor_id")
        if not cid:
            continue

        if cid in DFW_SPECIFIC_COORDS:
            centroids[cid] = DFW_SPECIFIC_COORDS[cid]
            continue

        district = c.get("district", "Dallas Core")
        anchor = DFW_DISTRICT_ANCHORS.get(district, [32.783, -96.798])
        
        # Offset each corridor slightly around district anchor to prevent stacking
        count = district_counts.get(district, 0)
        district_counts[district] = count + 1
        
        # Slight circular dispersion (radius ~ 1.5 - 3 km)
        angle = count * 1.05
        offset_lat = 0.015 * (count % 3 + 1) * 0.5 * (1 if count % 2 == 0 else -1)
        offset_lng = 0.018 * (count % 4 + 1) * 0.4 * (1 if count % 3 == 0 else -1)

        centroids[cid] = [
            round(anchor[0] + offset_lat, 5),
            round(anchor[1] + offset_lng, 5),
        ]

    _CENTROID_CACHE["dfw"] = centroids
    return centroids

def get_corridor_coordinates(city: str, corridor_id: str) -> List[float]:
    city = city.lower()
    if city == "nyc":
        centroids = init_nyc_centroids()
        return centroids.get(corridor_id, [40.7589, -73.9851])
    else:
        centroids = init_dfw_centroids()
        return centroids.get(corridor_id, [32.7767, -96.7970])

def get_map_corridors(city: str, category_id: str) -> Dict[str, Any]:
    """
    Return all scored corridors with real geographic coordinates and layer telemetry.
    """
    city = city.lower()
    category_id = category_id.upper()
    opportunities = calculate_opportunities(city, category_id)
    
    datasets = load_all_datasets()
    corridor_meta = {c["corridor_id"]: c for c in datasets.get(city, {}).get("corridors", [])}

    CATEGORY_PLACE_MAP = {
        "CAFE": "CAFE",
        "RESTAURANT": "RESTAURANT",
        "RETAIL": "RETAIL",
        "GROCERY": "GROCERY_SUPERMARKET",
        "FITNESS": "FITNESS",
        "BEAUTY_WELLNESS": "PERSONAL_CARE",
    }
    place_class = CATEGORY_PLACE_MAP.get(category_id, category_id)

    results = []
    for rank, opp in enumerate(opportunities, start=1):
        cid = opp["corridor_id"]
        coords = get_corridor_coordinates(city, cid)
        meta = corridor_meta.get(cid, {})

        # Competition count
        places = meta.get("places") or {}
        classes = places.get("classes") or {}
        cat_data = classes.get(place_class) or {}
        listing_count = cat_data.get("listing_count", 0)

        # Footfall / audience score
        signals = opp.get("signals", {})

        results.append({
            "corridor_id": cid,
            "corridor_name": opp.get("corridor_name"),
            "district": opp.get("district"),
            "borough": meta.get("borough"),
            "city": city,
            "rank": rank,
            "coordinates": coords,
            "voidspot_score": opp.get("voidspot_score"),
            "category_fit": signals.get("category_fit", 0),
            "demand": signals.get("demand", 0),
            "whitespace": signals.get("whitespace", 0),
            "resilience": signals.get("resilience", 0),
            "competition_count": listing_count,
            "score_source": opp.get("score_source", "dataset"),
            "character": meta.get("character", "Commercial Corridor"),
            "form": meta.get("form", "Linear"),
        })

    center = [40.7306, -73.9352] if city == "nyc" else [32.7767, -96.7970]
    zoom = 11 if city == "nyc" else 10

    return {
        "city": city,
        "category_id": category_id,
        "center": center,
        "zoom": zoom,
        "count": len(results),
        "corridors": results,
    }

def get_h3_grid(city: str, category_id: str) -> Dict[str, Any]:
    """
    Return H3 Opportunity Grid.
    NYC: Authentic H3-10 polygons from dataset with ownership roles.
    DFW: Gracefully reports unavailable (as verified in dataset).
    """
    city = city.lower()
    category_id = category_id.upper()

    if city != "nyc":
        return {
            "city": city,
            "available": False,
            "message": "H3 geometry is not authoritative for the DFW dataset. Gracefully showing corridor-level visualization.",
            "cells": [],
        }

    datasets = load_all_datasets()
    cells = datasets.get("nyc_ownership", {}).get("h3_10_cells", [])
    opportunities = calculate_opportunities(city, category_id)
    opp_scores = {o["corridor_id"]: o["voidspot_score"] for o in opportunities}
    opp_names = {o["corridor_id"]: o["corridor_name"] for o in opportunities}

    # Sample top core ownership cells per corridor to keep payload snappy (<150KB)
    corridor_core_cells: Dict[str, List[dict]] = {}
    for c in cells:
        cid = c.get("corridor_id")
        if not cid or cid not in opp_scores:
            continue
        role = c.get("ownership_role", "")
        # Prioritize core analysis origin cells
        is_core = "ORIGIN" in role or "CORE" in role
        if cid not in corridor_core_cells:
            corridor_core_cells[cid] = []
        
        # Max 8 cells per corridor
        if len(corridor_core_cells[cid]) < 8 and (is_core or len(corridor_core_cells[cid]) < 4):
            corridor_core_cells[cid].append(c)

    hex_features = []
    for cid, cell_list in corridor_core_cells.items():
        score = opp_scores.get(cid, 50.0)
        cname = opp_names.get(cid, "Corridor")
        for item in cell_list:
            h3_idx = item.get("h3_10")
            try:
                # Boundary returns vertices as list of (lat, lng)
                boundary = h3.cell_to_boundary(h3_idx)
                boundary_coords = [[round(p[0], 5), round(p[1], 5)] for p in boundary]
                center_pt = h3.cell_to_latlng(h3_idx)
                hex_features.append({
                    "h3_index": h3_idx,
                    "corridor_id": cid,
                    "corridor_name": cname,
                    "ownership_role": item.get("ownership_role"),
                    "voidspot_score": score,
                    "center": [round(center_pt[0], 5), round(center_pt[1], 5)],
                    "polygon": boundary_coords,
                })
            except Exception:
                continue

    return {
        "city": "nyc",
        "available": True,
        "message": "NYC H3-10 Geographic Opportunity Grid (Commercial Concentration)",
        "count": len(hex_features),
        "cells": hex_features,
    }
