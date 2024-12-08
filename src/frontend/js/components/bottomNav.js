import { loadHomePage } from "../views/home.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { loadProfilePage } from "../views/profile.js";
import { loadChatPage } from "../views/chatHome.js";
import { loadUsersPage } from "../views/users.js";
import { NAVIGATION, LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { renderNotifications } from "../views/chatNotification.js";

export function initBottomNav() {
  const bottomNavTemplate = document.getElementById("bottom-nav-template");
  const bottomNavContainer = document.getElementById("bottom-nav-container");

  if (bottomNavTemplate && bottomNavContainer) {
    const clone = document.importNode(bottomNavTemplate.content, true);
    bottomNavContainer.appendChild(clone);

    // Call renderNotifications to fetch and display notifications
    renderNotifications();

    // Add click handlers
    const navItems = bottomNavContainer.querySelectorAll(".bottom-nav__item");
    navItems.forEach((item) => {
      item.addEventListener("click", handleNavClick);
    });

    console.log("Bottom navigation initialized. Notification badge added.");
  } else {
    console.warn("Missing elements:", {
      template: !!bottomNavTemplate,
      container: !!bottomNavContainer,
    });
  }
}

function handleNavClick(e) {
  e.preventDefault();
  const page = this.dataset.page;

  if (!NAVIGATION.VIEWS_WITH_TAB.includes(page)) {
    return;
  }
  history.pushState({ view: page }, "");

  updateActiveNavItem(page);

  const userId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);

  const pageLoaders = {
    home: () => loadHomePage(false),
    tournaments: () => loadTournamentsPage(false),
    profile: () => loadProfilePage(userId, false),
    chat: () => loadChatPage(false),
    users: () => loadUsersPage(false),
  };

  if (pageLoaders[page]) {
    pageLoaders[page](); // No need to pass false here anymore
  }
}

export function updateActiveNavItem(view) {
  requestAnimationFrame(() => {
    const navItems = document.querySelectorAll(".bottom-nav__item");

    // If it's auth view, remove all active states
    if (view === "auth") {
      navItems.forEach((nav) =>
        nav.classList.remove("bottom-nav__item--active")
      );
      return;
    }

    navItems.forEach((nav) => {
      // Remove active class from all items
      nav.classList.remove("bottom-nav__item--active");

      // Add active class to the selected item
      if (
        NAVIGATION.VIEWS_WITH_TAB.includes(view) &&
        nav.dataset.page === view
      ) {
        nav.classList.add("bottom-nav__item--active");
      }
    });
  });
}

export function updateNotificationBadge(count) {
  const notificationBadge = document.getElementById("bottom-nav-notification-badge");
  if (notificationBadge) {
    notificationBadge.textContent = count > 0 ? count : "";
    notificationBadge.style.display = count > 0 ? "block" : "none";
    // console.log(`Notification badge updated: ${count} unread notifications.`);
  } else {
    console.error("Notification badge element not found.");
  }
}
