import { LOCAL_STORAGE_KEYS } from "../config/constants.js";

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

export async function manageJWT(data = {}) {
  try {
    const accessToken = getCookie("access_token");
    if (accessToken == "expired") {
      console.log("Access token expired.");

      const refreshToken = getCookie("refresh_token");

      if (refreshToken == "not_found" || refreshToken == "expired") {
        console.log("No refresh token found. Logging in...");
        const result = await getJWT(data);

        setSecureCookie("access_token", result.access);
        setSecureCookie("refresh_token", result.refresh, 1440);
      } else {
        console.log("Using refresh token to get new access token...");
        const result = await refreshJWT(refreshToken);

        setSecureCookie("access_token", result.access);
      }
    } else if (accessToken == "not_found") {
      console.log("No access token found.");

      const refreshToken = getCookie("refresh_token");
      if (refreshToken == "not_found" || refreshToken == "expired") {
        console.log("No refresh token found. Logging in...");
        const result = await getJWT(data);
        setSecureCookie("refresh_token", result.refresh, 1440);
        setSecureCookie("access_token", result.access);
      } else {
        console.log("Using refresh token to get new access token...");
        const result = await refreshJWT(refreshToken);
        setSecureCookie("access_token", result.access);
      }
    }
    return getCookie("access_token");
  } catch (error) {
    console.error("Error managing JWT:", error);
    logoutUser();
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
