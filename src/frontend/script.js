async function handleCreateTournamentSubmit(tournamentData) {
  try {
    switch (CONFIG.DATA_SOURCE) {
      case "API":
        // Future API call
        /*
				  const response = await fetch(`${CONFIG.API_BASE_URL}/tournaments`, {
					  method: 'POST',
					  headers: {
						  'Content-Type': 'application/json',
						  // Add any auth headers if needed
					  },
					  body: JSON.stringify(tournamentData)
				  });
  
				  if (!response.ok) {
					  throw new Error('Failed to create tournament');
				  }
				  */
        throw new Error("API not implemented yet");

      case "JS":
        // Add to our mutable JavaScript array
        const newTournament = {
          name: tournamentData.name,
          description: tournamentData.description,
          startingDate: tournamentData.startingDate,
          closingRegistrationDate: tournamentData.registrationClose,
          registrationStartDate: tournamentData.registrationStart,
          isTimetableAvailable: false,
          participants: [],
          type: tournamentData.type,
          visibility: tournamentData.visibility,
          gameMode: tournamentData.gameMode,
          timetable: null,
        };

        tournaments.push(newTournament);
        break;

      case "JSON":
        throw new Error("Cannot modify read-only JSON data");

      default:
        throw new Error(`Invalid data source: ${CONFIG.DATA_SOURCE}`);
    }

    showToast("Tournament created successfully!");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for toast
    loadTournamentsPage(); // Go back to tournaments list
  } catch (error) {
    console.error("Error creating tournament:", error);
    showToast("Failed to create tournament. Please try again.", true);
  }
}

function loadCreateTournamentPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "create-tournament",
        },
        ""
      );
    }

    const template = document.getElementById("create-tournament-template");
    if (!template) {
      throw new Error("Create tournament template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    // Add event listeners for form interactions
    const form = mainContent.querySelector(".create-tournament-form");
    const cancelButton = mainContent.querySelector("#cancel-tournament");

    // Handle cancel button - go back in history
    cancelButton.addEventListener("click", () => {
      history.back(); // This is equivalent to clicking browser's back button
    });

    // Handle form submission
    form.addEventListener("submit", async (event) => {
      // We need to prevent the dafatul behaviour cuase it wourl make a POST request to the form's action UR
      // Breaking the SPA flow
      event.preventDefault(); // Prevent default form submission
      // Without preventDefault():
      // 1. Form would submit traditionally
      // 2. Page would reload
      // 3. Our SPA state would be lost
      // 4. User would see a new page load

      // Create FormData object from the form
      const formData = new FormData(event.target);

      // Convert FormData to a regular object
      const tournamentData = {
        name: formData.get("name"),
        description: formData.get("description"),
        type: formData.get("type"),
        startingDate: formData.get("startingDate"),
        registrationStart: formData.get("registrationStart"),
        registrationClose: formData.get("registrationClose"),
        visibility: formData.get("visibility"),
        gameMode: formData.get("gameMode"),
        // Add allowed users if private
        allowedUsers: formData.get("visibility") === "private" ? Array.from(allowedUsers) : [],
      };

      await handleCreateTournamentSubmit(tournamentData);
    });
  } catch (error) {
    console.error("Error loading create tournament page:", error);
    showToast("Failed to load create tournament page", true);
  }
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
      case "create-tournament":
        loadCreateTournamentPage(false);
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
      case "timetable":
        if (event.state.tournamentName) {
          loadTimetablePage(event.state.tournamentName, false);
        } else {
          console.error("No tournament name in state");
          loadTournamentsPage(false);
        }
        break;
      default:
        loadHomePage();
    }
  }
});

async function loadTimetablePage(tournamentName, addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "timetable",
          tournamentName: tournamentName,
        },
        ""
      );
    }

    // Find tournament with timetable
    const tournament = tournaments.find((t) => t.name === tournamentName);
    if (!tournament || !tournament.timetable) {
      throw new Error("Timetable not found");
    }

    // Get and clone the template
    const template = document.getElementById("tournament-timetable-template");
    if (!template) {
      throw new Error("Timetable template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    const content = document.importNode(template.content, true);

    // Set tournament name and title
    const tournamentNameElement = content.querySelector(".tournament-timetable-tournament-name");
    tournamentNameElement.textContent = tournament.name; // Changed this line

    mainContent.appendChild(content);

    const roundsContainer = document.getElementById("tournament-timetable-rounds");
    const roundTemplate = document.getElementById("tournament-timetable-round-template");
    const gameTemplate = document.getElementById("tournament-timetable-game-template");

    // Populate rounds and games
    tournament.timetable.rounds.forEach((round) => {
      // Clone and populate round template
      const roundElement = document.importNode(roundTemplate.content, true);
      roundElement.querySelector(".tournament-timetable-round-title").textContent = `ROUND ${round.round}`;

      const gamesContainer = roundElement.querySelector(".tournament-timetable-games");

      // Add games to round
      round.games.forEach((game) => {
        const gameElement = document.importNode(gameTemplate.content, true);

        // Format and set date/time
        const gameDate = new Date(game.date);
        gameElement.querySelector(".tournament-timetable-game-date").textContent = gameDate.toLocaleDateString();
        gameElement.querySelector(".tournament-timetable-game-time").textContent = gameDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Set players
        const players = gameElement.querySelectorAll(".tournament-timetable-game-player");
        players[0].textContent = game.player1 || "TBD";
        players[1].textContent = game.player2 || "TBD";

        // Set result if exists
        if (game.score) {
          gameElement.querySelector(".tournament-timetable-game-result").textContent = game.score;
        }

        // Set status
        const statusElement = gameElement.querySelector(".tournament-timetable-game-status");
        if (game.winner) {
          statusElement.textContent = "Completed";
          // Highlight winner
          const winnerIndex = game.winner === game.player1 ? 0 : 1;
          players[winnerIndex].classList.add("tournament-timetable-game-player--winner");
        } else {
          const now = new Date();
          statusElement.textContent = now > gameDate ? "In Progress" : "Scheduled";
        }

        // Highlight current user's games
        const currentUser = localStorage.getItem("username");
        if (game.player1 === currentUser || game.player2 === currentUser) {
          gameElement.querySelector(".tournament-timetable-game").classList.add("tournament-timetable-game--user-game");
        }

        gamesContainer.appendChild(gameElement);
      });

      roundsContainer.appendChild(roundElement);
    });
  } catch (error) {
    console.error("Error loading timetable:", error);
    showToast("Failed to load timetable", true);
  }
}
