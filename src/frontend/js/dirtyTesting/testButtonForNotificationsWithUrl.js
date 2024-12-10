export function testButtonForNotificationsWithUrl() {
  // Remove the DOMContentLoaded wrapper
  const button = document.getElementById("TEST-BUTTON");

  if (button) {
    // Remove any existing click listeners to prevent multiple attachments
    button.removeEventListener("click", handleButtonClick);
    button.addEventListener("click", handleButtonClick);
    console.log("Button event listener added");
  } else {
    console.error("Button with id TEST-BUTTON not found.");
  }
}

async function handleButtonClick() {
  console.log("Button clicked");
  try {
    const notificationData = {
      message: "TeStInG the notifications with url",
      url: "https://www.google.com/",
    };
    console.log("notificationData:", notificationData);

    const response = await fetch("/api/chat/notifications/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      console.log("encountered an error");
      throw new Error("Failed to create notification");
    }

    const data = await response.json();
    console.log("Notification created successfully:", data);
    alert("Notification created successfully!");
  } catch (error) {
    console.error("Error creating notification:", error);
    alert("Failed to create notification. Please try again.");
  }
}