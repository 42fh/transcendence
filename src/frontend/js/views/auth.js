import { displayLogoutError } from "../utils/errors.js";
import { fillModalContent, openModal, closeModal } from "../utils/modals.js";
import { loadHomePage } from "./home.js";

// Event listeners initialization
export function initAuthListeners() {
  document.getElementById("login-button").addEventListener("click", () => {
    fillModalContent("login-template", {
      submitHandler: (event) => handleFormSubmitSignupLogin(event, "/api/users/login/"),
    });
    openModal();
  });

  document.getElementById("signup-button").addEventListener("click", () => {
    fillModalContent("signup-template", {
      submitHandler: (event) => handleFormSubmitSignupLogin(event, "/api/users/signup/"),
    });
    openModal();
  });
}

export async function loadAuthPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "auth",
        },
        ""
      );
    }

    const response = await fetch("/index.html");
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    document.body.innerHTML = doc.body.innerHTML;
  } catch (error) {
    console.error("Error loading auth page:", error);
    displayLogoutError("An error occurred while loading the login page.");
  }
}

async function handleFormSubmitSignupLogin(event, endpoint) {
  event.preventDefault();

  console.log("window.location.origin", window.location.origin);
  console.log("endpoint: ", endpoint);
  const baseUrl = ""; // This is empty which implies fetch will use the relative path
  const fullEndpoint = `${baseUrl}${endpoint}`;
  const form = event.target;
  const formData = new FormData(form);
  const messageElement = document.getElementById("modal-message");
  const data = Object.fromEntries(formData);
  try {
    const response = await fetch(fullEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log("Response Status:", response.status);
    let result;
    try {
      result = await response.json();
      console.log("Success Result:", result);
    } catch (err) {
      console.error("Expected JSON, received something else", err);
      result = {}; // Ensure result is defined even if parsing fails
    }
    if (response.ok) {
      if (messageElement && result && result.message) {
        messageElement.style.color = "white";
        messageElement.innerText = `${result.message || "Signup or Login successful! 🎉 Redirecting..."}`;
      } else {
        console.warn("Element with id 'modal-message' not found in the DOM or result.message is undefined.");
      }
      localStorage.setItem("username", result.username);
      form.style.display = "none";
      setTimeout(() => {
        closeModal();
        history.pushState({ view: "home" }, "");
        loadHomePage();
      }, 2000);
    } else {
      const errorResult = await response.json();
      displayErrorMessageModalModal(errorResult.error || "An error occurred.");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    displayErrorMessageModalModal("There was an issue submitting the form. Please try again.");
  }
}

export async function handleLogout() {
  console.log("Attempting to log out...");
  try {
    const response = await fetch("/api/users/logout/", {
      method: "POST",
      cache: "no-store",
    });
    console.log("Logout response status:", response.status);

    if (response.ok) {
      localStorage.removeItem("username");
      history.pushState({ view: "auth" }, "");
      loadAuthPage();
    } else {
      const result = await response.json();
      console.warn("Logout failed:", result);
      displayLogoutError(result.error || "Logout failed. Please try again.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    displayLogoutError("An error occurred while logging out. Please try again.");
  }
}
