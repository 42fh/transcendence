export function showToast(message, isError = false) {
  try {
    const template = document.getElementById("toast-template");
    if (!template) {
      throw new Error("Toast template not found");
    }

    const toast = document.importNode(template.content, true);
    const messageElement = toast.querySelector(".toast-message");

    if (!messageElement) {
      throw new Error("Toast message element not found in template");
    }

    messageElement.textContent = message;

    if (isError) {
      messageElement.style.color = "red";
    }

    document.body.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
      const toastElement = document.querySelector(".toast-container");
      if (toastElement) {
        toastElement.remove();
      }
    }, 2000);
  } catch (error) {
    console.error("Error showing toast:", error);
    // Fallback to console
    console.log(`${isError ? "Error" : "Message"}: ${message}`);
  }
}
