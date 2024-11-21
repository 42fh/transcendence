import { displayLogoutError } from "../utils/errors.js";
import { closeModal } from "../components/modal.js";
import { loadHomePage } from "./home.js";
import { LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottom-nav.js";
import { loginUser, signupUser, logoutUser } from "../services/authService.js";

// Event listeners initialization
function initAuthListeners() {
  document.getElementById("login-button").addEventListener("click", () => {
    renderModal("login-template", {
      //   submitHandler: (event) => handleFormSubmitSignupLogin(event, "/api/users/auth/login/"),
      submitHandler: handleLogin,
    });
  });

  document.getElementById("signup-button").addEventListener("click", () => {
    renderModal("signup-template", {
      //   submitHandler: (event) => handleFormSubmitSignupLogin(event, "/api/users/auth/signup/"),
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
      updateActiveNavItem("auth");
    }

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
    messageElement.style.color = "var(--color-text-error)";
    messageElement.innerText = error.message;
    console.error("Error submitting form:", error);
    displayModalError("There was an issue submitting the form. Please try again.");
  }
}

// async function handleFormSubmitSignupLogin(event, endpoint) {
//   event.preventDefault();

//   console.log("window.location.origin", window.location.origin);
//   console.log("endpoint: ", endpoint);
//   const baseUrl = ""; // This is empty which implies fetch will use the relative path
//   const fullEndpoint = `${baseUrl}${endpoint}`;
//   const form = event.target;
//   const formData = new FormData(form);
//   const messageElement = document.getElementById("modal-message");
//   const data = Object.fromEntries(formData);
//   try {
//     const response = await fetch(fullEndpoint, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     });
//     console.log("Response Status:", response.status);
//     let result;
//     try {
//       result = await response.json();
//       console.log("Success Result:", result);
//     } catch (err) {
//       console.error("Expected JSON, received something else", err);
//       result = {}; // Ensure result is defined even if parsing fails
//     }
//     if (response.ok) {
//       if (messageElement && result && result.message) {
//         messageElement.style.color = "white";
//         messageElement.innerText = `${result.message || "Signup or Login successful! 🎉 Redirecting..."}`;
//       } else {
//         console.warn("Element with id 'modal-message' not found in the DOM or result.message is undefined.");
//       }
//       console.log("result", result);
//       localStorage.setItem(LOCAL_STORAGE_KEYS.USERNAME, result.username);
//       localStorage.setItem(LOCAL_STORAGE_KEYS.USER_ID, result.id);
//       form.style.display = "none";
//       setTimeout(() => {
//         closeModal();
//         history.pushState({ view: "home" }, "");
//         loadHomePage();
//       }, 2000);
//     } else {
//       const errorResult = await response.json();
//       displayModalError(errorResult.error || "An error occurred.");
//     }
//   } catch (error) {
//     console.error("Error submitting form:", error);
//     displayModalError("There was an issue submitting the form. Please try again.");
//   }
// }

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
