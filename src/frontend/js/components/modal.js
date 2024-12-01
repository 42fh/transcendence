/**
 * Renders a modal dialog using two templates:
 * 1. Base Modal Template (modal-template):
 *    - Provides the modal structure (overlay, container, close button)
 *    - Must have elements with IDs: modal-overlay, modal-content, close-modal
 *
 * 2. Content Template (specified by templateId):
 *    - Contains the specific modal content
 *    - Will be inserted into modal-content
 *
 * @param {string} templateId - ID of the template containing modal content
 * @param {Object} options - Modal configuration
 * @param {Function} [options.setup] - Function to populate modal content
 * @param {Function} [options.submitHandler] - Function to handle form submissions
 */

export function renderModal(templateId, options = {}) {
  console.log("Starting renderModal with templateId:", templateId);
  const baseModalTemplate = document.getElementById("modal-template");
  const specificContentTemplate = document.getElementById(templateId);
  if (!baseModalTemplate || !specificContentTemplate) {
    console.error("Modal template or content template not found");
    return;
  }

  // Remove any existing modal
  const existingModalOverlay = document.getElementById("modal-overlay");
  if (existingModalOverlay) {
    existingModalOverlay.remove();
  }

  // Clone and add modal to DOM
  const baseModalNodes = document.importNode(baseModalTemplate.content, true);
  document.body.appendChild(baseModalNodes);
  console.log("Base modal element added to body");

  // Get modal content element and clear it
  const modalContentContainer = document.getElementById("modal-content");
  console.log("Modal content element found:", !!modalContentContainer);
  modalContentContainer.innerHTML = ""; // Clear existing content

  // Clone and append new content
  const specificContentNodes = document.importNode(specificContentTemplate.content, true);
  modalContentContainer.appendChild(specificContentNodes);

  // Run setup function if provided
  if (options.setup) {
    options.setup(modalContentContainer);
  }

  // Add event listeners
  const closeBtn = document.getElementById("close-modal");
  console.log("Close button found:", !!closeBtn);
  closeBtn.addEventListener("click", closeModal);

  const modalOverlay = document.getElementById("modal-overlay");
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Add form handler if provided
  if (options.submitHandler) {
    const form = modalContentContainer.querySelector("form");
    console.log("Form found in modal:", !!form);
    if (form) {
      form.addEventListener("submit", options.submitHandler);
    }
  }
  // Show modal
  modalOverlay.style.visibility = "visible";
  modalOverlay.style.opacity = "1";
  console.log("Modal display complete");
}

export function displayModalError(message) {
  // First try to find the dedicated message element
  let messageElement = document.getElementById("modal-message");

  // If no dedicated message element exists, create one
  if (!messageElement) {
    messageElement = document.createElement("p");
    messageElement.id = "modal-message";
    messageElement.classList.add("modal-message");

    const modalContent = document.getElementById("modal-content");
    if (modalContent) {
      // Insert at the top of modal content
      modalContent.insertBefore(messageElement, modalContent.firstChild);
    }
  }

  // Set the error message and styling
  messageElement.style.color = "var(--color-error)";
  messageElement.textContent = message;
}

export function closeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.remove();
  }
}
