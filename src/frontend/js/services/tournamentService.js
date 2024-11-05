import { CONFIG } from "../config/constants.js";
import { tournaments } from "../config/tournaments.js";
import { showToast } from "../utils/toast.js";
import { loadTournamentsPage } from "../views/tournaments.js";

// Fetch and enhance tournaments
export async function fetchTournaments(source = CONFIG.DATA_SOURCE) {
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
export function enhanceTournament(tournament) {
  return {
    ...tournament,
    isRegistrationOpen: checkRegistrationOpen(tournament.closingRegistrationDate),
    timeLeftToRegistration: calculateTimeLeft(tournament.closingRegistrationDate),
    isUserEnrolled: checkUserEnrollment(tournament.participants, localStorage.getItem("username")),
  };
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

export async function handleTournamentAction(tournamentName, isEnrolled) {
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

export async function handleCreateTournamentSubmit(tournamentData) {
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
