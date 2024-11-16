export function showNotification(message, type = "info") {
  const notificationContainer = document.getElementById("notification-container");

  const notification = document.createElement("div");
  notification.classList.add("notification", type); // Add type classes like 'success', 'error', 'info'

  notification.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="this.parentElement.remove()">&#10006;</button>
  `;
  notificationContainer.appendChild(notification);

  // Automatically remove notification after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}
