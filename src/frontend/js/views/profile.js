import { fetchUserProfile, formatWinRatio, renderMatchHistory } from "../services/usersService.js";
import { handleLogout } from "./auth.js";
import { toggleBlockUser } from "../services/blockService.js";
import { isUserBlockedByCurrentUser } from "../services/blockService.js";
import { showToast } from "../utils/toast.js";
import { ASSETS, LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { updateActiveNavItem } from "../components/bottomNav.js";
import { loadHomePage } from "./home.js";
import { loadProfileEditPage } from "./profileEdit.js";
import { applyUsernameTruncation } from "../utils/strings.js";
import { loadUsersPage } from "./users.js";
import {
  sendFriendRequest,
  removeFriend,
  acceptFriendRequest,
  withdrawFriendRequest,
  rejectFriendRequest,
} from "../services/friendshipService.js";
import { renderModal, closeModal } from "../components/modal.js";
import { load2FAPage } from "./2fa.js";
import { inviteFriend } from "../services/gameWithFriendService.js";
import { loadChatRoom } from "./chatRoom.js";

export async function loadProfilePage(userId = null, addToHistory = true) {
  const loggedInUserId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  if (!loggedInUserId) {
    localStorage.clear();
    loadAuthPage();
    return;
  }

  // If no userId is provided, use currentUserId (own profile)
  const targetUserId = userId === undefined ? loggedInUserId : userId;

  if (!targetUserId) {
    throw new Error("User ID not found");
  }
  const isOwnProfile = targetUserId === loggedInUserId;
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "profile",
          userId: targetUserId,
        },
        ""
      );
      updateActiveNavItem(isOwnProfile ? "profile" : null);
    }
    if (!addToHistory) updateActiveNavItem("profile");

    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      throw new Error("Main content element not found");
    }
    // TODO: Make it beautiful
    mainContent.innerHTML = '<div class="loading">Loading profile...</div>';

    // Fetch result and handle errors
    const result = await fetchUserProfile(targetUserId);

    if (!result.success) {
      if (result.status === 404 && isOwnProfile) {
        localStorage.clear();
        loadAuthPage();
        return;
      }

      if (result.error === "NETWORK_ERROR") {
        showToast("Network error. Please check your connection.", "error");
        return;
      }

      throw new Error(result.message || "Failed to load profile");
    }

    const userData = result.data;
    if (!userData) {
      if (isOwnProfile) {
        // If user doesn't exist, clear localStorage and redirect to auth
        // We redirect only in the case that the user is trying to check his own profile but for some reason hte userId is not set.
        localStorage.clear();
        loadAuthPage();
        return;
      }
      throw new Error("User not found");
    }

    // Clone and populate template
    const profileTemplate = document.getElementById("profile-template");
    const content = document.importNode(profileTemplate.content, true);

    // Add the appropriate class to control visibility on the child classes
    content.querySelector(".profile").classList.add(isOwnProfile ? "profile--private" : "profile--public");
    // Populate all profile data
    populateProfileHTML(content, userData, isOwnProfile);

    // Add content to main container and render match history
    mainContent.innerHTML = "";
    mainContent.appendChild(content);
    const matchesContainer = mainContent.querySelector(".profile__matches-list");
    renderMatchHistory(userData.recent_matches, matchesContainer);

    // Add edit button handler only for own profile
    if (isOwnProfile) {
      const editButton = mainContent.querySelector(".profile__button--edit");
      if (editButton) {
        editButton.addEventListener("click", () => {
          loadProfileEditPage(userData);
        });
      }
      // Add 2FA button handler
      const TwoFAButton = mainContent.querySelector(".profile__button--2fa");
      TwoFAButton.addEventListener("click", () => {
        console.log("2FA button clicked");
        load2FAPage(userData);
      });
      // Add logout button handler
      const logoutButton = mainContent.querySelector(".profile__button--logout");
      if (logoutButton) {
        logoutButton.addEventListener("click", handleLogout);
      }
    }

    // TODO: probably we don't need this
    const bottomNavContainer = document.getElementById("bottom-nav-container");
    if (bottomNavContainer) {
      bottomNavContainer.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading profile page:", error);
    showToast("Failed to load profile", true);
    loadHomePage();
  }
}

