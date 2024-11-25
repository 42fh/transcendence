import { loadChatRoom } from "./chat-room.js";
import { fetchUserList, toggleBlockUser } from "../services/chatService.js";
import { displayModalError } from "../components/modal.js";


export async function loadChatPage(addToHistory = true) {
    try {
      if (addToHistory) {
        history.pushState(
          {
            view: "chat-home",
          },
          ""
        );
      }
  
      const mainContent = document.getElementById("main-content");
      mainContent.innerHTML = "";
  
      const template = document.getElementById("chat-home-template");
      if (!template) {
        throw new Error("Chat Home template not found");
      }
  
      mainContent.appendChild(document.importNode(template.content, true));
      console.log("Chat home template loaded");
  
      await populateUserList();
      console.log("User list populated");
    } catch (error) {
      console.error("Error loading chat home:", error);
    }
  }

  
  async function populateUserList() {
    try {
      const data = await fetchUserList();
      const conversationList = document.getElementById("conversation-list");
      const userInitialsContainer = document.getElementById("chat-usernames");
      conversationList.innerHTML = "";
      userInitialsContainer.innerHTML = "";
  
      data.users.forEach((user) => {
        const userInitialTemplate = document.getElementById("user-initial-template");
        if (!userInitialTemplate) {
          throw new Error("User Initial template not found");
        }
        const userInitial = document.importNode(userInitialTemplate.content, true);
        const userInitialElement = userInitial.querySelector(".user-initial");
        if (!userInitialElement) {
          throw new Error("User Initial element not found in template");
        }
        userInitialElement.id = `user-initial-${user.username}`;
  
        const avatarElement = userInitialElement.querySelector(".user-avatar");
        avatarElement.src = user.avatarUrl || "default-avatar.png"; // Set the avatar URL or a default image
        avatarElement.alt = user.username.charAt(0).toUpperCase(); // Fallback string
  
        const usernameElement = userInitialElement.querySelector(".user-username");
        usernameElement.textContent = user.username.slice(0, 5); // Limit username to x characters
  
        userInitialsContainer.appendChild(userInitial);
  
        const conversationListItemTemplate = document.getElementById("user-list-item-template");
        if (!conversationListItemTemplate) {
          throw new Error("Conversation List Item template not found");
        }
        const conversationListItem = document.importNode(conversationListItemTemplate.content, true);
        const conversationListItemElement = conversationListItem.querySelector(".chat-user-item");
        if (!conversationListItemElement) {
          throw new Error("User List Item element not found in template");
        }
        conversationListItemElement.textContent = user.username;
  
        const avatarElementList = conversationListItem.querySelector(".profile__avatar");
        if (avatarElementList) {
          avatarElementList.src = user.avatarUrl || "default-avatar.png"; // Set the avatar URL or a default image
          avatarElementList.alt = user.username.charAt(0).toUpperCase(); // Fallback string
        }
  
        conversationListItemElement.addEventListener("click", () => {
          loadChatRoom(user.username);
        });
  
        conversationList.appendChild(conversationListItem);
      });
    } catch (error) {
      console.error("Error loading user list:", error);
    }
  }

async function handleBlockUser(username, isCurrentlyBlocked, button) {
  try {
    await toggleBlockUser(username, isCurrentlyBlocked);
    button.textContent = isCurrentlyBlocked ? "Block" : "Unblock";
    await populateUserList();
  } catch (error) {
    displayModalError(`Failed to block/unblock user: ${error.message}`);
  }
}
