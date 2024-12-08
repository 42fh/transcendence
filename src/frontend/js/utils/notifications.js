import { showToast } from "./toast.js";
import { updateNotificationBadge } from "../components/bottomNav.js";

export function setupNotificationListener(wsUrl) {
  if (!wsUrl) {
    console.error("Invalid WebSocket URL");
    showToast("Notification setup failed: Invalid URL", true);
    return null;
  }
  // console.log("wsurl:", wsUrl);

  try {
    // console.log(wsUrl);
    if (window.chatSocket) {
      window.chatSocket.close();
    }
    const notificationSocket = new WebSocket(wsUrl);

    notificationSocket.onopen = () => {
      console.log("Notification WebSocket connected");
    };

    notificationSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);

        if (data.type === "send_notification") {
          showToast(data.notification.message, false);

          const unreadCount = data.notification.is_read ? 0 : 1;
          updateNotificationBadge(unreadCount);
        }
      } catch (parseError) {
        console.error("Error parsing WebSocket message:", parseError);
        showToast("Error processing notification", true);
      }
    };

    notificationSocket.onerror = (error) => {
      console.error("Notification WebSocket error:", error);
      showToast("Notification connection error", true);
    };

    notificationSocket.onclose = (event) => {
      console.log("Notification WebSocket closed:", event);

      // Attempt to reconnect after a delay
      if (event.code !== 1000) {
        // 1000 is a normal closure
        showToast("Notification connection lost. Reconnecting...", "warning");
      }
    };

    return notificationSocket;
  } catch (error) {
    console.error("Fatal error setting up notification listener:", error);
    showToast("Failed to set up notifications", true);
    return null;
  }
}
