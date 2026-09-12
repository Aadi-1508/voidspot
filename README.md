# VoidSpot — Retail Gap & Opportunity Engine

VoidSpot is a commercial location intelligence and whitespace discovery engine designed to help retail founders, real estate teams, and operators identify high-yield commercial corridors. It integrates footfall behavior, demand magnets, category saturation, and structural resilience into deterministic spatial scores.

---

## 1. What the VoidSpot Agent Does

The **VoidSpot AI Agent** is an autonomous intelligence assistant that enables natural-language interactions with the VoidSpot spatial data engine. 

Instead of requiring users to manually search and compare datasets across multiple screens, the Agent can understand commercial queries in natural language (including **English** and **Hinglish/Hindi**), identify the underlying business intent, query the appropriate backend tools, and synthesize concise, evidence-based recommendations.

### Sample Natural-Language Inquiries Handled:
- *"NYC me cafe ke liye best area batao aur kyun?"*
- *"Which corridor is best for a cafe in NYC?"*
- *"I want to open a business in DFW. What area should I consider?"*
- *"Compare the best two corridors for a cafe in NYC."*
- *"Analyze Upper East Side for a cafe."*
- *"Which area has strong demand and good resilience?"*

---

## 2. How the LLM Uses Existing VoidSpot Tools

The VoidSpot Agent **never hallucinates or fabricates numbers, scores, rankings, or demand stats**. All metrics originate from the deterministic backend:

```
User Question
      ↓
Frontend ("Ask VoidSpot" Modal)
      ↓ HTTP POST /agent/chat
FastAPI Backend
      ↓
VoidSpot Agent Service (backend/services/agent_service.py)
      ↓ OpenAI Tool / Function Calling (gpt-4o-mini)
Existing VoidSpot AI Tools (backend/services/ai_tools.py)
   ├── tool_find_opportunities(city, category_id, limit)
   ├── tool_get_recommendation(city, category_id)
   ├── tool_analyze_corridor(city, category_id, corridor_id)
   └── tool_compare_corridors(city, category_id, corridor_ids)
      ↓
Deterministic Engine & Datasets (services/scoring_service.py, analysis_service.py)
   ├── Category Fit (45%)
   ├── Whitespace Quality (25%)
   ├── Footfall Demand (20%)
   └── Structural Resilience (10%)
      ↓
Agent Synthesizes Evidence-Based Explanation
      ↓
JSON-Safe Response { message, tool_used, evidence }
      ↓
Frontend Chat Interface with Formatted Evidence Breakdown
```

### Signal Provenance & Integrity
- **Dataset Native**: Categories directly validated from empirical ground-truth datasets.
- **VoidSpot Derived**: Indicated when whitespace heuristics and audience telemetry synthesize derived scores.
- **Whitespace Definition**: Whitespace represents relative opportunity density, not measured market saturation.

---

## 3. How to Configure `OPENAI_API_KEY`

The agent uses OpenAI through the backend only.

1. Create or edit `backend/.env` (a template is provided in `backend/.env.example`):
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-proj-your_actual_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```
3. Restart the backend if it is running, or it will automatically hot-reload via `python-dotenv`.

> **Note**: Even if `OPENAI_API_KEY` is not yet configured, the agent includes an intelligent deterministic fallback mode. It will safely dispatch the tool calls and return empirical data, ensuring the system never crashes during evaluation or testing.

---

## 4. Example `POST /agent/chat` Request & Response

### Request
```http
POST http://127.0.0.1:8000/agent/chat
Content-Type: application/json

{
  "message": "NYC me cafe ke liye best area batao aur kyun?"
}
```

### Response
```json
{
  "message": "NYC me CAFE ke liye sabse best location **Upper East Side** (Manhattan) hai, jiska VoidSpot Score **79.85/100** hai.\n\n**Kyun?** Upper East Side is a promising location because it shows strong category fit, strong consumer demand, and good resilience.\n\nKey Signals:\n- Category Fit: 94.09%\n- Consumer Demand: 95.06%\n- Whitespace Opportunity: 40.0%\n- Resilience: 85.0%",
  "tool_used": "get_recommendation",
  "evidence": {
    "recommendation": {
      "corridor_id": "MGM2l4lvj25X",
      "corridor_name": "Upper East Side",
      "district": "Manhattan",
      "category_id": "CAFE",
      "score_source": "dataset",
      "voidspot_score": 79.85,
      "signals": {
        "category_fit": 94.09,
        "whitespace": 40.0,
        "demand": 95.06,
        "resilience": 85.0
      }
    },
    "why": "Upper East Side is a promising location because it shows strong category fit, strong consumer demand, and good resilience.",
    "top_3": [ ... ]
  }
}
```

---

## 5. Security Note: Server-Side API Key Isolation

- **Zero Client-Side Exposure**: `OPENAI_API_KEY` is strictly read on the backend server via environment variables.
- **Frontend Isolation**: No API key is ever bundled into Vite assets or passed to the browser.
- **Endpoint Inspection**: `GET /agent/status` reports whether the agent is configured (`{"configured": true, "model": "gpt-4o-mini"}`) without revealing the secret key.
- **Git Protection**: `.env` and `.env.*` are excluded in `.gitignore` to prevent accidental credential commits.

---

## 6. How to Run the Project

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start the FastAPI Backend
```bash
cd backend
# Optional: activate virtual environment
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
uvicorn main:app --reload --port 8000
```
Backend runs at: `http://127.0.0.1:8000`

### 2. Start the Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### 3. Model Context Protocol (MCP) Server
To use the VoidSpot MCP server with Claude Desktop or Cursor:
```bash
python backend/mcp/server.py
```
Tools exposed: `find_opportunities`, `get_recommendation`, `analyze_corridor`, `compare_corridors`, `find_cross_metro_twin`.

---

## 7. Geospatial Opportunity Map & Cross-Metro Twin Matcher

- **Opportunity Intelligence Map**: Interactive Leaflet dark cartography (`CartoDB Dark Matter`) rendering dynamic layers for Opportunity Score, Demand Footfall, Supply / Density, and authentic H3-10 context grid (NYC). Includes a click-to-analyze side panel.
- **Cross-Metro Twin Matcher**: Multi-signal similarity engine finding comparable commercial corridors across metro regions (NYC ↔ DFW), such as matching Upper East Side (NYC) with Southlake-Colleyville (DFW) at 89% similarity.

