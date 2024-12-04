import { CONFIG } from "../config/constants.js";

export async function fetchGames() {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/game/waiting/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.log("response not ok");
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response received:", text);
      throw new TypeError("Expected JSON response");
    }

    const data = await response.json();
    return JSON.parse(data.games);
  } catch (error) {
    console.error("Error fetching available games:", error);
    throw error;
  }
}
