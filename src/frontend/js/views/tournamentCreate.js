import { showToast } from "../utils/toast.js";
import { handleCreateTournamentSubmit } from "../services/tournamentService.js";
import { updateActiveNavItem } from "../components/bottomNav.js";
function setDefaultDates() {
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

  document.getElementById("registration-start").value =
    formatDateForInput(registrationStart);
  document.getElementById("registration-close").value =
    formatDateForInput(registrationEnd);
  document.getElementById("tournament-start").value =
    formatDateForInput(tournamentStart);
}

export function loadCreateTournamentPage(addToHistory = true) {
  try {
    // Always update the active nav item, regardless of how we got here
    updateActiveNavItem("create-tournament");

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
    initLocationToggle();
    initTimingToggle();
    initPlayersToggle();

    // Set default location to "local"
    const locationInput = document.getElementById("location-value");
    locationInput.value = "local"; // Set default location to local
    // Trigger the location toggle to disable relevant fields
    initLocationToggle(); // Call again to apply the default setting

    // Disable timing, visibility, and game mode fields initially
    const typeInput = document.getElementById("tournament-type");
    const visibilityInput = document.getElementById("tournament-visibility");
    const gameModeInput = document.getElementById("game-mode");
    if (typeInput) typeInput.disabled = true; // Disable type input
    if (visibilityInput) visibilityInput.disabled = true; // Disable visibility input
    if (gameModeInput) gameModeInput.disabled = true; // Disable game mode input

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
        location: formData.get("location"), // Add location
        timing: formData.get("timing"), // Add timing
        playersNumber: formData.get("playersNumber"),
        // Only include dates if timing is "planned"
        ...(formData.get("timing") === "planned" && {
          startingDate: formData.get("startingDate"),
          registrationStart: formData.get("registrationStart"),
          registrationClose: formData.get("registrationClose"),
        }),
        visibility: formData.get("visibility"),
        gameMode: formData.get("gameMode"),
        allowedUsers:
          formData.get("visibility") === "private"
            ? Array.from(allowedUsers)
            : [],
      };

      await handleCreateTournamentSubmit(tournamentData);
    });
  } catch (error) {
    console.error("Error loading create tournament page:", error);
    showToast("Failed to load create tournament page", true);
  }
}

function initLocationToggle() {
  const locationToggle = document.getElementById("location-toggle");
  const locationButtons = locationToggle.querySelectorAll(
    ".create-tournament-toggle__btn"
  );
  const locationInput = document.getElementById("location-value");
  const typeInput = document.getElementById("tournament-type");
  const visibilityInput = document.getElementById("tournament-visibility");
  const gameModeInput = document.getElementById("game-mode");

  locationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      locationButtons.forEach((btn) =>
        btn.classList.remove("create-tournament-toggle__btn--active")
      );
      button.classList.add("create-tournament-toggle__btn--active");
      locationInput.value = button.dataset.value;

      if (locationInput.value === "local") {
        if (typeInput) typeInput.disabled = true;
        if (visibilityInput) visibilityInput.disabled = true;
      } else if (locationInput.value === "remote") {
        if (typeInput) typeInput.disabled = false;
        if (visibilityInput) visibilityInput.disabled = false;
        if (gameModeInput) {
          gameModeInput.value = "1vs 1";
          gameModeInput.disabled = false;
        }
      } else {
        if (typeInput) typeInput.disabled = false;
        if (visibilityInput) visibilityInput.disabled = false;
      }
    });
  });
}

// function initTimingToggle() {
//   const timingToggle = document.getElementById("timing-toggle");
//   console.log("Timing toggle:", timingToggle); // Debug
//   const timingButtons = timingToggle.querySelectorAll(".create-tournament-toggle__btn");
//   console.log("Timing buttons:", timingButtons); // Debug
//   const timingInput = document.getElementById("timing-value");

//   timingButtons.forEach((button) => {
//     button.addEventListener("click", () => {
//       console.log("Button clicked:", button.dataset.value); // Debug

//       timingButtons.forEach((btn) => btn.classList.remove("create-tournament-toggle__btn--active"));
//       button.classList.add("create-tournament-toggle__btn--active");
//       timingInput.value = button.dataset.value;

//       const plannedDates = document.getElementById("planned-dates");
//       const dateInputs = plannedDates.querySelectorAll('input[type="datetime-local"]');
//       console.log("Planned dates element:", plannedDates); // Debug

//       if (button.dataset.value === "planned") {
//         plannedDates.classList.remove("create-tournament-form-group--hidden");
//         dateInputs.forEach((input) => (input.required = true));
//         setDefaultDates();
//       } else {
//         plannedDates.classList.add("create-tournament-form-group--hidden");
//         dateInputs.forEach((input) => (input.required = false));
//       }
//     });
//   });
// }

function initTimingToggle() {
  const timingToggle = document.getElementById("timing-toggle");
  const timingButtons = timingToggle.querySelectorAll(
    ".create-tournament-toggle__btn"
  );
  const timingInput = document.getElementById("timing-value"); // Now it will find the input

  timingButtons.forEach((button) => {
    button.addEventListener("click", () => {
      timingButtons.forEach((btn) =>
        btn.classList.remove("create-tournament-toggle__btn--active")
      );
      button.classList.add("create-tournament-toggle__btn--active");
      timingInput.value = button.dataset.value;

      const plannedDates = document.getElementById("planned-dates");
      const dateInputs = plannedDates.querySelectorAll(
        'input[type="datetime-local"]'
      );

      if (button.dataset.value === "planned") {
        plannedDates.classList.remove("create-tournament-form-group--hidden");
        dateInputs.forEach((input) => (input.required = true));
        setDefaultDates();
      } else {
        plannedDates.classList.add("create-tournament-form-group--hidden");
        dateInputs.forEach((input) => (input.required = false));
      }
    });
  });
}

function initPlayersToggle() {
  const playersToggle = document.getElementById("players-toggle");
  const playerButtons = playersToggle.querySelectorAll(
    ".create-tournament-toggle__btn"
  );
  const playersInput = document.getElementById("players-value");

  playerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      playerButtons.forEach((btn) =>
        btn.classList.remove("create-tournament-toggle__btn--active")
      );
      button.classList.add("create-tournament-toggle__btn--active");
      playersInput.value = button.dataset.value;
    });
  });
}
