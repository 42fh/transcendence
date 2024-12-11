import { sendUserOnlineStatus } from "../services/usersService.js";

let lastStatus = null; // Tracks the last sent online/offline status
let lastExpirationTimestamp = 0; // Tracks the last sent expiration timestamp
const EXPIRATION_INTERVAL = 60000; // Expiration interval in milliseconds (1 minute)
const PING_BUFFER = 5000; // Buffer time before expiration to ensure timely updates (5 seconds)

export function checkUserStatus() {
  const isOnline =
    document.visibilityState === "visible" && // Tab is in foreground
    document.hasFocus() && // Window is focused
    navigator.onLine; // Internet connection is available

  const currentTimestamp = Date.now();
  const expirationNear = lastExpirationTimestamp - currentTimestamp <= PING_BUFFER;

  // Check if status has changed or expiration is near
  if (isOnline !== lastStatus || expirationNear) {
    lastStatus = isOnline;

    // Calculate and update the new expiration timestamp
    const newExpirationTimestamp = currentTimestamp + EXPIRATION_INTERVAL;
    lastExpirationTimestamp = newExpirationTimestamp;

    // Notify the server based on the current status
    if (isOnline) {
      console.log("User is online");
      sendUserOnlineStatus(isOnline, newExpirationTimestamp); // Notify online
    } else {
      console.log("User is offline");
      sendUserOnlineStatus(isOnline, newExpirationTimestamp); // Notify offline
    }
  }
}

// Add this to your initialization code (e.g., in main.js or app.js)
export function initializeOnlineStatusTracking() {
  // Check status initially
  checkUserStatus();

  // Check when visibility changes
  document.addEventListener("visibilitychange", checkUserStatus);

  // Check when online/offline status changes
  window.addEventListener("online", checkUserStatus);
  window.addEventListener("offline", checkUserStatus);

  // Check when window focus changes
  window.addEventListener("focus", checkUserStatus);
  window.addEventListener("blur", checkUserStatus);

  // Periodic check (every 30 seconds)
  setInterval(checkUserStatus, 30000);

  // Check before page unload
  window.addEventListener("beforeunload", () => {
    sendUserOnlineStatus(false, Date.now());
  });
}
