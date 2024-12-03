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

export async function refreshJWT(data) {
  return handleAuthRequest(data, "/api/token/refresh");
}

export async function logoutUser() {
  const response = await fetch("/api/users/auth/logout/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      refreshJWT();
      logoutUser();
    }
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
  const response = await fetch("/api/users/auth/send-email-verification/", {
    method: "POST",
    headers: {
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
  const response = await fetch(`/api/users/auth/validate-email-verification/`, {
    method: "POST",
    headers: {
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

function setSecureCookie(name, value, expirationDays) {
  const expires = new Date(
    Date.now() + expirationDays * 24 * 60 * 60 * 1000
  ).toUTCString();
  document.cookie = `${name}=${value}; Path=/; Expires=${expires}; SameSite=Strict; Secure; HttpOnly`;
}

function getCookie(name) {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}
