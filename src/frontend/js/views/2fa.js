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

    if (userData.email == null || userData.email == "") {
      document.querySelector(".email-warning").style.display = "block";
      document.querySelector(".radio-form").style.display = "none";
    } else {
      document.querySelector(".email-warning").style.display = "none";
      document.querySelector(".radio-form").style.display = "block";
    }

    populateFormFields(mainContent, userData);
    setupFormValidation(form);
    setupFormSubmission(form, userId);
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
    // Approach 1: querySelector
    console.log("--- Approach 1: querySelector ---");

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

    // Approach 2: FormData
    console.log("--- Approach 2: FormData ---");
    // Try both ways to create FormData
    const formData = new FormData(form);
    const manualFormData = new FormData();
    form.querySelectorAll("input, textarea").forEach((input) => {
      console.log(`Adding to manual FormData: ${input.name} = ${input.value}`);
      manualFormData.append(input.name, input.value);
    });
    const updatedDataFromFormData = {};

    // FormData don't have a .forEach method, so we need to iterate over its entries
    // ... and it doesn't output directly to the console, so we need to log it separately
    console.log("FormData:");
    console.log(formData);
    console.log("form.elements:");
    console.log(form.elements);

    console.log("Original FormData entries:");
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}: '${pair[1]}'`);
    }

    console.log("Manual FormData entries:");
    for (let pair of manualFormData.entries()) {
      console.log(`${pair[0]}: '${pair[1]}'`);
    }

    console.log("Collecting form data");
    formData.forEach((value, key) => {
      console.log(`Field ${key}:`, {
        value: value,
        trimmed: value.trim(),
        length: value.trim().length,
      });
      if (value.trim() !== "") {
        updatedDataFromFormData[key] = value.trim();
      }
    });
    console.log("Data collected via FormData:", updatedDataFromFormData);

    // Compare results
    console.log("--- Comparing Results ---");
    console.log("querySelector approach:", updatedDataFromInputs);
    console.log("FormData approach:", updatedDataFromFormData);

    const dataToSend = updatedDataFromInputs;

    if (Object.keys(dataToSend).length === 0) {
      console.warn("No data to update");
      showToast("No changes to save", "warning");
      return;
    }
    const response = await updateUserProfile(userId, dataToSend);
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
function setupFormSubmission(form, userId) {
  if (!form) {
    console.error("Form element not found");
    return;
  }

  // Add event listners to cancel button and save button
  const cancelButton = form.querySelector(".profile-edit__button--cancel");

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      loadProfilePage(userId, false);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    handleFormSubmission(form, userId);
  });
}
