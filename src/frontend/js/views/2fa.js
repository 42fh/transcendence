import {
  fetchUserProfile,
  updateUserProfile,
} from "../services/usersService.js";
import { showToast } from "../utils/toast.js";
import { LOCAL_STORAGE_KEYS, ASSETS } from "../config/constants.js";
import { loadProfilePage } from "./profile.js";
import {
  setupFormValidation,
  validateFormField,
} from "../utils/formValidation.js";
import { closeModal, renderModal } from "../components/modal.js";
import { startResendTimer, resendButtonListener } from "./auth.js";
import {
  sendEmailVerification,
  validateEmailVerification,
} from "../services/authService.js";

export async function load2FAPage() {
  try {
    history.pushState(
      {
        view: "2fa-edit",
      },
      ""
    );

    const mainContent = document.getElementById("main-content");
    if (!mainContent) throw new Error("Main content element not found");

    // TODO: fix this nasty thing
    mainContent.innerHTML =
      '<div class="loading">Loading profile editor...</div>';

    const profileEditTemplate = document.getElementById("2fa-edit-template");
    if (!profileEditTemplate)
      throw new Error("Profile edit template not found");

    const content = document.importNode(profileEditTemplate.content, true);
    mainContent.innerHTML = "";
    mainContent.appendChild(content);
    const form = mainContent.querySelector(".profile-edit__form");
    if (!form) throw new Error("Form element not found in DOM");

    if (!form) {
      throw new Error("Form element not found in template");
    }

    const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
    if (!userId) throw new Error("User ID not found");

    const result = await fetchUserProfile(userId);

    if (!result.success) {
      if (result.status === 404) {
        localStorage.clear();
        showToast("Session expired. Please login again.", "error");
        loadAuthPage();
        return;
      }

      if (result.error === "NETWORK_ERROR") {
        showToast("Network error. Please check your connection.", "error");
        loadHomePage();
        return;
      }

      throw new Error(result.message || "Failed to load profile data");
    }
    const userData = result.data;
    console.log("User data fetched:", userData);

    if (!userData.email || userData.email == "") {
      document.querySelector(".email-not-set").style.display = "block";
      document.querySelector(".radio-form").style.display = "none";
    } else {
      document.querySelector(".email-not-set").style.display = "none";
      document.querySelector(".radio-form").style.display = "block";
    }

    if (!userData.email_verified || userData.email_verified == false) {
      document.querySelector(".email-not-verified").style.display = "block";
      document.querySelector(".radio-form").style.display = "none";
    } else {
      document.querySelector(".email-not-verified").style.display = "none";
      document.querySelector(".radio-form").style.display = "block";
    }

    populateFormFields(mainContent, userData);
    setupFormValidation(form);
    setupFormSubmission(form, userId, userData);
  } catch (error) {
    showToast("Failed to load profile editor", "error");
  }
}

function populateFormFields(content, userData) {
  console.log("Populating form fields with user data:", userData);
  content.querySelector('input[name="email"]').value = userData.email || "";
  const twoFactorValue =
    userData.two_factor_enabled === true ? "enabled" : "disabled";
  const radioButton = content.querySelector(
    `input[name="2fa"][value="${twoFactorValue}"]`
  );
  if (radioButton) {
    radioButton.checked = true;
  }
}

function setFormLoading(form, isLoading) {
  const submitButton = form.querySelector('button[type="submit"]');
  const inputs = form.querySelectorAll("input, textarea");

  if (isLoading) {
    submitButton.textContent = "Saving...";
    submitButton.disabled = true;
    inputs.forEach((input) => (input.disabled = true));
  } else {
    submitButton.textContent = "Save";
    submitButton.disabled = false;
    inputs.forEach((input) => (input.disabled = false));
  }
}

async function handleFormSubmission(form, userId) {
  let hasErrors = false;
  form.querySelectorAll("input, textarea").forEach((input) => {
    const error = validateFormField(input);
    if (error) {
      console.log("Form field error:", error);
      hasErrors = true;
      updateFieldError(input, error);
    }
  });

  if (hasErrors) {
    showToast("Please fix the errors in the form", "error");
    return;
  }
  try {
    setFormLoading(form, true);
    const formInputs = form.querySelectorAll(
      "input:not([type='radio']), textarea"
    );
    const updatedDataFromInputs = {};

    formInputs.forEach((input) => {
      updatedDataFromInputs[input.name] = input.value.trim();
    });

    form.querySelectorAll("input[type='radio']:checked").forEach((radio) => {
      updatedDataFromInputs.two_factor_enabled =
        radio.value == "enabled" ? "True" : "False";
    });

    console.log("Data collected via querySelector:", updatedDataFromInputs);

    const dataToSend = updatedDataFromInputs;
    if (!dataToSend.email || dataToSend.email == "") {
      dataToSend.email_verified = false;
      dataToSend.two_factor_enabled = false;
    }

    if (Object.keys(dataToSend).length === 0) {
      console.warn("No data to update");
      showToast("No changes to save", "warning");
      return;
    }
    await updateUserProfile(userId, dataToSend);
    showToast("Profile updated successfully!");
    loadProfilePage(userId, false);
  } catch (error) {
    console.error("Error during form submission:", error);
    showToast("Failed to update profile", "error");
  } finally {
    setFormLoading(form, false);
  }
}

// Setup event listeners for form submission
function setupFormSubmission(form, userId, userData = {}) {
  if (!form) {
    console.error("Form element not found");
    return;
  }

  // Add event listners to cancel button, verify and save button
  const cancelButton = form.querySelector(".profile-edit__button--cancel");

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      loadProfilePage(userId, false);
    });
  }

  const verifyButton = form.querySelector(
    ".profile-edit__button--verify-email"
  );

  if (verifyButton) {
    verifyButton.addEventListener("click", async () => {
      const email = form.querySelector('input[name="email"]').value;
      console.log("Verifying email:", email);
      renderModal("2fa-template", {
        isFormModal: false,
        setup: () => {},
        submitHandler: {},
      });

      await startResendTimer();
      resendButtonListener(userData);

      await sendEmailVerification(userData);
      console.log("Email verification sent:");

      twoFaFormListener();
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    handleFormSubmission(form, userId);
  });
}

function twoFaFormListener() {
  document.getElementById("2fa-verify").addEventListener("click", async () => {
    event.preventDefault();

    const code = document.getElementById("code").value.trim();

    try {
      await validateEmailVerification(code);
      console.log("Email verification successful");
      showToast("Email verified successfully");
      closeModal();
      document.querySelector(".email-not-verified").style.display = "none";
    } catch (error) {
      console.error("Error validating email verification:", error);
      showToast("Verification code is invalid", true);
    }
  });
}
