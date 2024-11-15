export function initModalListeners() {
  // Close button listener
  document.getElementById("close-modal").addEventListener("click", () => {
    closeModal();
  });

  // Click outside modal listener
  document.addEventListener("click", (e) => {
    const modalOverlay = document.getElementById("modal-overlay");
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

export function displayErrorMessageModalModal(message) {
  const modalContent = document.getElementById("modal-content");
  const errorElement = document.createElement("p");
  errorElement.style.color = "red";
  errorElement.textContent = message;
  modalContent.innerHTML = "";
  modalContent.appendChild(errorElement);
}

// Function to fill the modal content (title and body)
export function fillModalContent(templateId, options = {}) {
  const template = document.getElementById(templateId);
  const modalContent = document.getElementById("modal-content");

  // Clear current content
  modalContent.innerHTML = "";

  // Clone and append template content to the modal
  if (template) {
    const content = document.importNode(template.content, true);
    modalContent.appendChild(content);

    // If there's a form and submitHandler provided, attach the event listener
    if (options.submitHandler) {
      const form = modalContent.querySelector("form");
      if (form) {
        form.addEventListener("submit", options.submitHandler);
      }
    }
  }
}

export function openModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.style.visibility = "visible";
    modalOverlay.style.opacity = "1";
  }
}

export function closeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.style.visibility = "hidden";
    modalOverlay.style.opacity = "0";
  }
}
