import { fetchNotifications } from "../services/chatNotificationService.js";
import { updateNotificationBadge } from "./bottomNav.js";
import { renderModal } from "../components/modal.js";

export async function renderNotifications() {
  const notificationContainer = document.getElementById("chat-notifications");
  const markAllReadElement = document.getElementById(
    "notification-mark-all-read"
  );

  // if (!notificationContainer) {
  //   console.error("Notification container not found.");
  //   return;
  // }

  // Use querySelectorAll to target existing notification items
  const existingNotificationItems =
    notificationContainer.querySelectorAll(".notification-item");
  existingNotificationItems.forEach((item) => item.remove());

  try {
    const response = await fetchNotifications();
    const notifications = response.notifications;

    // Update the notification badge
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    updateNotificationBadge(unreadCount);

    // If no notifications, update an existing "no notifications" element if present
    const noNotificationsElement =
      notificationContainer.querySelector(".no-notifications");
    if (!notifications || notifications.length === 0) {
      if (noNotificationsElement) {
        noNotificationsElement.style.display = "block";
      }
      return;
    } else {
      if (noNotificationsElement) {
        noNotificationsElement.style.display = "none";
      }
    }

    // Iterate through existing notification template items
    notifications.forEach((notification, index) => {
      // Assuming there's a template or placeholder for each notification
      const templateItem =
        notificationContainer.querySelector(
          `.notification-item:nth-child(${index + 1})`
        ) || notificationContainer.querySelector(".notification-item-template");

      if (templateItem) {
        // Set read/unread status
        templateItem.classList.toggle("is-read", notification.is_read);
        templateItem.classList.toggle("is-unread", !notification.is_read);

        // Update type span
        const typeSpan = templateItem.querySelector(".notification-type");
        if (typeSpan) typeSpan.textContent = notification.type;

        // Update date span
        const dateSpan = templateItem.querySelector(".notification-date");
        if (dateSpan)
          dateSpan.textContent = new Date(
            notification.created_at
          ).toLocaleString();

        // Add click event for modal
        templateItem.onclick = () => {
          const modalContent = document.createElement("div");

          if (notification.type === "message") {
            modalContent.innerHTML = `<p>${notification.content}</p>`;
          } else if (notification.type === "invitation-tournament") {
            modalContent.innerHTML = `
              <p>Join the tournament!</p>
              <a href="${notification.content}" target="_blank">Join</a>
            `;
          }

          const contentTemplate = document.createElement("template");
          contentTemplate.innerHTML = modalContent.innerHTML;

          renderModal("modal-template", {
            contentTemplate: contentTemplate,
            submitHandler: null,
          });
        };

        // Ensure the item is visible
        templateItem.style.display = "block";
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
}
