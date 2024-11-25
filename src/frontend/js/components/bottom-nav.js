import { loadHomePage } from "../views/home.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { loadProfilePage } from "../views/profile.js";
import { loadChatPage } from "../views/chat-home.js";
import { NAVIGATION } from "../config/constants.js";

export function initBottomNav() {
  console.log("Initializing bottom nav...");
  const bottomNavTemplate = document.getElementById("bottom-nav-template");
  const bottomNavContainer = document.getElementById("bottom-nav-container");

  if (bottomNavTemplate && bottomNavContainer) {
    console.log("Both elements found, cloning template...");
    const clone = document.importNode(bottomNavTemplate.content, true);
    bottomNavContainer.appendChild(clone);

    // Add click handlers
    const navItems = bottomNavContainer.querySelectorAll(".bottom-nav__item");
    console.log("Nav items found:", navItems.length);
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

  const pageLoaders = {
    home: loadHomePage,
    tournaments: loadTournamentsPage,
    profile: loadProfilePage,
    chat: loadChatPage,
  };

  if (pageLoaders[page]) {
    pageLoaders[page](false); // Pass false to prevent another history push
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
