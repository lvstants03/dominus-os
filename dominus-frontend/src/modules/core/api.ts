const BACKEND_URL = "http://localhost:8001";

export async function fetchGatewayHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/gateway/health`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch gateway health");
    return await res.json();
  } catch (err) {
    console.error("API Error in fetchGatewayHealth:", err);
    return null;
  }
}

// Client gọi trực tiếp CSDL chung thông qua backend API hoặc API của MarkovBrain
const MARKOV_URL = "http://localhost:8000";

export async function fetchMarkovStats() {
  try {
    const res = await fetch(`${MARKOV_URL}/api/statistics?limit=1000`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch Markov stats");
    return await res.json();
  } catch (err) {
    console.error("API Error in fetchMarkovStats:", err);
    return null;
  }
}
