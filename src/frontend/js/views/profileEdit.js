import { fetchUserProfile, updateUserProfile } from "../services/usersService.js";
import { showToast } from "../utils/toast.js";
import { LOCAL_STORAGE_KEYS, ASSETS } from "../config/constants.js";
import { loadProfilePage } from "./profile.js";

export async function loadProfileEditPage() {
  try {
    history.pushState(
      {
        view: "profile-edit",
      },
      ""
    );

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }

    mainContent.innerHTML = '<div class="loading">Loading profile editor...</div>';

    const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
    if (!userId) {
      throw new Error("User ID not found");
    }

    // Fetch current user data
    const userData = await fetchUserProfile(userId);

    // Clone and populate template
    const profileEditTemplate = document.getElementById("profile-edit-template");
    const content = document.importNode(profileEditTemplate.content, true);

    populateFormFields(content, userData);
    setupAvatarUpload(content, userId);
    setupFormValidation(content.querySelector(".profile-edit__form"));
    setupFormSubmission(content.querySelector(".profile-edit__form"), userId);

    mainContent.innerHTML = "";
    mainContent.appendChild(content);
  } catch (error) {
    console.error("Error loading profile edit page:", error);
    showToast("Failed to load profile editor", "error");
  }
}

function populateFormFields(content, userData) {
  content.querySelector(".profile-edit__avatar").src = userData.avatar || ASSETS.IMAGES.DEFAULT_AVATAR;
  content.querySelector('input[name="first_name"]').value = userData.first_name || "";
  content.querySelector('input[name="last_name"]').value = userData.last_name || "";
  content.querySelector('input[name="email"]').value = userData.email || "";
  content.querySelector('input[name="telephone_number"]').value = userData.telephone_number || "";
  content.querySelector('textarea[name="bio"]').value = userData.bio || "";
}

// Helper function for setupAvatarUpload
function handleAvatarUpload(file, avatarButton, avatarImg, userId) {
  if (!file) return;

  return new Promise(async (resolve, reject) => {
    try {
      avatarButton.textContent = "Uploading...";
      avatarButton.disabled = true;

      const avatarUrl = await uploadUserAvatar(userId, file);
      avatarImg.src = avatarUrl;
      showToast("Avatar updated successfully!");
      resolve(avatarUrl);
    } catch (error) {
      showToast("Failed to upload avatar", "error");
      reject(error);
    } finally {
      avatarButton.textContent = "Change Avatar";
      avatarButton.disabled = false;
    }
  });
}

function setupAvatarUpload(content, userId) {
  // TODO: the Avatar button should be an icon from the Google Material Icons library
  const avatarButton = content.querySelector(".profile-edit__avatar-button");
  const avatarImg = content.querySelector(".profile-edit__avatar");
  const avatarInput = document.createElement("input");
  avatarInput.type = "file";
  avatarInput.accept = "image/*";
  avatarInput.style.display = "none";

  avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleAvatarUpload(file, avatarButton, avatarImg, userId);
  });

  avatarButton.addEventListener("click", () => avatarInput.click());
}

function setupFormValidation(form) {
  // Add event listeners to all input and textarea fields
  // TODO: consider renaming with something more specific
  form.querySelectorAll("input, textarea").forEach((input) => {
    // const field = input.name;
    input.addEventListener("blur", () => validateInputField(input));
  });
}

function validateInputField(input) {
  // Note that the input could be also a textarea, or any other input type we search for in the from in the setupFormValidation function
  const field = input.name;
  // validateField in formValidation.js
  const error = validateField(field, input.value);
  // updateFieldError in this file
  updateFieldError(input, error);
  return !error;
}

function updateFieldError(input, error) {
  // TODO: transform this nasty thing in a template

  const errorElement = input.parentElement.querySelector(".profile-edit__error");

  if (error) {
    if (!errorElement) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "profile-edit__error";
      errorDiv.textContent = error;
      input.parentElement.appendChild(errorDiv);
    } else {
      errorElement.textContent = error;
    }
    input.classList.add("profile-edit__input--error");
  } else {
    if (errorElement) errorElement.remove();
    input.classList.remove("profile-edit__input--error");
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

function setupFormSubmission(form, userId) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate all fields
    let hasErrors = false;
    form.querySelectorAll("input, textarea").forEach((input) => {
      if (!validateInputField(input)) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    try {
      setFormLoading(form, true);
      const formData = new FormData(form);
      const updatedData = Object.fromEntries(formData);

      await updateUserProfile(userId, updatedData);
      showToast("Profile updated successfully!");
      loadProfilePage(false);
    } catch (error) {
      showToast("Failed to update profile", "error");
    } finally {
      setFormLoading(form, false);
    }
  });

  // Add cancel button handler
  const cancelButton = form.querySelector(".profile-edit__button--cancel");
  cancelButton.addEventListener("click", () => {
    loadProfilePage(false);
  });
}
