import { fetchNotifications } from "../services/chatNotificationService.js";
import { updateNotificationBadge } from "../components/bottom-nav.js";

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
  if (!notificationContainer) {
    console.error("Notification container not found in chat home template.");
    return;
  }

  notificationContainer.innerHTML = "";

  try {
    const response = await fetchNotifications();
    const notifications = response.notifications;

    // Update the notification badge with unread count
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    updateNotificationBadge(unreadCount);

    // Handle empty notifications
    if (!notifications || notifications.length === 0) {
      notificationContainer.innerHTML = `
        <p class="notification-empty">No notifications available.</p>
      `;
      return;
    }

    const notificationsHTML = notifications
      .map(
        (notification) => `
      <div class="notification-item ${
        notification.is_read ? "is-read" : "is-unread"
      }">
        <span class="notification-message">${notification.message}</span>
        <span class="notification-date">${new Date(
          notification.created_at
        ).toLocaleString()}</span>
      </div>
    `
      )
      .join("");

    notificationContainer.innerHTML = notificationsHTML;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    notificationContainer.innerHTML = `
      <p class="notification-error">Failed to load notifications. Please try again later.</p>
    `;
  }
}
