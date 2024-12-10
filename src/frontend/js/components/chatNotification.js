import { fetchNotifications } from "../services/chatNotificationService.js";
import { updateNotificationBadge } from "./bottomNav.js";

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
  const noNotificationsContainer =
    chatHomeTemplate.content.querySelector("#no-notifications");

  if (!notificationContainer) {
    console.error("Notification container not found in chat home template.");
    return;
  }

  // Clear existing notifications while preserving HTML structure
  Array.from(notificationContainer.children).forEach((child) => child.remove());

  try {
    const response = await fetchNotifications();
    const notifications = response.notifications;

    // Update the notification badge
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    updateNotificationBadge(unreadCount);

    // Handle empty notifications
    if (!notifications || notifications.length === 0) {
      noNotificationsContainer.style.display = "block";
      return;
    } else {
      noNotificationsContainer.style.display = "none";
    }

    notifications.forEach((notification) => {
      const notificationElement = document.createElement("div");
      notificationElement.classList.add("notification-item");
      notificationElement.classList.add(
        notification.is_read ? "is-read" : "is-unread"
      );

      const typeSpan = document.createElement("span");
      typeSpan.classList.add("notification-type");
      typeSpan.textContent = notification.type;

      const dateSpan = document.createElement("span");
      dateSpan.classList.add("notification-date");
      dateSpan.textContent = new Date(notification.created_at).toLocaleString();

      notificationElement.appendChild(typeSpan);
      notificationElement.appendChild(dateSpan);

      notificationContainer.appendChild(notificationElement);
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
}
