import { showToast } from "../utils/toast.js";
import { handleCreateTournamentSubmit } from "../services/tournamentService.js";

function setDefaultDates() {
  // Get current date and time
  const now = new Date();

  // Registration start: now
  const registrationStart = now;

  // Registration end: 7 days from now
  const registrationEnd = new Date(now);
  registrationEnd.setDate(now.getDate() + 7);

  // Tournament start: 1 day after registration ends
  const tournamentStart = new Date(registrationEnd);
  tournamentStart.setDate(registrationEnd.getDate() + 1);

  // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
  const formatDateForInput = (date) => {
    return date.toISOString().slice(0, 16);
  };

  // Set the values with correct IDs
  document.getElementById("registration-start").value = formatDateForInput(registrationStart);
  document.getElementById("registration-close").value = formatDateForInput(registrationEnd);
  document.getElementById("tournament-start").value = formatDateForInput(tournamentStart);
}

export function loadCreateTournamentPage(addToHistory = true) {
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

    // Set default values when page loads
    setDefaultDates(); // Call this after adding content to DOM

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
