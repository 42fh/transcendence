/*
 * Tournament Data Structure
 *
 * This is a JavaScript array containing tournament objects, structured to mimic JSON format
 * but it's actually a native JS data structure. While in JSON all keys must be double-quoted
 * strings, in JavaScript object literals:
 *
 * 1. Keys can be unquoted if they're valid identifiers (e.g., name, startingDate)
 * 2. Keys must be quoted if they:
 *    - Contain special characters (e.g., "start-date")
 *    - Start with numbers (e.g., "42-network")
 *    - Contain spaces (e.g., "tournament name")
 *    - Are JavaScript reserved words (e.g., "class", "function")
 *
 * We're keeping the JSON-like format with quoted keys for consistency with our future
 * API responses and to make it easier to copy/paste between .js and .json files.
 *
 * prettier-ignore is used to:
 * 1. Preserve the readable formatting of our data structure
 * 2. Prevent prettier from removing the double quotes from keys
 * 3. Keep the array items aligned for better readability
 */

// prettier-ignore

// prettier-ignore
const tournaments = [
	{
	  "name": "WIMBLEDON",
	  "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
	  "startingDate": "2024-07-25T14:00:00Z",
	  "closingRegistrationDate": "2024-07-19T23:59:00Z",
	  "isTimetableAvailable": false,
	  "participants": ["User 1", "User 2", "User 3"],
	  "type": "single elimination",
	  "timetable": null
	},
	{
	  "name": "US OPEN",
	  "description": "Lorem ipsum dolor sit amet...",
	  "startingDate": "2024-01-29T09:30:00Z",
	  "closingRegistrationDate": "2024-01-22T23:59:00Z",
	  "isTimetableAvailable": false,
	  "participants": ["User 1", "User 2", "User 3"],
	  "type": "single elimination",
	  "timetable": null
	},
	{
	  "name": "42 NETWORK",
	  "description": "Lorem ipsum dolor sit amet...",
	  "startingDate": "2024-09-09T15:00:00Z",
	  "closingRegistrationDate": "2024-09-08T23:59:00Z",
	  "isTimetableAvailable": false,
	  "participants": ["User 1", "User 2", "User 3"],
	  "type": "single elimination",
	  "timetable": null
	},
	{
	  "name": "42 BERLIN",
	  "description": "Lorem ipsum dolor sit amet...",
	  "startingDate": "2024-09-09T18:00:00Z",
	  "closingRegistrationDate": "2024-09-01T23:59:00Z",
	  "isTimetableAvailable": true,
	  "participants": ["User 1", "User 2", "User 3"],
	  "type": "single elimination",
	  "timetable": null
	}
  ]

// Modify tournament dates to be relative to current time for demo purposes
const now = new Date();
tournaments[0].startingDate = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(); // Wimbledon: 6 days from now
tournaments[1].startingDate = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(); // US Open: 3 hours from now
tournaments[2].startingDate = new Date(now.getTime() + 40 * 60 * 1000).toISOString(); // 42 Network: 40 minutes from now
tournaments[3].startingDate = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // 42 Berlin: started 30 minutes ago

// Also update closing registration dates to be consistent
tournaments[0].closingRegistrationDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 1 day before start
tournaments[1].closingRegistrationDate = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 1 hour before start
tournaments[2].closingRegistrationDate = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 10 minutes before start
tournaments[3].closingRegistrationDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // closed yesterday

// Add current user to specific tournaments for demo purposes
// If you want to test the enrollment functionality, uncomment the following lines or comment all of them out
// I mean like testing the empty state in the UI
const username = localStorage.getItem("username");
if (username) {
  //   tournaments[0].participants.push(username); // Add to Wimbledon
  //   tournaments[1].participants.push(username); // Add to US Open
  tournaments[2].participants.push(username); // Add to 42 Network
  tournaments[3].participants.push(username); // Add to 42 Berlin
}

// Configuration for data source and state management
const CONFIG = {
  DATA_SOURCE: "JS", // 'API' | 'JSON' | 'JS'
  API_BASE_URL: "/api/game/tournaments", // For future use
};

