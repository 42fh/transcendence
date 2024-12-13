import { fetchNotifications } from "../services/chatNotificationService.js";
import { updateNotificationBadge } from "./bottomNav.js";

//Render notifications in the chat home template
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
  const markAllReadElement = document.getElementById("notification-mark-all-read");

  if (!notificationContainer) {
    console.error("Notification container not found in chat home template.");
    return;
  }

  // Clear existing notifications while preserving HTML structure
  Array.from(notificationContainer.children).forEach(child => child.remove());

  try {
    const response = await fetchNotifications();
    const notifications = response.notifications;

    // Update the notification badge with unread count
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    updateNotificationBadge(unreadCount);

    // Handle empty notifications
    if (!notifications || notifications.length === 0) {
      // Optionally, you could add a 'hidden' class or use display:none 
      // to hide elements without removing HTML
      return;
    }

    notifications.forEach(notification => {
      const notificationElement = document.createElement('div');
      notificationElement.classList.add('notification-item');
      notificationElement.classList.add(notification.is_read ? 'is-read' : 'is-unread');
      
      const messageSpan = document.createElement('span');
      messageSpan.classList.add('notification-message');
      messageSpan.textContent = notification.message;

      const dateSpan = document.createElement('span');
      dateSpan.classList.add('notification-date');
      dateSpan.textContent = new Date(notification.created_at).toLocaleString();

      notificationElement.appendChild(messageSpan);
      notificationElement.appendChild(dateSpan);

      notificationContainer.appendChild(notificationElement);
    });

  } catch (error) {
    console.log("Error fetching notifications:", error);
  }
}