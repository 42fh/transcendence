import { fetchNotifications } from "../services/chatNotificationService.js";
import { updateNotificationBadge } from "./bottomNav.js";
import { loadGame3D } from "../views/game3d.js";
//Render notifications in the chat home template
export async function renderNotifications() {
  const chatHomeTemplate = document.querySelector("#chat-home-template");
  if (!chatHomeTemplate) {
    console.error("Chat home template not found. Make sure the template is loaded.");
    return;
  }

  const notificationContainer = chatHomeTemplate.content.querySelector("#chat-notifications");
  const markAllReadElement = document.getElementById("notification-mark-all-read");

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
      notificationElement.classList.add(notification.is_read ? "is-read" : "is-unread");

      const messageSpan = document.createElement("span");
      messageSpan.classList.add("notification-message");
      messageSpan.textContent = notification.message;

      const dateSpan = document.createElement("span");
      dateSpan.classList.add("notification-date");
      dateSpan.textContent = new Date(notification.created_at).toLocaleString();

      // Create "Accept" link if URL is present
      console.log("Right before if statement");
      console.log("notification.url", notification.url);
      if (notification.url) {
        console.log("Original URL", notification.url);
        console.log("URL protocol:", notification.url.protocol);
        const acceptButton = document.createElement("button");
        acceptButton.textContent = "Accept";
        acceptButton.classList.add("notification-accept");
        acceptButton.type = "button";

        // Add some basic styling to make sure the button is visible and clickable
        acceptButton.style.cursor = "pointer";
        acceptButton.style.padding = "5px 10px";
        acceptButton.style.margin = "5px";
        acceptButton.style.backgroundColor = "red"; // Temporary visible style
        acceptButton.style.padding = "10px";
        acceptButton.style.zIndex = "1000"; // Make sure it's on top

        // acceptButton.rel = "noopener noreferrer"; // Security best practice
        // acceptButton.addEventListener("click", (e) => {
        //   //   e.preventDefault();
        //   console.log("clicked");
        //   console.log("notification.url", notification.url);
        //   loadGame3D(notification.url);
        //   // Use your SPA router here to handle the navigation
        //   // For example: router.navigate(notification.url)
        // });
        // Using both onclick and addEventListener to debug
        // acceptButton.onclick = () => {
        //   console.log("Button clicked via onclick!");
        //   loadGame3D(notification.url);
        // };
        // Try multiple ways to attach the click handler
        // 1. Direct onclick property
        acceptButton.onclick = () => console.log("Clicked via onclick property");

        // 2. addEventListener
        acceptButton.addEventListener("click", () => console.log("Clicked via addEventListener"));

        // 3. Direct attribute
        // acceptButton.setAttribute("onclick", "console.log('Clicked via attribute')");
        // acceptButton.setAttribute(
        //   "onclick",
        //   `console.log('Button clicked!');
        // 	loadGame3D('${notification.url}');`
        // );
        window.loadGame3D = loadGame3D; // Make it global
        acceptButton.setAttribute(
          "onclick",
          `console.log('Button clicked!'); 
			loadGame3D('${notification.url}');`
        );

        // 4. Add a mousedown event to see if it's registering any interaction
        acceptButton.addEventListener("mousedown", () => console.log("Mouse down on button"));

        // 5. Add pointer events to ensure they're not being blocked
        acceptButton.style.pointerEvents = "auto";
        acceptButton.addEventListener("click", () => console.log("Clicked via addEventListener"));
        notificationElement.appendChild(acceptButton);
        // acceptButton.addEventListener("mouseover", (e) => {
        //   console.log("Mouse over button");
        //   console.log("Target:", e.target);
        //   console.log("Current target:", e.currentTarget);
        // });
      }

      notificationElement.appendChild(messageSpan);
      notificationElement.appendChild(dateSpan);

      notificationContainer.appendChild(notificationElement);
    });
  } catch (error) {
    console.log("Error fetching notifications:", error);
  }
}
