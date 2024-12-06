import { CONFIG } from "../config/constants.js";

export async function fetchGames() {
  try {
    const endpoint = `${CONFIG.API_BASE_URL}/api/game/all/`;
    console.log("Sending request to endpoint:", endpoint);

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log("response not ok");
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("response from api ", response);

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
