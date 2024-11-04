function displayErrorMessage(message) {
  // This is only for the modal
  // TODO: cahnge name and make explicit that it's jus for the modal
  const modalContent = document.getElementById("modal-content");
  const errorElement = document.createElement("p");
  errorElement.style.color = "red";
  errorElement.textContent = message;

  // Clear previous content and add error message
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

// Function to handle form submission for signup/login
async function handleFormSubmit(event, endpoint) {
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
    console.log("Response Status:", response.status); // Log the status code
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
        loadHomeView();
      }, 2000);
    } else {
      const errorResult = await response.json();
      displayErrorMessage(errorResult.error || "An error occurred.");
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    displayErrorMessage("There was an issue submitting the form. Please try again.");
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
    form.addEventListener("submit", (event) => handleFormSubmit(event, endpoint));
  }
}

// Function to open/show the modal (setting visibility and opacity)
function openModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.style.visibility = "visible";
    modalOverlay.style.opacity = "1";
  }
}

// Function to close/hide the modal
function closeModal() {
  const modalOverlay = document.getElementById("modal-overlay");
  if (modalOverlay) {
    modalOverlay.style.visibility = "hidden";
    modalOverlay.style.opacity = "0";
  }
}

// Keep this function as the single place for logout logic
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
      loadSignupLoginView();
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

// Simplify this to only handle view changes
async function loadSignupLoginView() {
  try {
    const response = await fetch("/index.html");
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    document.body.innerHTML = doc.body.innerHTML;
  } catch (error) {
    console.error("Error loading signup/login view:", error);
    displayLogoutError("An error occurred while loading the login page.");
  }
}

function loadHomeView() {
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

// Restructure fake data to be a single array with a status property
const fakeTournaments = [
  {
    date: "7/25 14:00",
    name: "WIMBLEDON",
    timeLeft: "6 d",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    type: "single elimination",
    participants: ["User 1", "User 2", "User 3", "and so on"],
    startDate: "1.11.24",
    status: "open",
  },
  {
    date: "1/89 09:30",
    name: "US OPEN",
    timeLeft: "2 d",
    description: "Lorem ipsum dolor sit amet...",
    type: "single elimination",
    participants: ["User 1", "User 2", "User 3"],
    startDate: "1.11.24",
    status: "open",
  },
  {
    date: "9/9 15:00",
    name: "42 NETWORK",
    timeLeft: "3 h",
    description: "Lorem ipsum dolor sit amet...",
    type: "single elimination",
    participants: ["User 1", "User 2", "User 3"],
    startDate: "1.11.24",
    status: "enrolled",
  },
  {
    date: "1/89 09:30",
    name: "42 BERLIN",
    timeLeft: "Now",
    description: "Lorem ipsum dolor sit amet...",
    type: "single elimination",
    participants: ["User 1", "User 2", "User 3"],
    startDate: "1.11.24",
    status: "enrolled",
  },
];

function renderTournamentCard(tournament) {
  const template = document.getElementById("tournament-card-template");
  const card = document.importNode(template.content, true);

  const cardElement = card.querySelector(".tournament-card");

  cardElement.addEventListener("click", () => {
    handleTournamentClick(tournament);
  });

  cardElement.querySelector(".tournament-card-date").textContent = tournament.date;
  cardElement.querySelector(".tournament-card-name").textContent = tournament.name;
  cardElement.querySelector(".tournament-card-status").textContent = tournament.timeLeft;

  return card;
}

function handleTournamentClick(tournament) {
  console.log(`Tournament clicked:`, tournament);
  loadTournamentDetailsPage(tournament);
}

function loadTournamentDetailsPage(tournament) {
  // Check if the tournament status is "enrolled"
  const isEnrolled = tournament.status === "enrolled";

  // Get the template and create a copy
  const template = document.getElementById("tournament-detail-template");
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = "";
  const content = document.importNode(template.content, true);

  // Fill in the template
  content.querySelector(".tournament-detail-title").textContent = tournament.name;
  content.querySelector(".tournament-detail-description").textContent = tournament.description;

  const participantsList = content.querySelector(".tournament-detail-participants");
  tournament.participants.forEach((participant) => {
    const div = document.createElement("div");
    div.textContent = participant;
    participantsList.appendChild(div);
  });

  content.querySelector(".tournament-detail-start-date").textContent = `Start: ${tournament.startDate}`;
  content.querySelector(".tournament-detail-type").textContent = `Type: ${tournament.type}`;

  const actionButton = content.querySelector(".tournament-detail-action-btn");
  actionButton.textContent = isEnrolled ? "LEAVE TOURNAMENT" : "JOIN TOURNAMENT";
  actionButton.addEventListener("click", () => {
    handleTournamentAction(tournament.name, isEnrolled);
  });

  mainContent.appendChild(content);
}

function showToast(message, isError = false) {
  const template = document.getElementById("toast-template");
  const toast = document.importNode(template.content, true);

  const messageElement = toast.querySelector(".toast-message");
  messageElement.textContent = message;

  if (isError) {
    messageElement.style.color = "red";
  }

  document.body.appendChild(toast);

  // Remove toast after animation
  setTimeout(() => {
    document.querySelector(".toast-container").remove();
  }, 2000);
}

async function handleTournamentAction(tournamentName, isEnrolled) {
  try {
    // Real API call (commented out for now)
    /*
        const response = await fetch('/api/tournaments/enroll/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                tournament_name: tournamentName,
                action: isEnrolled ? 'leave' : 'join'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        */

    // For now, just update the local state
    const tournament = fakeTournaments.find((t) => t.name === tournamentName);
    if (tournament) {
      tournament.status = isEnrolled ? "open" : "enrolled";
      showToast(`Successfully ${isEnrolled ? "left" : "joined"} ${tournamentName}!`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await loadTournamentsPage(); // Reload the page to show changes
    }
  } catch (error) {
    console.error("Error updating tournament enrollment:", error);
    showToast("Failed to update tournament. Please try again.", true);
  }
}

async function loadTournamentsPage() {
  try {
    // Real API call (commented out for now)
    /*
        const response = await fetch('/api/tournaments/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tournaments = await response.json();
        */

    // Using fake data for now
    const openTournaments = fakeTournaments.filter((t) => t.status === "open");
    const enrolledTournaments = fakeTournaments.filter((t) => t.status === "enrolled");

    // Get the template and create a copy
    const template = document.getElementById("tournament-template");
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    // Fill the open tournaments
    const openContainer = document.getElementById("open-tournaments");
    openTournaments.forEach((tournament) => {
      openContainer.appendChild(renderTournamentCard(tournament));
    });

    // Fill the enrolled tournaments
    const enrolledContainer = document.getElementById("enrolled-tournaments");
    enrolledTournaments.forEach((tournament) => {
      enrolledContainer.appendChild(renderTournamentCard(tournament));
    });
  } catch (error) {
    console.error("Error loading tournaments:", error);
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `<p class="error-message">Failed to load tournaments. Please try again later.</p>`;
  }
}
