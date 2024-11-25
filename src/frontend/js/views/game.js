import { CONFIG } from "../config/constants.js";

export async function gameHome() {
    try {
        console.log("gameHome");
      const response = await fetch(`${CONFIG.API_BASE_URL}/get_all_games/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
        
        console.log("received -->");
        console.log(response);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new TypeError("Expected JSON response");
      }
  
      const data = await response.json();
      console.log("Available games:", data);
      return data;
    } catch (error) {
      console.error("Error fetching available games:", error);
      throw error;
    }
  }