export function addNotificationToContainer(message, type = "info") {
  const notificationContainer = document.getElementById(
    "notification-container"
  );

  //TODO: get rid of createElement
  // Create a new notification element
  const notificationElement = document.createElement("div");
  notificationElement.classList.add("notification", `notification--${type}`);
  notificationElement.textContent = message;

  // Add the notification to the container
  notificationContainer.appendChild(notificationElement);

  // Auto-remove after 5 seconds with a sliding-out animation
  setTimeout(() => {
    notificationElement.style.animation = "slideOut 0.5s ease";
    setTimeout(() => {
      notificationContainer.removeChild(notificationElement);
    }, 500);
  }, 5000);
}

export function setupNotificationListener(wsUrl) {
  if (!wsUrl) {
    console.error("Invalid WebSocket URL");
    addNotificationToContainer(
      "Notification setup failed: Invalid URL",
      "error"
    );
    return null;
  }
  console.log("wsurl:", wsUrl);

  try {
    console.log(wsUrl);
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

        // Check if it's a notification
        if (data.type === "send_notification") {
          addNotificationToContainer(data.notification.message, "info");
        }
      } catch (parseError) {
        console.error("Error parsing WebSocket message:", parseError);
        addNotificationToContainer("Error processing notification", "error");
      }
    };

    notificationSocket.onerror = (error) => {
      console.error("Notification WebSocket error:", error);
      addNotificationToContainer("Notification connection error", "error");
    };

    notificationSocket.onclose = (event) => {
      console.log("Notification WebSocket closed:", event);

      // Attempt to reconnect after a delay
      if (event.code !== 1000) {
        // 1000 is a normal closure
        addNotificationToContainer(
          "Notification connection lost. Reconnecting...",
          "warning"
        );
      }
    };

    return notificationSocket;
  } catch (error) {
    console.error("Fatal error setting up notification listener:", error);
    addNotificationToContainer("Failed to set up notifications", "error");
    return null;
  }
}
