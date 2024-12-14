import { sendUserOnlineStatus } from "../services/usersService.js";
import { fetchUserOnlineStatus } from "../services/usersService.js";

let lastStatus = null; // Tracks the last sent online/offline status
let lastExpirationTimestamp = 0; // Tracks the last sent expiration timestamp
const EXPIRATION_INTERVAL = 60000; // Expiration interval in milliseconds (1 minute)
const PING_BUFFER = 5000; // Buffer time before expiration to ensure timely updates (5 seconds)
let currentPollingCleanup = null;

/**
 * Checks and updates the user's online status on the server.
 * This function:
 * 1. Determines if user is online based on:
 *    - Tab visibility (document.visibilityState)
 *    - Window focus (document.hasFocus)
 *    - Internet connection (navigator.onLine)
 * 2. Sends this status to the server with an expiration timestamp
 *
 * @returns {void}
 *
 * @example
 * checkUserStatus(); // Will send current status to server
 */
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

/**
 * Sets up all event listeners to track user's online status.
 * This function initializes continuous status tracking by:
 * 1. Doing initial status check
 * 2. Setting up listeners for:
 *    - Tab visibility changes
 *    - Online/offline status
 *    - Window focus
 * 3. Starting periodic status checks
 * 4. Setting up cleanup on page unload
 *
 * Should be called once when app initializes
 *
 * @returns {void}
 *
 * @example
 * // In main.js or app initialization
 * initializeOnlineStatusTracking();
 */
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

export function updateOnlineStatus(status) {
  const statusElement = document.querySelectorAll(".profile__online-status");

  // Remove all status classes
  statusElement.forEach((element) => {
    element.classList.remove(
      "profile__online-status--online",
      "profile__online-status--offline",
      "profile__online-status--away"
    );
  });

  statusElement.forEach((element) => {
    element.classList.add(`profile__online-status--${status}`);
  });
}

/**
 * Starts polling for a user's online status and updates the UI accordingly.
 * This function handles:
 * 1. Cleanup of any existing polling
 * 2. Initial status check
 * 3. Regular status updates
 * 4. Status change detection to prevent unnecessary UI updates
 *
 * @returns {Promise<Function>} A cleanup function that stops the polling when called
 *
 * @example
 * // Start polling for a user's status
 * const cleanup = await startOnlineStatusPolling('123');
 *
 * // Later, clean up when done
 * cleanup();
 *
 * @example
 * // In a component/page
 * startOnlineStatusPolling(userId).then(cleanup => {
 *   // Store cleanup for later use
 *   this.cleanup = cleanup;
 * });
 *
 * @throws {Error} If the status fetch fails
 *
 * @see {@link fetchUserOnlineStatus} for the API call
 * @see {@link updateOnlineStatus} for the UI update function
 */

export async function startOnlineStatusPolling() {
  // Clean up any existing polling
  if (currentPollingCleanup) {
    currentPollingCleanup();
  }
  let currentStatus = null;

  const pollStatus = async () => {
    const isOnline = await fetchUserOnlineStatus();
    const newStatus = isOnline ? "online" : "offline";

    // Only update if status has changed
    if (currentStatus !== newStatus) {
      currentStatus = newStatus;
      updateOnlineStatus(newStatus);
    }
  };

  // Initial check
  await pollStatus();

  // Poll every 30 seconds
  const intervalId = setInterval(pollStatus, 30000);

  const cleanup = () => {
    clearInterval(intervalId);
    currentPollingCleanup = null;
  };

  currentPollingCleanup = cleanup;

  // Return cleanup function
  return cleanup;
}

// Export function to stop polling
export function stopOnlineStatusPolling() {
  if (currentPollingCleanup) {
    currentPollingCleanup();
  }
}