function displayErrorMessageModalModal(message) {
  const modalContent = document.getElementById("modal-content");
  const errorElement = document.createElement("p");
  errorElement.style.color = "red";
  errorElement.textContent = message;
  modalContent.innerHTML = "";
  modalContent.appendChild(errorElement);
}

function displayLogoutError(message) {
  const logoutButton = document.getElementById("logout-button");

  // Remove any existing error message
  const existingError = document.getElementById("logout-error");
  if (existingError) {
    existingError.remove();
  }

  // Create a new error message element
  const errorElement = document.createElement("p");
  errorElement.id = "logout-error";
  errorElement.style.color = "red";
  errorElement.style.marginTop = "10px";
  errorElement.textContent = message;

  // Insert the error message after the logout button
  logoutButton.insertAdjacentElement("afterend", errorElement);
}

async function handleFormSubmitSignupLogin(event, endpoint) {
  event.preventDefault();

  console.log("window.location.origin", window.location.origin);
  console.log("endpoint: ", endpoint);
  const baseUrl = ""; // This is empty which implies fetch will use the relative path
  const fullEndpoint = `${baseUrl}${endpoint}`;
  const form = event.target;
  const formData = new FormData(form);
  const messageElement = document.getElementById("modal-message");
  const data = Object.fromEntries(formData);
  try {
    const response = await fetch(fullEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log("Response Status:", response.status);
    let result;
    try {
      result = await response.json();
      console.log("Success Result:", result);
    } catch (err) {
      console.error("Expected JSON, received something else", err);
      result = {}; // Ensure result is defined even if parsing fails
    }
    if (response.ok) {
      if (messageElement && result && result.message) {
        messageElement.style.color = "white";
        messageElement.innerText = `${result.message || "Signup or Login successful! 🎉 Redirecting..."}`;
      } else {
        console.warn("Element with id 'modal-message' not found in the DOM or result.message is undefined.");
      }
      localStorage.setItem("username", result.username);
      form.style.display = "none";
      setTimeout(() => {
        closeModal();
        history.pushState({ view: "home" }, "");
        loadHomePage();
      }, 2000);
    } else {
      const errorResult = await response.json();
      displayErrorMessageModalModal(errorResult.error || "An error occurred.");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    displayErrorMessageModalModal("There was an issue submitting the form. Please try again.");
  }
}

// Function to fill the modal content (title and body)
function fillModalContent(templateId, endpoint) {
  const template = document.getElementById(templateId);
  const modalContent = document.getElementById("modal-content");

  // Clear current content
  modalContent.innerHTML = "";

  // Clone and append template content to the modal
  if (template) {
    const content = document.importNode(template.content, true);
    modalContent.appendChild(content);
    // Attach submit event listener to the specific form in the modal
    const form = modalContent.querySelector("form");
    form.addEventListener("submit", (event) => handleFormSubmitSignupLogin(event, endpoint));
  }
}

function openModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.style.visibility = "visible";
    modalOverlay.style.opacity = "1";
  }
}

function closeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.style.visibility = "hidden";
    modalOverlay.style.opacity = "0";
  }
}

async function handleLogout() {
  console.log("Attempting to log out...");
  try {
    const response = await fetch("/api/users/logout/", {
      method: "POST",
      cache: "no-store",
    });
    console.log("Logout response status:", response.status);

    if (response.ok) {
      localStorage.removeItem("username");
      history.pushState({ view: "auth" }, "");
      loadAuthPage();
    } else {
      const result = await response.json();
      console.warn("Logout failed:", result);
      displayLogoutError(result.error || "Logout failed. Please try again.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    displayLogoutError("An error occurred while logging out. Please try again.");
  }
}

async function loadAuthPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "auth",
        },
        ""
      );
    }

    const response = await fetch("/index.html");
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    document.body.innerHTML = doc.body.innerHTML;
  } catch (error) {
    console.error("Error loading auth page:", error);
    displayLogoutError("An error occurred while loading the login page.");
  }
}

