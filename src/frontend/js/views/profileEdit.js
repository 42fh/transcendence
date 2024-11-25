import { fetchUserProfile, updateUserProfile, uploadUserAvatar } from "../services/usersService.js";
import { showToast } from "../utils/toast.js";
import { LOCAL_STORAGE_KEYS, ASSETS } from "../config/constants.js";
import { loadProfilePage } from "./profile.js";
import { setupFormValidation, validateFormField } from "../utils/formValidation.js";

export async function loadProfileEditPage() {
  try {
    history.pushState(
      {
        view: "profile-edit",
      },
      ""
    );

    const mainContent = document.getElementById("main-content");
    if (!mainContent) throw new Error("Main content element not found");

    // TODO: fix this nasty thing
    mainContent.innerHTML = '<div class="loading">Loading profile editor...</div>';

    const profileEditTemplate = document.getElementById("profile-edit-template");
    if (!profileEditTemplate) throw new Error("Profile edit template not found");

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

    const userData = await fetchUserProfile(userId);
    console.log("User data fetched:", userData);

    populateFormFields(mainContent, userData);
    setupAvatarUpload(mainContent, userId);
    setupFormValidation(form);
    setupFormSubmission(form, userId);
  } catch (error) {
    showToast("Failed to load profile editor", "error");
  }
}

function populateFormFields(content, userData) {
  // content is now mainContent so to say
  console.log("Populating form fields with user data:", userData);

  // Add defensive check for avatar
  const avatarImg = content.querySelector(".profile-edit__avatar");
  if (avatarImg) {
    // console.log("Avatar image found");
    // console.log("Avatar URL from userData:", userData.avatar); // Add this log
    avatarImg.src = userData.avatar || ASSETS.IMAGES.DEFAULT_AVATAR; // Use the same constant as profile.js
    // console.log("Set avatar src to:", avatarImg.src); // Add this log
  } else {
    console.log("Avatar image not found");
  }

  content.querySelector('input[name="username"]').value = userData.username || "";
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
  console.log("Handling form submission");

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
    console.log("Starting form submission");
    setFormLoading(form, true);
    // Approach 1: querySelector
    console.log("--- Approach 1: querySelector ---");

    const formInputs = form.querySelectorAll("input, textarea");
    const updatedDataFromInputs = {};

    formInputs.forEach((input) => {
      console.log(`Reading input ${input.name}:`, {
        value: input.value,
        name: input.name,
        id: input.id,
      });

      if (input.value && input.value.trim() !== "") {
        updatedDataFromInputs[input.name] = input.value.trim();
      }
    });
    console.log("Data collected via querySelector:", updatedDataFromInputs);

    // Approach 2: FormData
    console.log("--- Approach 2: FormData ---");
    console.log("Form being used:", form);
    console.log("Form valid?", form.checkValidity());
    console.log("Form elements count:", form.elements.length);
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
    console.log("Server response:", response);
    showToast("Profile updated successfully!");
    loadProfilePage(false);
  } catch (error) {
    console.error("Error during form submission:", error);
    showToast("Failed to update profile", "error");
  } finally {
    setFormLoading(form, false);
  }
}

// Setup event listeners for form submission
function setupFormSubmission(form, userId) {
  console.log("Setting up form submission");
  if (!form) {
    console.error("Form element not found");
    return;
  }

  console.log("Form:", form);

  // Debug form values
  console.log("Debugging form values");
  const formElements = form.elements;
  for (let i = 0; i < formElements.length; i++) {
    const element = formElements[i];
    if (element.name) {
      console.log(`${element.name}: ${element.value}`);
    }
  }

  // Add event listners to cancel button and save button
  const cancelButton = form.querySelector(".profile-edit__button--cancel");

  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      loadProfilePage(false);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    handleFormSubmission(form, userId);
  });
}
