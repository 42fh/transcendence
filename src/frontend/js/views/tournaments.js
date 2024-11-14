import { CONFIG } from "../config/constants.js";
import { fetchTournaments } from "../services/tournamentService.js";
import { formatDate } from "../utils/date.js";
import { showToast } from "../utils/toast.js";
import { loadTournamentDetailsPage } from "./tournament-detail.js";
import { loadCreateTournamentPage } from "./tournament-create.js";

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

function handleTournamentClick(tournament) {
  console.log(`Tournament clicked:`, tournament);
  loadTournamentDetailsPage(tournament);
}

export async function loadTournamentsPage(addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "tournaments",
        },
        ""
      );
    }

    const template = document.getElementById("tournament-template");
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    mainContent.appendChild(document.importNode(template.content, true));

    // Add event listener to the existing create tournament button
    const createTournamentButton = document.getElementById("create-tournament");
    if (createTournamentButton) {
      createTournamentButton.addEventListener("click", () => {
        loadCreateTournamentPage();
      });
    }

    const enhancedTournaments = await fetchTournaments(CONFIG.CURRENT_SOURCE);

    // Filter tournaments based on enrollment
    const openTournaments = enhancedTournaments.filter((t) => !t.isUserEnrolled);
    const enrolledTournaments = enhancedTournaments.filter((t) => t.isUserEnrolled);

    // Add event listener for create tournament button
    createTournamentButton.addEventListener("click", () => {
      loadCreateTournamentPage();
    });

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
