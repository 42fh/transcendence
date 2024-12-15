import { fetchNotifications } from "../services/chatNotificationService.js";
import { updateNotificationBadge } from "./bottomNav.js";
import { loadGame3D } from "../views/game3d.js";
//Render notifications in the chat home template

window.loadGame3D = loadGame3D;

export async function renderNotifications() {
  const chatHomeTemplate = document.querySelector("#chat-home-template");
  if (!chatHomeTemplate) {
    console.error(
      "Chat home template not found. Make sure the template is loaded."
    );
    return;
  }

  const notificationContainer = chatHomeTemplate.content.querySelector(
    "#chat-notifications"
  );
  const markAllReadElement = document.getElementById(
    "notification-mark-all-read"
  );

  if (!notificationContainer) {
    console.error("Notification container not found in chat home template.");
    return;
  }

  // Clear existing notifications while preserving HTML structure
  Array.from(notificationContainer.children).forEach((child) => child.remove());

  try {
    const response = await fetchNotifications();
    const notifications = response.notifications;

    // Update the notification badge with unread count
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    updateNotificationBadge(unreadCount);

    // Handle empty notifications
    if (!notifications || notifications.length === 0) {
      return;
    }

    notifications.forEach((notification) => {
      const notificationElement = document.createElement("div");
      notificationElement.classList.add("notification-item");
      notificationElement.classList.add(
        notification.is_read ? "is-read" : "is-unread"
      );

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("notification-message");
      messageSpan.textContent = notification.message;

      const dateSpan = document.createElement("span");
      dateSpan.classList.add("notification-date");
      dateSpan.textContent = new Date(notification.created_at).toLocaleString();

      if (notification.url) {
        const acceptButton = document.createElement("button");
        acceptButton.textContent = "Accept";
        acceptButton.classList.add("notification-accept");
        acceptButton.type = "button";
        acceptButton.setAttribute(
          "onclick",
          `console.log('Button clicked!'); 
           loadGame3D('${notification.url}');`
        );

        acceptButton.onclick = () => {
          loadGame3D(notification.url);
        };

        acceptButton.style.pointerEvents = "auto";
        acceptButton.addEventListener("click", () =>
          console.log("Clicked via addEventListener")
        );
        notificationElement.appendChild(acceptButton);
      }

      notificationElement.appendChild(messageSpan);
      notificationElement.appendChild(dateSpan);

      notificationContainer.appendChild(notificationElement);
    });
  } catch (error) {
    console.log("Error fetching notifications:", error);
  }
}