function populateProfileHTML(content, userData, isOwnProfile) {
  // Shared elements
  populateSharedProfileHTML(content, userData);

  const avatarElement = content.querySelector(".profile__avatar");
  avatarElement.src = userData.avatar || ASSETS.IMAGES.DEFAULT_AVATAR;

  // Split based on profile type
  if (isOwnProfile) {
    populateOwnProfileHTML(content, userData);
  } else {
    populatePublicProfileHTML(content, userData);
  }
}

function populateSharedProfileHTML(content, userData) {
  // Username
  const usernameElement = content.querySelector(".profile__username");
  applyUsernameTruncation(usernameElement, userData.username, 15);

  // Bio
  content.querySelector(".profile__bio-text").textContent = userData.bio || "No bio available";

  // Stats (always visible)
  if (userData.stats) {
    content.querySelector(".profile__stats-wins").textContent = userData.stats.wins;
    content.querySelector(".profile__stats-losses").textContent = userData.stats.losses;
    content.querySelector(".profile__stats-wins").textContent = userData.stats.wins;
    content.querySelector(".profile__stats-losses").textContent = userData.stats.losses;
    content.querySelector(".profile__stats-ratio").textContent = formatWinRatio(
      userData.stats.wins,
      userData.stats.losses
    );
  }
}

