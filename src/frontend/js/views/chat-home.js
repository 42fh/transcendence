import { loadChatRoom } from "./chat-room.js";
import { fetchUserList, toggleBlockUser } from "../services/chatService.js";
import { displayErrorMessageModalModal } from "../utils/modals.js";

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
    const usersList = document.getElementById("users-list");
    usersList.innerHTML = "";

    const template = document.getElementById("user-list-item-template");
    data.users.forEach((user) => {
      const userElement = document.importNode(template.content, true);
      const nameSpan = userElement.querySelector(".chat-user-item");
      const blockButton = userElement.querySelector(".chat-button-small");

      nameSpan.textContent = user.username;
      nameSpan.classList.toggle("has-chat", user.has_chat);

      if (!user.has_blocked_you) {
        nameSpan.onclick = () => loadChatRoom(user.username);
      } else {
        nameSpan.classList.add("blocked-by-user");
        nameSpan.title = "This user has blocked you";
      }

      blockButton.textContent = user.is_blocked ? "Unblock" : "Block";
      blockButton.onclick = async (e) => {
        e.stopPropagation();
        await handleBlockUser(user.username, user.is_blocked, blockButton);
      };

      usersList.appendChild(userElement);
    });
  } catch (error) {
    displayErrorMessageModalModal(`Failed to load user list: ${error.message}`);
  }
}

async function handleBlockUser(username, isCurrentlyBlocked, button) {
  try {
    await toggleBlockUser(username, isCurrentlyBlocked);
    button.textContent = isCurrentlyBlocked ? "Block" : "Unblock";
    await populateUserList();
  } catch (error) {
    displayErrorMessageModalModal(`Failed to block/unblock user: ${error.message}`);
  }
}
