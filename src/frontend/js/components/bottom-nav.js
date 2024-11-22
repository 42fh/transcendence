import { loadHomePage } from "../views/home.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { loadProfilePage } from "../views/profile.js";
import { loadChatPage } from "../views/chats.js";
import { NAVIGATION } from "../config/constants.js";

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

  if (!NAVIGATION.VIEWS_WITH_TAB.includes(page)) {
    return;
  }
  // Push state first
  history.pushState({ view: page }, "");

  // Then update nav and load page
  updateActiveNavItem(page);

  // Navigate to the selected view
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

// export function updateActiveNavItem(view) {
//   console.log("Updating active nav item for view:", view);
//   const navItems = document.querySelectorAll(".bottom-nav__item");
//   console.log("Found nav items:", navItems.length);

//   navItems.forEach((nav) => {
//     nav.classList.remove("bottom-nav__item--active");
//     if (NAVIGATION.VIEWS_WITH_TAB.includes(view) && nav.dataset.page === view) {
//       console.log("Setting active:", nav.dataset.page);
//       nav.classList.add("bottom-nav__item--active");
//     }
//   });
// }

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
