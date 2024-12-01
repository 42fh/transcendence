import { displayLogoutError } from "../utils/errors.js";
import { renderModal, closeModal, displayModalError } from "../components/modal.js";
import { loadHomePage } from "./home.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { loginUser, signupUser, logoutUser } from "../services/authService.js";

function initAuthListeners() {
  document.getElementById("login-button").addEventListener("click", () => {
    renderModal("login-template", {
      submitHandler: handleLogin,
    });
  });

  document.getElementById("signup-button").addEventListener("click", () => {
    renderModal("signup-template", {
      submitHandler: handleSignup,
    });
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
    if (!addToHistory) updateActiveNavItem("auth");
    const mainContent = document.getElementById("main-content");

    mainContent.innerHTML = "";

    const authTemplate = document.getElementById("auth-template");
    if (!authTemplate) {
      throw new Error("Auth template not found");
    }

    mainContent.appendChild(document.importNode(authTemplate.content, true));
    initAuthListeners();
    // Hide bottom nav on auth page
    const bottomNavContainer = document.getElementById("bottom-nav-container");
    if (bottomNavContainer) {
      bottomNavContainer.style.display = "none";
    }
  } catch (error) {
    console.error("Error loading auth page:", error);
    displayLogoutError("An error occurred while loading the login page.");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  await handleAuth(event.target, loginUser);
}

async function handleSignup(event) {
  event.preventDefault();
  await handleAuth(event.target, signupUser);
}

async function handleAuth(form, authFunction) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const messageElement = document.getElementById("modal-message");

  try {
    const result = await authFunction(data);
    messageElement.style.color = "white";
    messageElement.innerText = `${result.message || "Signup or Login successful! 🎉 Redirecting..."}`;
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, result.username);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, result.id);
    form.style.display = "none";
    setTimeout(() => {
      closeModal();
      history.pushState({ view: "home" }, "");
      loadHomePage();
    }, 2000);
  } catch (error) {
    messageElement.style.color = "var(--color-error)";
    messageElement.innerText = error.message;
    console.error("Error submitting form:", error);
  }
}

export async function handleLogout() {
  console.log("Attempting to log out...");
  try {
    await logoutUser();

    localStorage.removeItem(LOCAL_STORAGE_KEYS.USERNAME);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_ID);
    history.pushState({ view: "auth" }, "");
    loadAuthPage();
  } catch (error) {
    console.error("Logout error:", error);
    displayLogoutError("An error occurred while logging out. Please try again.");
  }
}