function loadHomePage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "home",
        },
        ""
      );
    }

    // Hide the initial container
    document.getElementById("container").style.display = "none";

    // Show main-content and load the home template
    const mainContent = document.getElementById("main-content");
    mainContent.style.display = "block";
    mainContent.innerHTML = ""; // Clear any existing content

    const template = document.getElementById("home-template");
    if (template) {
      const homeContent = document.importNode(template.content, true);
      mainContent.appendChild(homeContent);

      // Get the username from localStorage and set the greeting message
      const username = localStorage.getItem("username");
      if (username) {
        const greetingElement = document.getElementById("greeting");
        greetingElement.innerHTML = `Hello ${username}! 👋`;
      }

      // Event listener for the logout button
      document.getElementById("logout-button").addEventListener("click", handleLogout);

      // Add event listener for the "Play" button
      document.getElementById("play").addEventListener("click", function () {
        const baseUrl = window.location.origin;
        fetch(`${baseUrl}/play.html`)
          .then((response) => response.text())
          .then((html) => {
            mainContent.innerHTML = html;
            const script = document.createElement("script");
            script.src = "play.js";
            document.body.appendChild(script);
          })
          .catch((err) => console.warn("Failed to load play.html", err));
      });

      // Add event listener for the "Three.js" button
      document.getElementById("threejs").addEventListener("click", function () {
        const baseUrl = window.location.origin;
        fetch(`${baseUrl}/threejs_11.html`)
          .then((response) => response.text())
          .then((html) => {
            mainContent.innerHTML = html;
          })
          .catch((err) => console.warn("Failed to load threejs_11.html", err));
      });

      // Add tournaments button listener
      document.getElementById("tournaments").addEventListener("click", loadTournamentsPage);
    }
  } catch (error) {
    console.error("Error loading home page:", error);
    displayLogoutError("An error occurred while loading the home page.");
  }
}

// Event listeners for buttons to open modals with appropriate content and endpoint
document.getElementById("login-button").addEventListener("click", () => {
  fillModalContent("login-template", "/api/users/login/");
  openModal();
});

document.getElementById("signup-button").addEventListener("click", () => {
  fillModalContent("signup-template", "/api/users/signup/");
  openModal();
});

document.getElementById("close-modal").addEventListener("click", () => {
  closeModal();
});

