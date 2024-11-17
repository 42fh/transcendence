export function showNotification(message, type = "info") {
  const notificationContainer = document.getElementById("notification-container");
    console.log("shownotification");
    const notification = document.createElement("div");
    
 // Add  classes like 'success', 'error', 'info'
  notification.classList.add("notification", type);

  notification.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="this.parentElement.remove()">&#10006;</button>
  `;
  notificationContainer.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}
