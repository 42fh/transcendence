import { CONFIG, LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { manageJWT } from "./authService.js";

/**
 * Fetches a user's profile data
 * @param {string} userId - The ID of the user to fetch
 * @returns {Promise<{
 *   success: boolean,
 *   status?: number,
 *   error?: "USER_NOT_FOUND" | "SERVER_ERROR" | "NETWORK_ERROR",
 *   message?: string,
 *   data?: {
 *     id: string,
 *     username: string,
 *     first_name: string,
 *     last_name: string,
 *     avatar: string | null,
 *     bio: string,
 *     pronoun: string,
 *     is_active: boolean,
 *     is_friend?: boolean,        // Only present when viewing other profiles
 *     friend_request_status?: "none" | "sent" | "received", // Only present when viewing other profiles
 *     email?: string,            // Only present when viewing own profile
 *     telephone_number?: string, // Only present when viewing own profile
 *     stats: {
 *       wins: number,
 *       losses: number,
 *       win_ratio: number,
 *       display_name: string
 *     }
 *   }
 * }>}
 */
export async function fetchUserProfile(userId) {
  try {
    const accessToken = await manageJWT();

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/users/${userId}/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: response.status === 404 ? "USER_NOT_FOUND" : "SERVER_ERROR",
        message: await response.text(),
      };
    }
    const userData = await response.json();
    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    return {
      success: false,
      error: "NETWORK_ERROR",
      message: error.message,
    };
  }
}

export function formatWinRatio(wins, losses) {
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

export function renderMatchHistory(matches, container) {
  if (!matches || matches.length === 0) {
    container.innerHTML =
      '<p class="profile__matches-empty">No recent matches</p>';
    return;
  }

  container.innerHTML = ""; // Clear container

  const matchTemplate = document.getElementById("profile-match-template");

  matches.forEach((match) => {
    const matchElement = document.importNode(matchTemplate.content, true);
    const matchItem = matchElement.querySelector(".profile__match-item");

    // Add won/lost class
    matchItem.classList.add(
      match.won ? "profile__match-item--won" : "profile__match-item--lost"
    );

    // Fill in the data
    matchItem.querySelector(".profile__match-date").textContent = new Date(
      match.date
    ).toLocaleDateString();
    matchItem.querySelector(".profile__match-result").textContent = match.score;
    matchItem.querySelector(".profile__match-opponent").textContent = `vs ${
      match.opponent?.username || "Unknown"
    }`;

    container.appendChild(matchElement);
  });
}

export async function updateUserProfile(userId, userData) {
  try {
    const accessToken = await manageJWT();

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/api/users/${userId}/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: response.status === 404 ? "USER_NOT_FOUND" : "SERVER_ERROR",
        message: await response.text(),
      };
    }

    const updatedUser = await response.json();
    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    return {
      success: false,
      error: "NETWORK_ERROR",
      message: error.message,
    };
  }
}

export async function uploadUserAvatar(userId, avatarFile) {
  try {
    const formData = new FormData();
    formData.append("file", avatarFile, avatarFile.name);

    const accessToken = await manageJWT();

    const url = `${CONFIG.API_BASE_URL}/api/users/${userId}/avatar/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: response.status === 404 ? "USER_NOT_FOUND" : "SERVER_ERROR",
        message: await response.text(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data.avatar,
    };
  } catch (error) {
    return {
      success: false,
      error: "NETWORK_ERROR",
      message: error.message,
    };
  }
}

export async function fetchUsers(page = 1, perPage = 10, search = "") {
  try {
    const queryParams = new URLSearchParams();
    queryParams.set("page", page);
    queryParams.set("per_page", perPage);
    if (search) queryParams.set("search", search);
    const accessToken = await manageJWT();

    const url = `${CONFIG.API_BASE_URL}/api/users/?${queryParams}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function fetchFriends(page = 1, perPage = 10, search = "") {
  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  if (!userId) throw new Error("User ID not found");
  try {
    const queryParams = new URLSearchParams();
    queryParams.set("page", page);
    queryParams.set("per_page", perPage);
    if (search) queryParams.set("search", search);

    const accessToken = await manageJWT();

    const url = `${CONFIG.API_BASE_URL}/api/users/friends/?${queryParams}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to fetch friends");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
}
