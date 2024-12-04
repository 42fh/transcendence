import { CONFIG, LOCAL_STORAGE_KEYS } from "../config/constants.js";
import { tournaments } from "../config/tournaments.js";
import { showToast } from "../utils/toast.js";
import { loadTournamentsPage } from "../views/tournaments.js";
import { updateGlobalTournaments } from "../store/globals.js";
import { manageJWT } from "./authService.js";
// Fetch and enhance tournaments
export async function fetchTournaments(source = CONFIG.CURRENT_SOURCE) {
  try {
    let rawTournaments;

    switch (source) {
      case CONFIG.DATA_SOURCE.API:
        const accessToken = await manageJWT();

        const response = await fetch(
          `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TOURNAMENTS}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Raw tournaments from API:", data.tournaments);
        rawTournaments = data.tournaments;
        break;

      case CONFIG.DATA_SOURCE.JS:
        rawTournaments = tournaments;
        break;

      default:
        throw new Error(`Invalid source specified: ${source}`);
    }
    const enhancedTournaments = rawTournaments.map(enhanceTournament);
    updateGlobalTournaments(enhancedTournaments);
    return enhancedTournaments;
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    throw error;
  }
}

// Enhance a single tournament with derived data
export function enhanceTournament(tournament) {
  const username = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);

  console.log(`Checking enrollment for tournament ${tournament.name}:`); // New log
  console.log("Current username:", username); // New log
  console.log("Tournament participants:", tournament.participants); // New log

  return {
    ...tournament,
    isRegistrationOpen: checkRegistrationOpen(
      tournament.closingRegistrationDate
    ),
    timeLeftToRegistration: calculateTimeLeft(
      tournament.closingRegistrationDate
    ),
    isUserEnrolled: checkUserEnrollment(
      tournament.participants,
      localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME)
    ),
  };
}

function checkRegistrationOpen(closingDate) {
  return new Date(closingDate) > new Date();
}

function calculateTimeLeft(closingDate) {
  const now = new Date();
  const closing = new Date(closingDate);
  const diff = closing - now;

  if (diff <= 0) return "<0 m";

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

export async function handleTournamentAction(tournament, isEnrolled) {
  try {
    const username = localStorage.getItem(LOCAL_STORAGE_KEYS.USERNAME);
    if (!username) {
      throw new Error("User not logged in");
    }

    switch (CONFIG.CURRENT_SOURCE) {
      case CONFIG.DATA_SOURCE.API:
        const accessToken = await manageJWT();

        const response = await fetch(
          `${CONFIG.API_BASE_URL}/api/game/tournaments/${tournament.id}/enrollment/`,
          {
            method: isEnrolled ? "DELETE" : "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update enrollment");
        }
        break;

      case CONFIG.DATA_SOURCE.JS:
        // Existing JS mock implementation
        const foundTournament = tournaments.find((t) => t.id === tournament.id);
        if (!foundTournament) {
          throw new Error("Tournament not found");
        }

        if (isEnrolled) {
          foundTournament.participants = foundTournament.participants.filter(
            (p) => p !== username
          );
        } else {
          if (!foundTournament.participants.includes(username)) {
            foundTournament.participants.push(username);
          }
        }
        break;

      default:
        throw new Error(`Invalid data source: ${CONFIG.DATA_SOURCE}`);
    }

    showToast(`Successfully ${isEnrolled ? "left" : "joined"} tournament!`);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for toast
    await loadTournamentsPage(); // Reload the page to show changes
  } catch (error) {
    console.error("Error updating tournament enrollment:", error);
    showToast("Failed to update tournament. Please try again.", true);
  }
}

export async function handleCreateTournamentSubmit(tournamentData) {
  try {
    switch (CONFIG.CURRENT_SOURCE) {
      case CONFIG.DATA_SOURCE.API:
        const accessToken = await manageJWT();

        const response = await fetch(
          `${CONFIG.API_BASE_URL}/api/game/tournaments/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(tournamentData),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create tournament");
        }
        break;

      case CONFIG.DATA_SOURCE.JS:
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
        throw new Error(`Invalid data source: ${CONFIG.CURRENT_SOURCE}`);
    }

    showToast("Tournament created successfully!");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for toast
    loadTournamentsPage(); // Go back to tournaments list
  } catch (error) {
    console.error("Error creating tournament:", error);
    showToast("Failed to create tournament. Please try again.", true);
  }
}
