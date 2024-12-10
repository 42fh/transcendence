import { fetchNotifications } from "../services/chatNotificationService.js";
import { updateNotificationBadge } from "./bottomNav.js";
import { renderModal } from "../components/modal.js";


  export async function renderNotifications() {
    const notificationContainer = document.getElementById("chat-notifications");
    const markAllReadElement = document.getElementById("notification-mark-all-read");
  
    if (!notificationContainer) {
      console.error("Notification container not found.");
      return;
    }
  
    // Handle Mark All Read
    if (markAllReadElement) {
      markAllReadElement.onclick = async () => {
        try {
          await markAllAsRead(); // Implement this function to mark all notifications as read in the backend.
          renderNotifications(); // Re-render notifications after marking all as read
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      };
    }
  
    try {
      const response = await fetchNotifications();
      const notifications = response.notifications;
      console.log("printing the result of fetch: ", response);
  
      // Update the notification badge
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      updateNotificationBadge(unreadCount);
  
      const noNotificationsElement = notificationContainer.querySelector(".no-notifications");
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
  
      notifications.forEach((notification, index) => {
        const templateItem =
          notificationContainer.querySelector(
            `.notification-item:nth-child(${index + 1})`
          ) ||
          notificationContainer.querySelector(".notification-item-template");
  
        if (!templateItem) {
          console.error("Notification item template not found.");
          return; // Exit if the template item is missing
        }
  
        // Set read/unread status
        templateItem.classList.toggle("is-read", notification.is_read);
        templateItem.classList.toggle("is-unread", !notification.is_read);
  
        // Update type span
        const typeSpan = templateItem.querySelector(".notification-type");
        if (typeSpan) typeSpan.textContent = notification.type;
  
        // Update date span
        const dateSpan = templateItem.querySelector(".notification-date");
        if (dateSpan)
          dateSpan.textContent = new Date(notification.created_at).toLocaleString();
  
          templateItem.onclick = () => {
            const modalContent = document.createElement("div");
        
            if (notification.type === "message") {
                modalContent.innerHTML = `<p>${notification.content}</p>`;
            } else if (notification.type === "invitation-tournament") {
                modalContent.innerHTML = `
                    <p>Join the tournament!</p>
                    <a href="${notification.content}" target="_blank">Join</a>`;
            } else if (notification.type === "default_type") {
                modalContent.innerHTML = `
                    <p>beautiful modal!</p>
                    <a>This was created and migrated, before the new type of notifications</a>`;
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
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }
  

// Helper function to mark all notifications as read
async function markAllAsRead() {
  try {
    await fetchNotifications({ markAllRead: true });
    console.log("All notifications marked as read.");
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
}