// Event listener to close modal when clicking outside of it
document.addEventListener("click", (e) => {
  const modalOverlay = document.getElementById("modal-overlay");
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// Cookie check function (commented out for now)
/*
  document.addEventListener("DOMContentLoaded", function () {
	if (document.cookie.includes("logincookie")) {
	  window.location.href = "/home.html";
	}
  });
  */

// Function to create the modal structure if it doesn’t exist
function createAndShowModal() {
  let modalOverlay = document.getElementById("modal-overlay");

  // Create the modal if it doesn't already exist in the DOM
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "modal-overlay";
    modalOverlay.classList.add("modal-overlay");

    modalOverlay.innerHTML = `
			<div id="modal" class="modal">
			  <span id="close-modal" class="close-btn">&times;</span>
			  <div id="modal-content" class="modal-content">
				<!-- Content will be injected here by fillModalContent -->
			  </div>
			</div>
		  `;
    document.body.appendChild(modalOverlay); // Add modal to the DOM

    // Event listener to close the modal when clicking the "X"
    document.getElementById("close-modal").addEventListener("click", closeModal);

    // Close the modal when clicking outside the modal content
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  // Show the modal
  openModal();
}

// Fetch and enhance tournaments
async function fetchTournaments(source = CONFIG.DATA_SOURCE) {
  try {
    let rawTournaments;

    switch (source) {
      case "API":
        // const response = await fetch(`${CONFIG.API_BASE_URL}`);
        // rawTournaments = await response.json();
        throw new Error("API not implemented yet");

      case "JS":
        rawTournaments = tournaments;
        break;

      case "JSON":
        rawTournaments = tournamentsData;
        break;

      default:
        throw new Error(`Invalid source specified: ${source}`);
    }

    return rawTournaments.map(enhanceTournament);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    throw error;
  }
}

// Enhance a single tournament with derived data
function enhanceTournament(tournament) {
  return {
    ...tournament,
    isRegistrationOpen: checkRegistrationOpen(tournament.closingRegistrationDate),
    timeLeftToRegistration: calculateTimeLeft(tournament.closingRegistrationDate),
    isUserEnrolled: checkUserEnrollment(tournament.participants, localStorage.getItem("username")),
  };
}

// Helper functions for date formatting
function formatDate(dateString, options = {}) {
  const { showYear = false, monthFirst = false, showTime = true } = options;

  const date = new Date(dateString);

  if (isNaN(date)) {
    return "Invalid Date";
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  let formattedDate;
  if (monthFirst) {
    formattedDate = showYear ? `${month}-${day}-${year}` : `${month}-${day}`;
  } else {
    formattedDate = showYear ? `${day}-${month}-${year}` : `${day}-${month}`;
  }
  if (showTime) {
    formattedDate += ` ${hours}:${minutes}`;
  }

  return formattedDate;
}

function renderTournamentCard(tournament) {
  const template = document.getElementById("tournament-card-template");
  const card = document.importNode(template.content, true);

  const cardElement = card.querySelector(".tournament-card");
  cardElement.querySelector(".tournament-card-date").textContent = formatDate(tournament.startingDate, {
    showYear: false,
    monthFirst: false,
    showTime: false,
  });
  cardElement.querySelector(".tournament-card-name").textContent = tournament.name;
  cardElement.querySelector(".tournament-card-status").textContent = tournament.timeLeftToRegistration;

  cardElement.addEventListener("click", () => {
    handleTournamentClick(tournament);
  });

  return card;
}

function checkRegistrationOpen(closingDate) {
  return new Date(closingDate) > new Date();
}

function calculateTimeLeft(closingDate) {
  const now = new Date();
  const closing = new Date(closingDate);
  const diff = closing - now;

  if (diff <= 0) return "000";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} d`;
  if (hours > 0) return `${hours} h`;
  return `${minutes} m`;
}

function checkUserEnrollment(participants, username) {
  return participants.includes(username);
}

function handleTournamentClick(tournament) {
  console.log(`Tournament clicked:`, tournament);
  loadTournamentDetailsPage(tournament);
}

function loadTournamentDetailsPage(tournament, addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "tournament-detail",
          tournament: tournament,
        },
        ""
      );
    }

    const template = document.getElementById("tournament-detail-template");
    if (!template) {
      throw new Error("Tournament detail template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    const content = document.importNode(template.content, true);

    // Fill in all tournament details
    const container = content.querySelector(".tournament-detail-container");

    // Basic info
    container.querySelector(".tournament-detail-name").textContent = tournament.name;
    container.querySelector(".tournament-detail-description").textContent = tournament.description;

    // Dates
    container.querySelector(".tournament-detail-closing-date").textContent = formatDate(
      tournament.closingRegistrationDate,
      { showTime: true }
    );
    container.querySelector(".tournament-detail-starting-date").textContent = formatDate(tournament.startingDate, {
      showTime: true,
    });

    // Type
    container.querySelector(".tournament-detail-type").textContent = `Type: ${tournament.type}`;

    // Participants
    const participantsDiv = container.querySelector(".tournament-detail-participants");
    tournament.participants.forEach((participant) => {
      const p = document.createElement("div");
      p.textContent = participant;
      participantsDiv.appendChild(p);
    });

    // Handle timetable status and action button
    const timetableStatus = container.querySelector(".tournament-detail-timetable-status");
    const actionButton = container.querySelector(".tournament-detail-action-btn");
    const now = new Date();
    const closingDate = new Date(tournament.closingRegistrationDate);

    if (tournament.isTimetableAvailable) {
      // Hide the registration status since timetable is available
      timetableStatus.textContent = tournament.isUserEnrolled ? "You're in! 🎮" : "Watch the matches! 🎯";
      actionButton.textContent = "TIMETABLE";
      actionButton.addEventListener("click", () => {
        // TODO: Handle timetable view
        console.log("Show timetable for:", tournament.name);
      });

      // Show next match info only if user is enrolled
      if (tournament.isUserEnrolled) {
        const nextMatchDiv = container.querySelector(".tournament-detail-next-match");
        nextMatchDiv.style.display = "block";
        const nextMatchInfo = container.querySelector(".tournament-detail-next-match-info");
        // TODO: Add next match information when available
        nextMatchInfo.textContent = "Next match details coming soon...";
      }
    } else {
      // Show appropriate message when timetable is not available
      if (now < closingDate) {
        if (tournament.isUserEnrolled) {
          actionButton.textContent = "LEAVE";
          timetableStatus.textContent = "You're in! 🎮";
          actionButton.addEventListener("click", () => {
            handleTournamentAction(tournament.name, true);
          });
        } else {
          actionButton.textContent = "JOIN";
          timetableStatus.textContent = "Join the tournament! 🏆";
          actionButton.addEventListener("click", () => {
            handleTournamentAction(tournament.name, false);
          });
        }
        // Add message about timetable
        const timetableMsg = document.createElement("div");
        timetableMsg.className = "tournament-detail-timetable-info";
        timetableMsg.textContent = "The timetable will be available after the registration closing";
        container.querySelector(".tournament-detail-info").appendChild(timetableMsg);
      } else {
        timetableStatus.textContent = "Timetable will be available soon";
        actionButton.style.display = "none";
      }
    }

    mainContent.appendChild(content);
  } catch (error) {
    console.error("Error loading tournament details:", error);
    showToast("Failed to load tournament details", true);
  }
}

function showToast(message, isError = false) {
  try {
    const template = document.getElementById("toast-template");
    if (!template) {
      throw new Error("Toast template not found");
    }

    const toast = document.importNode(template.content, true);
    const messageElement = toast.querySelector(".toast-message");

    if (!messageElement) {
      throw new Error("Toast message element not found in template");
    }

    messageElement.textContent = message;

    if (isError) {
      messageElement.style.color = "red";
    }

    document.body.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
      const toastElement = document.querySelector(".toast-container");
      if (toastElement) {
        toastElement.remove();
      }
    }, 2000);
  } catch (error) {
    console.error("Error showing toast:", error);
    // Fallback to console
    console.log(`${isError ? "Error" : "Message"}: ${message}`);
  }
}

async function handleTournamentAction(tournamentName, isEnrolled) {
  try {
    const username = localStorage.getItem("username");
    if (!username) {
      throw new Error("User not logged in");
    }

    switch (CONFIG.DATA_SOURCE) {
      case "API":
        // Future API call
        /*
                await fetch(`${CONFIG.API_BASE_URL}/enroll`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        tournamentName,
                        action: isEnrolled ? 'leave' : 'join'
                    })
                });
                */
        throw new Error("API not implemented yet");

      case "JS":
        // Update our mutable JavaScript array
        const tournament = tournaments.find((t) => t.name === tournamentName);
        if (!tournament) {
          throw new Error("Tournament not found");
        }

        if (isEnrolled) {
          tournament.participants = tournament.participants.filter((p) => p !== username);
        } else {
          if (!tournament.participants.includes(username)) {
            tournament.participants.push(username);
          }
        }
        break;

      case "JSON":
        throw new Error("Cannot modify read-only JSON data");

      default:
        throw new Error(`Invalid data source: ${CONFIG.DATA_SOURCE}`);
    }

    showToast(`Successfully ${isEnrolled ? "left" : "joined"} ${tournamentName}!`);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for toast
    await loadTournamentsPage(); // Reload the page to show changes
  } catch (error) {
    console.error("Error updating tournament enrollment:", error);
    showToast("Failed to update tournament. Please try again.", true);
  }
}

async function loadTournamentsPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "tournaments",
        },
        ""
      );
    }

    const enhancedTournaments = await fetchTournaments(CONFIG.DATA_SOURCE);

    // Filter tournaments based on enrollment
    const openTournaments = enhancedTournaments.filter((t) => !t.isUserEnrolled);
    const enrolledTournaments = enhancedTournaments.filter((t) => t.isUserEnrolled);

    // Render page
    const template = document.getElementById("tournament-template");
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    // Fill open tournaments container
    const openContainer = document.getElementById("open-tournaments");
    if (openTournaments.length > 0) {
      openTournaments.forEach((tournament) => {
        openContainer.appendChild(renderTournamentCard(tournament));
      });
    } else {
      const emptyTournament = {
        name: "No open tournaments available",
        startingDate: new Date(),
        timeLeftToRegistration: "",
      };
      const card = renderTournamentCard(emptyTournament);
      card.querySelector(".tournament-card").classList.add("empty-state");
      openContainer.appendChild(card);
    }

    // Fill enrolled tournaments container
    const enrolledContainer = document.getElementById("enrolled-tournaments");
    if (enrolledTournaments.length > 0) {
      enrolledTournaments.forEach((tournament) => {
        enrolledContainer.appendChild(renderTournamentCard(tournament));
      });
    } else {
      const emptyTournament = {
        name: "You're not enrolled in any tournaments",
        startingDate: new Date(), // doesn't matter as it won't be shown
        timeLeftToRegistration: "",
      };
      const card = renderTournamentCard(emptyTournament);
      card.querySelector(".tournament-card").classList.add("empty-state");
      enrolledContainer.appendChild(card);
    }
  } catch (error) {
    console.error("Error loading tournaments:", error);
    showToast("Failed to load tournaments. Please try again later.", true);
  }
}

function updateTournamentDetail(tournament) {
  const container = document.querySelector(".tournament-detail-container");

  // Fill in basic info
  container.querySelector(".tournament-detail-name").textContent = tournament.name;
  container.querySelector(".tournament-detail-description").textContent = tournament.description;
  container.querySelector(".tournament-detail-closing-date").textContent = formatDate(
    tournament.closingRegistrationDate,
    { showTime: true }
  );
  container.querySelector(".tournament-detail-starting-date").textContent = formatDate(tournament.startingDate, {
    showTime: true,
  });
  container.querySelector(".tournament-detail-type").textContent = tournament.type;

  // Fill participants
  const participantsDiv = container.querySelector(".tournament-detail-participants");
  tournament.participants.forEach((participant) => {
    const p = document.createElement("div");
    p.textContent = participant;
    participantsDiv.appendChild(p);
  });

  // Rest of the function remains the same but with updated class names...
}

// Initial state on load
window.addEventListener("load", () => {
  const username = localStorage.getItem("username");
  const initialView = username ? "home" : "auth";
  history.replaceState({ view: initialView }, "");

  // Load initial view
  if (username) {
    loadHomePage();
  } else {
    loadAuthPage();
  }
});

// Handle browser back/forward
window.addEventListener("popstate", async (event) => {
  event.preventDefault();

  if (event.state) {
    switch (event.state.view) {
      case "auth":
        await loadAuthPage(false);
        break;
      case "home":
        await loadHomePage(false);
        break;
      case "tournaments":
        await loadTournamentsPage(false);
        break;
      case "tournament-detail":
        if (event.state.tournament) {
          await loadTournamentDetailsPage(event.state.tournament, false);
        } else {
          console.error("No tournament data in state");
          await loadTournamentsPage(false);
        }
        break;
      default:
        await loadHomePage(false);
    }
  } else {
    const username = localStorage.getItem("username");
    if (username) {
      await loadHomePage(false);
    } else {
      await loadAuthPage(false);
    }
  }
});

// Prevent default link behavior for navigation
document.addEventListener("click", (event) => {
  // Check if the clicked element is a navigation link
  if (event.target.matches("[data-nav]")) {
    event.preventDefault();
    const view = event.target.getAttribute("data-nav");
    switch (view) {
      case "home":
        loadHomePage();
        break;
      case "tournaments":
        loadTournamentsPage();
        break;
      case "tournament-detail":
        loadTournamentDetailsPage(event.target.dataset.tournament);
        break;
      default:
        loadHomePage();
    }
  }
});
