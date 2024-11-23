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
      const userInitialsContainer = document.getElementById("user-initials-container");
      conversationList.innerHTML = "";
      userInitialsContainer.innerHTML = "";
  
      data.users.forEach((user) => {
        // Use the user initial template
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
        userInitialElement.textContent = user.username.charAt(0).toUpperCase();
        userInitialsContainer.appendChild(userInitial);
  
        // Use the user list item template
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
        const chatButton = conversationListItem.querySelector(".chat-button-small");
        if (!chatButton) {
          throw new Error("Chat button element not found in template");
        }
        chatButton.id = `chat-button-${user.username}`;
  
        // Add event listener to open chat room
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