function populateOwnProfileHTML(content, userData) {
  // Private info
  content.querySelector(".profile__info-item--name").textContent =
    `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "No name set";
  content.querySelector(".profile__info-item--email").textContent = userData.email || "No email set";
  content.querySelector(".profile__info-item--phone").textContent = userData.telephone_number || "No phone set";

  // Friends section with click handler
  const friendsSection = content.querySelector(".profile__section--friends");
  const friendsCount = friendsSection.querySelector(".profile__friends-count");
  friendsCount.textContent = userData.friends_count;
  friendsSection.setAttribute("role", "button");
  friendsSection.setAttribute("tabindex", "0");

  friendsSection.addEventListener("click", () => {
    history.pushState({ view: "users", showFriendsOnly: true }, "");
    loadUsersPage(false);
    const friendsFilter = document.querySelector(".users-filter__button--friends");
    friendsFilter.click();
  });

  friendsSection.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      friendsSection.click();
    }
  });
}

function populatePublicProfileHTML(content, userData) {
  // Hide private elements: email, phone, name, friends
  const privateElements = content.querySelectorAll(".profile__private-info");
  privateElements.forEach((element) => {
    element.style.display = "none";
  });

  // TODO: doppelt gemoppelt just to be sure
  const emailElement = content.querySelector(".profile__info-item--email");
  const phoneElement = content.querySelector(".profile__info-item--phone");
  const blockButton = content.querySelector('button[data-action="block"]');
  const playFriendButton = content.querySelector('button[data-action="play"]');
  const friendshipButton = content.querySelector('button[data-action="friend"]');
  const chatButton = content.querySelector('button[data-action="chat"]');

  emailElement.style.display = "none";
  phoneElement.style.display = "none";

  friendshipButton.addEventListener("click", () => {
    handleFriendshipButtonClick(friendshipButton.dataset.state, userData);
  });

  // Check and set block button state
  // Async function to set up block button
  const setupBlockButton = async () => {
    try {
      const isBlocked = await isUserBlockedByCurrentUser(userData.username);

      if (isBlocked) {
        blockIconSpan.textContent = "lock_open";
        blockButton.setAttribute("title", "Unblock User");
        blockButton.dataset.state = "blocked";
      } else {
        blockIconSpan.textContent = "lock";
        blockButton.setAttribute("title", "Block User");
        blockButton.dataset.state = "not_blocked";
      }

      // Block button click handler
      blockButton.addEventListener("click", async () => {
        try {
          const currentBlockStatus = blockButton.dataset.state === "blocked";

          const blockResult = await toggleBlockUser(userData.username, currentBlockStatus);

          if (blockResult.status === "success") {
            const newBlockedState = !currentBlockStatus;

            if (newBlockedState) {
              blockIconSpan.textContent = "lock_open";
              blockButton.setAttribute("title", "Unblock User");
              blockButton.dataset.state = "blocked";
            } else {
              blockIconSpan.textContent = "lock";
              blockButton.setAttribute("title", "Block User");
              blockButton.dataset.state = "not_blocked";
            }

            showToast(newBlockedState ? "User blocked successfully" : "User unblocked successfully", false);
          }
        } catch (error) {
          console.error("Error blocking/unblocking user:", error);
          showToast("Failed to block/unblock user", true);
        }
      });
    } catch (error) {
      console.error("Error checking block status:", error);
      // Fallback to default state
      blockIconSpan.textContent = "lock";
      blockButton.setAttribute("title", "Block User");
      blockButton.dataset.state = "not_blocked";
    }
  };

  setupBlockButton();

  // Friendship button state and icon setup
  const friendIconSpan = friendshipButton.querySelector(".material-symbols-outlined");
  if (!friendIconSpan) {
    console.warn("Icon span not found in friend button");
    return;
  }

  const blockIconSpan = blockButton.querySelector(".material-symbols-outlined");
  if (!blockIconSpan) {
    console.warn("Icon span not found in block button");
    return;
  }

  if (userData.is_friend) {
    friendIconSpan.textContent = "do_not_disturb_on";
    friendshipButton.setAttribute("title", "Remove Friend");
    friendshipButton.dataset.state = "friends";
  } else {
    switch (userData.friend_request_status) {
      case "sent":
        friendIconSpan.textContent = "hourglass_top";
        friendshipButton.setAttribute("title", "Friend Request Sent. Click to withdraw.");
        friendshipButton.dataset.state = "pending_sent";
        break;
      case "received":
        friendIconSpan.textContent = "check_circle";
        friendshipButton.setAttribute("title", "Friend Request Received. Click to accept, reject or ignore.");
        friendshipButton.dataset.state = "pending_received";
        break;
      default:
        friendIconSpan.textContent = "add_circle";
        friendshipButton.setAttribute("title", "Add Friend");
        friendshipButton.dataset.state = "not_friends";
    }
  }

  playFriendButton.addEventListener("click", async () => {
    try {
      const friendId = userData.id;
      const result = await inviteFriend(friendId);

      console.log("reslt.success", result.success);

      if (result.status === 200) {
        const playIconSpan = playFriendButton.querySelector(".material-symbols-outlined");
        playIconSpan.textContent = "hourglass_top";
        // console.log("Invitation sent successfully");
        playFriendButton.setAttribute("title", "Invitation Sent");
        showToast("Game invitation sent", false);
      }
    } catch (error) {
      console.error("Error inviting friend:", error);
      showToast("Failed to send game invitation", "error");
    }
  });

  chatButton.addEventListener("click", async () => {
    loadChatRoom(userData);
  });
}

async function handleFriendshipButtonClick(friendshipButtonDatasetState, userData) {
  try {
    switch (friendshipButtonDatasetState) {
      case "not_friends":
        // Send friend request
        const sendResult = await sendFriendRequest(userData.id);
        if (sendResult.success) {
          try {
            updateFriendButton("pending_sent");
          } catch (uiError) {
            // If UI update fails, reload the page
            console.warn("UI update failed, reloading profile:", uiError);
            await loadProfilePage(userData.id, false);
          }
        }
        break;

      case "pending_sent":
        const withdrawAction = await showFriendshipActionModal({
          title: "Withdraw Friend Request",
          message: "Are you sure you want to withdraw your friend request?",
          actions: [
            { text: "Withdraw", value: "confirm", type: "secondary" },
            { text: "Cancel", value: "cancel", type: "tertiary" },
          ],
        });
        if (withdrawAction === "confirm") {
          const withdrawResult = await withdrawFriendRequest(userData.id);
          if (withdrawResult.success) {
            try {
              updateFriendButton("not_friends");
            } catch (uiError) {
              await loadProfilePage(userData.id, false);
            }
          }
        }
        break;

      case "pending_received":
        // Open action selection modal
        const pendingReceivedAction = await showFriendshipActionModal({
          title: "Friend Request Received",
          message: "What would you like to do with this friend request?",
          actions: [
            { text: "Accept", value: "accept", type: "primary" },
            { text: "Reject", value: "reject", type: "secondary" },
            { text: "Ignore", value: "ignore", type: "tertiary" },
          ],
        });
        if (pendingReceivedAction === "accept") {
          const acceptResult = await acceptFriendRequest(userData.id);
          if (acceptResult.success) {
            try {
              updateFriendButton("friends");
            } catch (uiError) {
              await loadProfilePage(userData.id, false);
            }
          }
        } else if (pendingReceivedAction === "reject") {
          const rejectResult = await rejectFriendRequest(userData.id);
          if (rejectResult.success) {
            try {
              updateFriendButton("not_friends");
            } catch (uiError) {
              await loadProfilePage(userData.id, false);
            }
          }
        }
        break;

      case "friends":
        const removeAction = await showFriendshipActionModal({
          title: "Remove Friend",
          message: "Are you sure you want to remove this friend?",
          actions: [
            { text: "Remove Friend", value: "confirm", type: "secondary" },
            { text: "Cancel", value: "tertiary" },
          ],
        });

        if (removeAction === "confirm") {
          console.log("Removing friend:", userData.id);
          const removeResult = await removeFriend(userData.id);
          if (removeResult.success) {
            try {
              updateFriendButton("not_friends");
            } catch (uiError) {
              await loadProfilePage(userData.id, false);
            }
          }
        }
        break;
    }
  } catch (error) {
    console.error("Error handling friend action:", error);
    showToast("Failed to perform friend action", "error");
  }
}

/**
 * Shows a modal for friendship-related actions
 * @param {Object} options Modal configuration
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {Array<{text: string, value: string, type: 'primary'|'secondary'|'tertiary'}>} options.actions
 *        - Array of action buttons. Type affects button styling:
 *          - primary: Main action (strongest emphasis)
 *          - secondary: Alternative action (medium emphasis)
 *          - tertiary: Optional action (least emphasis)
 * @returns {Promise<'confirm'|'accept'|'reject'|'ignore'|'cancel'>} Action selected by user
 */
function showFriendshipActionModal({ title, message, actions }) {
  return new Promise((resolve) => {
    renderModal("friendship-action-template", {
      isFormModal: false,
      actionHandler: (action) => {
        closeModal();
        resolve(action);
      },
      setup: (modalElement) => {
        const titleEl = modalElement.querySelector("#modal-title");
        const messageEl = modalElement.querySelector("#modal-message");
        const actionsDiv = modalElement.querySelector(".modal-actions");

        titleEl.textContent = title;
        messageEl.textContent = message;

        // Clear existing content
        actionsDiv.innerHTML = "";

        // Create buttons safely
        // Warning about dynamic creation of buttons: They needs to be created dynamically cause we could have two or three buttons. The other solution would be two different templates, but this is more scalable!
        actions.forEach((action) => {
          const button = document.createElement("button");
          button.className = `modal-button ${action.type ? `modal-button--${action.type}` : ""}`;
          button.dataset.action = action.value;
          button.textContent = action.text;
          actionsDiv.appendChild(button);
        });
      },
    });
  });
}

// TODO: we need to refactor this, cause we are not going to change the button text, but the icon and the title
function updateFriendButton(newStatus) {
  //   const friendButton = document.getElementById("friend-button");
  const friendshipButton = document.querySelector('button[data-action="friend"]');
  const iconSpan = friendshipButton.querySelector(".material-symbols-outlined");
  if (!friendshipButton || !iconSpan) {
    console.warn("Friend button or icon not found");
    return;
  }
  switch (newStatus) {
    case "not_friends":
      iconSpan.textContent = "add_circle";
      friendshipButton.setAttribute("title", "Add Friend");
      friendshipButton.dataset.state = "not_friends";
      break;
    case "pending_sent":
      iconSpan.textContent = "hourglass_top";
      friendshipButton.setAttribute("title", "Friend Request Sent. Click to withdraw.");
      friendshipButton.dataset.state = "pending_sent";
      break;
    case "pending_received":
      iconSpan.textContent = "check_circle";
      friendshipButton.setAttribute("title", "Friend Request Received. Click to accept, reject or ignore.");
      friendshipButton.dataset.state = "pending_received";
      break;
    case "friends":
      iconSpan.textContent = "do_not_disturb_on";
      friendshipButton.setAttribute("title", "Remove Friend");
      friendshipButton.dataset.state = "friends";
      break;
  }
}

function updateBlockButton(isBlocked) {
  console.log("updateBlockButton isBlocked: ", isBlocked);
  const blockButton = document.querySelector('button[data-action="block"]');
  const blockIconSpan = blockButton.querySelector(".material-symbols-outlined");
  if (!blockButton || !blockIconSpan) {
    console.warn("Block button or icon not found");
    return;
  }
  if (isBlocked) {
    console.log("The user is currently blocked");
    blockIconSpan.textContent = "lock_open";
    blockButton.setAttribute("title", "Unblock User");
    blockButton.dataset.state = "blocked";
  } else {
    console.log("The user is NOT currently blocked");
    blockIconSpan.textContent = "lock";
    blockButton.setAttribute("title", "Block User");
    blockButton.dataset.state = "not_blocked";
  }
}
