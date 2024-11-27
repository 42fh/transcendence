import { CONFIG } from "../config/constants.js";

export async function fetchUserProfile(userId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/${userId}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

export function formatWinRatio(wins, losses) {
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export function renderMatchHistory(matches, container) {
  if (!matches || matches.length === 0) {
    container.innerHTML = '<p class="profile__matches-empty">No recent matches</p>';
    return;
  }

  container.innerHTML = ""; // Clear container

  const matchTemplate = document.getElementById("profile-match-template");

  matches.forEach((match) => {
    const matchElement = document.importNode(matchTemplate.content, true);
    const matchItem = matchElement.querySelector(".profile__match-item");

    // Add won/lost class
    matchItem.classList.add(match.won ? "profile__match-item--won" : "profile__match-item--lost");

    // Fill in the data
    matchItem.querySelector(".profile__match-date").textContent = new Date(match.date).toLocaleDateString();
    matchItem.querySelector(".profile__match-result").textContent = match.score;
    matchItem.querySelector(".profile__match-opponent").textContent = `vs ${match.opponent?.username || "Unknown"}`;

    container.appendChild(matchElement);
  });
}
