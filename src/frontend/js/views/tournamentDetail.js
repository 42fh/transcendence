import { formatDate } from "../utils/date.js";
import { showToast } from "../utils/toast.js";
import { loadTimetablePage } from "./timetable.js";
import { handleTournamentAction } from "../services/tournamentService.js";
import { updateActiveNavItem } from "../components/bottomNav.js";

export function loadTournamentDetailsPage(tournament, addToHistory = true) {
  try {
    if (addToHistory) {
      history.pushState(
        {
          view: "tournament-detail",
          tournament: tournament,
        },
        ""
      );
      updateActiveNavItem("tournament-detail");
    }
    if (!addToHistory) updateActiveNavItem("tournament-detail");

    const template = document.getElementById("tournament-detail-template");
    if (!template) {
      throw new Error("Tournament detail template not found");
    }

    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = "";
    const content = document.importNode(template.content, true);

    // Fill in all tournament details
    const container = content.querySelector(".tournament-detail-container");
    updateTournamentDetail(container, tournament);

    mainContent.appendChild(content);
  } catch (error) {
    console.error("Error loading tournament details:", error);
    showToast("Failed to load tournament details", true);
  }
}

// Private helper function - not exported
function updateTournamentDetail(container, tournament) {
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

  setupTimetableAndActions(container, tournament);
}

// Private helper function - not exported
function setupTimetableAndActions(container, tournament) {
  const timetableStatus = container.querySelector(".tournament-detail-timetable-status");
  const actionButton = container.querySelector(".tournament-detail-action-btn");
  const now = new Date();
  const closingDate = new Date(tournament.closingRegistrationDate);

  if (tournament.isTimetableAvailable) {
    handleTimetableAvailable(container, timetableStatus, actionButton, tournament);
  } else {
    handleTimetableUnavailable(container, timetableStatus, actionButton, tournament, now, closingDate);
  }
}

// Private helper function - not exported
function handleTimetableAvailable(container, timetableStatus, actionButton, tournament) {
  timetableStatus.textContent = tournament.isUserEnrolled ? "You're in! 🎮" : "Watch the matches! 🎯";
  actionButton.textContent = "TIMETABLE";
  actionButton.addEventListener("click", () => {
    loadTimetablePage(tournament.name);
  });

  if (tournament.isUserEnrolled) {
    setupNextMatchInfo(container, tournament);
  }
}

// Private helper function - not exported
function handleTimetableUnavailable(container, timetableStatus, actionButton, tournament, now, closingDate) {
  if (now < closingDate) {
    if (tournament.isUserEnrolled) {
      setupEnrolledState(timetableStatus, actionButton, tournament);
    } else {
      setupUnenrolledState(timetableStatus, actionButton, tournament);
    }
    addTimetableMessage(container);
  } else {
    timetableStatus.textContent = "Timetable will be available soon";
    actionButton.style.display = "none";
  }
}

// Private helper functions - not exported
function setupEnrolledState(timetableStatus, actionButton, tournament) {
  actionButton.textContent = "LEAVE";
  timetableStatus.textContent = "You're in! 🎮";
  actionButton.addEventListener("click", () => {
    handleTournamentAction(tournament, true);
  });
}

function setupUnenrolledState(timetableStatus, actionButton, tournament) {
  actionButton.textContent = "JOIN";
  timetableStatus.textContent = "Join the tournament! 🏆";
  actionButton.addEventListener("click", () => {
    handleTournamentAction(tournament, false);
  });
}

function addTimetableMessage(container) {
  const timetableMsg = document.createElement("div");
  timetableMsg.className = "tournament-detail-timetable-info";
  timetableMsg.textContent = "The timetable will be available after the registration closing";
  container.querySelector(".tournament-detail-info").appendChild(timetableMsg);
}

function setupNextMatchInfo(container, tournament) {
  const nextMatchDiv = container.querySelector(".tournament-detail-next-match");
  nextMatchDiv.style.display = "block";
  const nextMatchInfo = container.querySelector(".tournament-detail-next-match-info");
  nextMatchInfo.textContent = "Next match details coming soon...";
}
