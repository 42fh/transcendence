import { CONFIG } from "../config/constants.js";

export async function createNewGame(gameConfig) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/game/games/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameConfig),
      }
    );

    const data = await response.json();

    return {
      success: response.ok,
      ...data,
    };
  } catch (error) {
    console.error("Game creation error:", error);
    throw error;
  }
}
