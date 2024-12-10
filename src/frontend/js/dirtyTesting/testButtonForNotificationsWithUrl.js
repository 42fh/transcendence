export function testButtonForNotificationsWithUrl() {
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("TEST-BUTTON");

    if (button) {
      button.addEventListener("click", async () => {
        try {
          // Data for the notification
          const notificationData = {
            message: "TeStInG the notifications with url",
            url: "https://www.google.com/",
          };

          // Send POST request to create notification
          const response = await fetch("/api/chat/notifications/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(notificationData),
          });

          if (!response.ok) {
            throw new Error("Failed to create notification");
          }

          const data = await response.json();
          console.log("Notification created successfully:", data);
          alert("Notification created successfully!");
        } catch (error) {
          console.error("Error creating notification:", error);
          alert("Failed to create notification. Please try again.");
        }
      });
    } else {
      console.error("Button with id TEST-BUTTON not found.");
    }
  });
}
