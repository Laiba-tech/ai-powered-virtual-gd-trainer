const API_URL = "http://localhost:5000/api/speaking";

function getToken() {
  return localStorage.getItem("token");
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const speakingService = {
  getTopics() {
    return request("/topics");
  },

  createSession(payload) {
    return request("/sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  evaluateSpeech(sessionId, payload) {
    return request(`/sessions/${sessionId}/evaluate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getHistory() {
    return request("/sessions");
  },

  getSession(sessionId) {
    return request(`/sessions/${sessionId}`);
  },

  getAudienceReaction(sessionId, payload) {
    return request(`/sessions/${sessionId}/audience`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getHint(topic, transcript) {
    return request("/hint", {
      method: "POST",
      body: JSON.stringify({ topic, transcript }),
    });
  },
};
