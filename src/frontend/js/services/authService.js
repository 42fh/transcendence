import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { handleLogout } from "../views/auth.js";
import { displayModalError } from "../components/modal.js";
import { sendUserOnlineStatus } from "../services/usersService.js"

export async function loginUser(data) {
  return handleAuthRequest(data, "/api/users/auth/login/");
}

export async function signupUser(data) {
  return handleAuthRequest(data, "/api/users/auth/signup/");
}

export async function getJWT(data) {
  return handleAuthRequest(data, "/api/token/");
}

export async function refreshJWT(token) {
  const response = await fetch("/api/token/refresh/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: token }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Token refresh failed");
  }

  return response.json();
}

export async function logoutUser() {

  sendUserOnlineStatus(false, Date.now());
  // let isOnline = false;
  // console.log("Sending user online status", isOnline ? "Online" : "Offline");
  // const accessToken = await manageJWT();
  // const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  // const online_response = await fetch(`/api/game/user/online/${userId}`, {
  //   method: isOnline ? "POST" : "DELETE", // Use POST for online, DELETE for offline
  //   headers: {
  //     Authorization: `Bearer ${accessToken}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     isOnline,
  //     // expiration: expirationTimestamp,
  //   }),
  // });

  const response = await fetch("/api/users/auth/logout/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Logout failed");
  }

  return response.json();
}

async function handleAuthRequest(data, endpoint) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Authentication failed");
  }

  return result;
}

export async function sendEmailVerification(userData) {
  const accessToken = await manageJWT();
  const response = await fetch("/api/users/auth/send-email-verification/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to send email verification");
  }

  return result;
}

export async function validateEmailVerification(token) {
  const accessToken = await manageJWT();
  const response = await fetch(`/api/users/auth/validate-email-verification/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Email verification failed");
  }

  return result;
}

async function loginJWT(data) {
  const result = await getJWT(data);
  setSecureCookie("refresh_token", result.refresh, 1440);
  setSecureCookie("access_token", result.access);
}

async function getNewAccessToken(refreshToken) {
  console.log("Using refresh token to get new access token...");
  const result = await refreshJWT(refreshToken);
  setSecureCookie("access_token", result.access);
}

export async function manageJWT(data = {}, login = false) {
  try {
    const accessToken = getCookie("access_token");
    const refreshToken = getCookie("refresh_token");

    if (accessToken == "expired" || accessToken == "not_found") {
      console.log("Access token expired or not found");
      if (refreshToken == "not_found" || refreshToken == "expired") {
        if (login) {
          await loginJWT(data);
        } else {
          throw new Error("No refresh token found");
        }
      } else {
        await getNewAccessToken(refreshToken);
      }
    }
    return getCookie("access_token");
  } catch (error) {
    console.error("Error managing JWT:", error);
    await handleLogout();
    displayModalError("Your session has expired");
    return null;
  }
}

export function setSecureCookie(name, value, expirationMinutes = 30) {
  const expires = new Date(
    Date.now() + expirationMinutes * 60 * 1000
  ).toUTCString();
  document.cookie = `${name}=${value}; Path=/; Expires=${expires}; SameSite=Strict; Secure`;
}

export function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + "=")) {
      const [, value, expiration] = cookie.split("=");
      if (expiration) {
        const expirationDate = new Date(parseInt(expiration, 10));
        if (expirationDate > new Date()) {
          return value;
        } else {
          return "expired";
        }
      } else {
        return value;
      }
    }
  }
  return "not_found";
}
