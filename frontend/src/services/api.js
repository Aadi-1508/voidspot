const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      let detail = '';
      try {
        const errorData = await res.json();
        detail = errorData.detail || JSON.stringify(errorData);
      } catch {
        detail = await res.text();
      }
      throw new ApiError(
        detail || `Request failed with status ${res.status}`,
        res.status,
        detail
      );
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network error or backend unreachable
    throw new ApiError(
      'VoidSpot backend is currently unavailable. Please make sure the API is running on port 8000.',
      0,
      err.message
    );
  }
}

export const api = {
  // Health check
  async checkHealth() {
    return request('/health');
  },

  // Dynamic Categories by City
  async getCategories(city) {
    const data = await request(`/categories/${city.toLowerCase()}`);
    return data.categories || [];
  },

  // All corridors in a city
  async getCorridors(city) {
    const data = await request(`/corridors/${city.toLowerCase()}`);
    return data.corridors || [];
  },

  // Ranked Opportunities for City + Category
  async getOpportunities(city, categoryId) {
    const data = await request(`/opportunities/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}`);
    return data;
  },

  // Top Recommendation & Explanation for City + Category
  async getRecommendation(city, categoryId) {
    return request(`/recommend/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}`);
  },

  // Compare 2-3 Corridors
  async compareCorridors(city, categoryId, corridorIds) {
    const idsString = Array.isArray(corridorIds) ? corridorIds.join(',') : corridorIds;
    return request(`/compare/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}?corridor_ids=${encodeURIComponent(idsString)}`);
  },

  // Deep Corridor Analysis & Intelligence
  async getCorridorAnalysis(city, categoryId, corridorId) {
    return request(`/analysis/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}/${encodeURIComponent(corridorId)}`);
  },

  // AI Tools metadata
  async getAiTools() {
    return request('/ai-tools');
  },

  // AI Tool direct endpoints
  async aiToolOpportunities(city, categoryId, limit = 5) {
    return request(`/ai-tools/opportunities/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}?limit=${limit}`);
  },

  async aiToolRecommend(city, categoryId) {
    return request(`/ai-tools/recommend/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}`);
  },

  async aiToolAnalyze(city, categoryId, corridorId) {
    return request(`/ai-tools/analyze/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}/${encodeURIComponent(corridorId)}`);
  },

  async aiToolCompare(city, categoryId, corridorIds) {
    const idsString = Array.isArray(corridorIds) ? corridorIds.join(',') : corridorIds;
    return request(`/ai-tools/compare/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}?corridor_ids=${encodeURIComponent(idsString)}`);
  },

  // LLM Agent endpoints
  async getAgentStatus() {
    return request('/agent/status');
  },

  async sendAgentChat(message) {
    return request('/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
  },

  // Map & Spatial Intelligence
  async getMapCorridors(city, categoryId) {
    return request(`/map/corridors/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}`);
  },

  async getMapH3(city, categoryId) {
    return request(`/map/h3/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}`);
  },

  // Cross-Metro Twin
  async getCrossMetroTwin(city, categoryId, corridorId) {
    return request(`/twin/${city.toLowerCase()}/${encodeURIComponent(categoryId.toUpperCase())}/${encodeURIComponent(corridorId)}`);
  },
};

export default api;
