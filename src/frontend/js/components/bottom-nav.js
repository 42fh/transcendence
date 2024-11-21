import { loadHomePage } from "../views/home.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { loadProfilePage } from "../views/profile.js";
import { loadChatPage } from "../views/chat.js";

export function initBottomNav() {
  console.log("Initializing bottom nav...");
  const bottomNavTemplate = document.getElementById("bottom-nav-template");
  const bottomNavContainer = document.getElementById("bottom-nav-container");

  console.log("Template:", bottomNavTemplate);
  console.log("Container:", bottomNavContainer);

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

  // Update active states
  const navItems = document.querySelectorAll(".bottom-nav__item");
  navItems.forEach((nav) => nav.classList.remove("bottom-nav__item--active"));
  this.classList.add("bottom-nav__item--active");

  // Navigate to the selected view
  const pageLoaders = {
    home: loadHomePage,
    tournaments: loadTournamentsPage,
    profile: loadProfilePage,
    chat: loadChatPage,
  };

  if (pageLoaders[page]) {
    pageLoaders[page]();
  }
}
