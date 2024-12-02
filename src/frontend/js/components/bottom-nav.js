import { loadHomePage } from "../views/home.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { loadProfilePage } from "../views/profile.js";
import { loadChatPage } from "../views/chats.js";
import { loadUsersPage } from "../views/users.js";
import { NAVIGATION, LOCAL_STORAGE_KEYS } from "../config/constants.js";

export function initBottomNav() {
  const bottomNavTemplate = document.getElementById("bottom-nav-template");
  const bottomNavContainer = document.getElementById("bottom-nav-container");

  if (bottomNavTemplate && bottomNavContainer) {
    const clone = document.importNode(bottomNavTemplate.content, true);
    bottomNavContainer.appendChild(clone);

    // Add click handlers
    const navItems = bottomNavContainer.querySelectorAll(".bottom-nav__item");
    navItems.forEach((item) => {
      item.addEventListener("click", handleNavClick);
    });
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
      navItems.forEach((nav) => nav.classList.remove("bottom-nav__item--active"));
      return;
    }

    navItems.forEach((nav) => {
      // Remove active class from all items
      nav.classList.remove("bottom-nav__item--active");

      // Add active class to the selected item
      if (NAVIGATION.VIEWS_WITH_TAB.includes(view) && nav.dataset.page === view) {
        nav.classList.add("bottom-nav__item--active");
      }
    });
  });
}
