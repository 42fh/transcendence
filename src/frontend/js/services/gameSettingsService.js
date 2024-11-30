import { CONFIG } from "../config/constants.js";

export async function createNewGame(gameConfig) {
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/game/create_new_game/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameConfig),
      }
    );

    if (response.ok) {
      console.log("POST request successful");
      const data = await response.json();
      console.log("Data received: ", data);
      return data;
    } else {
      console.log("POST request unsuccessful");
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create game");
    }
  } catch (error) {
    console.error("Game creation error:", error);
    throw error;
  }
}
