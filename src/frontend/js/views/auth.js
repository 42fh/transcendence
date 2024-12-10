import { displayLogoutError } from "../utils/errors.js";
import {
  renderModal,
  closeModal,
  displayModalError,
} from "../components/modal.js";
import { fetchUserProfile } from "../services/usersService.js";
import { loadHomePage } from "./home.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import {
  loginUser,
  signupUser,
  logoutUser,
  sendEmailVerification,
  validateEmailVerification,
  manageJWT,
} from "../services/authService.js";
import { showToast } from "../utils/toast.js";

function initAuthListeners() {
  document.getElementById("login-button").addEventListener("click", () => {
    renderModal("login-template", {
      isFormModal: true,
      setup: (modalElement) => setupAuthForm(modalElement, "login"),
      submitHandler: handleLogin,
    });
  });

  document.getElementById("signup-button").addEventListener("click", () => {
    renderModal("signup-template", {
      isFormModal: true,
      setup: (modalElement) => setupAuthForm(modalElement, "signup"),
      submitHandler: handleSignup,
    });
  });

  document.getElementById("auth42-button").addEventListener("click", () => {
    window.location.href='/api/users/auth/login42/';
  });
}

function setupAuthForm(modalElement, type) {
  const form = modalElement.querySelector("form");
  const inputs = form.querySelectorAll("input");

  // Clear any existing values and messages
  inputs.forEach((input) => (input.value = ""));
  const messageElement = modalElement.querySelector("#modal-message");
  if (messageElement) {
    messageElement.textContent = "";
  }

  // Focus username field
  const usernameInput = form.querySelector('input[name="username"]');
  if (usernameInput) {
    usernameInput.focus();
  }

  // Set appropriate title
  const title = modalElement.querySelector("h2");
  if (title) {
    title.textContent = type === "login" ? "Login" : "Sign Up";
  }
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
  console.log("Submitting form...");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const messageElement = document.getElementById("modal-message");

  try {
    const result = await authFunction(data);

    const _accessToken = await manageJWT(data, true);

    let userData = await fetchUserProfile(result.id);
    if (!userData.success) {
      if (userData.status === 404 && isOwnProfile) {
        localStorage.clear();
        loadAuthPage();
        return;
      }

      if (userData.error === "NETWORK_ERROR") {
        showToast("Network error. Please check your connection.", "error");
        return;
      }

      throw new Error(userData.message || "Failed to load profile");
    }
    userData = userData.data;
    if (userData.two_factor_enabled && userData.email != "") {
      document.getElementById("login-container").style.display = "none";
      document.getElementById("2fa-container").style.display = "block";

      await startResendTimer();
      resendButtonListener(userData);

      await sendEmailVerification(userData);
      console.log("Email verification sent:");

      twoFaFormListener(result, form);
    } else {
      await handleAuthSuccess(result, form);
    }
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
    displayLogoutError(
      "An error occurred while logging out. Please try again."
    );
  }
}

async function handleAuthSuccess(result, form) {
  const messageElement = document.getElementById("modal-message");

  messageElement.style.color = "white";
  messageElement.innerText = `${
    result.message || "Signup or Login successful! 🎉 Redirecting..."
  }`;

  localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, result.username);
  localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, result.id);
  form.style.display = "none";

  setTimeout(() => {
    closeModal();
    history.pushState({ view: "home" }, "");
    loadHomePage();
  }, 2000);
}

async function startResendTimer() {
  const countdown = document.getElementById("countdown");
  const resendButton = document.getElementById("resend-button");

  resendButton.disabled = true;
  let timeLeft = 60;

  const timer = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    countdown.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      resendButton.disabled = false;
      countdown.textContent = "Code expired";
    }
    timeLeft--;
  }, 1000);
}

function resendButtonListener(userData) {
  document
    .getElementById("resend-button")
    .addEventListener("click", async () => {
      try {
        console.log("Resending email verification...");
        await sendEmailVerification(userData);
        console.log("Email verification sent");
        await startResendTimer(userData);
        showToast("Verification code resent");
      } catch (error) {
        console.error("Error resending email verification:", error);
        showToast("Failed to resend verification code", true);
      }
    });
}

function twoFaFormListener(result, form) {
  document
    .getElementById("2fa-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const code = document.getElementById("code").value.trim();

      try {
        await validateEmailVerification(code);
        console.log("Email verification successful");
        handleAuthSuccess(result, form);
      } catch (error) {
        console.error("Error validating email verification:", error);
        showToast("Verification code is invalid", true);
      }
    });
}
