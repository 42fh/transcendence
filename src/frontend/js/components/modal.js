export function renderModal(templateId, options = {}) {
  const modalTemplate = document.getElementById("modal-template");
  const contentTemplate = document.getElementById(templateId);
  if (!modalTemplate || !contentTemplate) {
    console.error("Modal template or content template not found");
    return;
  }

  // Remove any existing modal
  const existingModal = document.getElementById("modal-overlay");
  if (existingModal) {
    existingModal.remove();
  }

  // Clone and add modal to DOM
  const modalElement = document.importNode(modalTemplate.content, true);
  document.body.appendChild(modalElement);

  // Get modal content element and clear it
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = ""; // Clear existing content

  // Clone and append new content
  const contentElement = document.importNode(contentTemplate.content, true);
  modalContent.appendChild(contentElement);

  // Add event listeners
  const closeBtn = document.getElementById("close-modal");
  closeBtn.addEventListener("click", closeModal);

  const modalOverlay = document.getElementById("modal-overlay");
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Add form handler if provided
  if (options.submitHandler) {
    const form = modalContent.querySelector("form");
    if (form) {
      form.addEventListener("submit", options.submitHandler);
    }
  }
  // Show modal
  modalOverlay.style.visibility = "visible";
  modalOverlay.style.opacity = "1";
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
  messageElement.style.color = "var(--color-text-error)";
  messageElement.textContent = message;
}

export function closeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.style.visibility = "hidden";
    modalOverlay.style.opacity = "0";
  }
}
