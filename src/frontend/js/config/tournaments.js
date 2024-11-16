import { CONFIG } from "./constants.js";

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
export const tournaments = [
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

export const timetableExample42Berlin = {
  tournamentName: "42Berlin",
  type: "single_elimination",
  rounds: [
    {
      round: 1,
      games: [
        {
          uuid: "game1_1",
          date: "2024-03-20T14:00:00Z",
          player1: "User1",
          player2: "User2",
          nextGameUuid: "game2_1",
          score: null,
          winner: null,
        },
        {
          uuid: "game1_2",
          date: "2024-03-20T14:30:00Z",
          player1: "User3",
          player2: "User4",
          nextGameUuid: "game2_1",
          score: null,
          winner: null,
        },
        {
          uuid: "game1_3",
          date: "2024-03-20T15:00:00Z",
          player1: "User5",
          player2: "User6",
          nextGameUuid: "game2_2",
          score: null,
          winner: null,
        },
        {
          uuid: "game1_4",
          date: "2024-03-20T15:30:00Z",
          player1: "User7",
          player2: localStorage.getItem("username"), // Current user
          nextGameUuid: "game2_2",
          score: null,
          winner: null,
        },
      ],
    },
    {
      round: 2,
      games: [
        {
          uuid: "game2_1",
          date: "2024-03-21T14:00:00Z",
          player1: null, // Winner of game1_1
          player2: null, // Winner of game1_2
          sourceGames: ["game1_1", "game1_2"],
          nextGameUuid: "game3_1",
          score: null,
          winner: null,
        },
        {
          uuid: "game2_2",
          date: "2024-03-21T14:30:00Z",
          player1: null, // Winner of game1_3
          player2: null, // Winner of game1_4
          sourceGames: ["game1_3", "game1_4"],
          nextGameUuid: "game3_1",
          score: null,
          winner: null,
        },
      ],
    },
    {
      round: 3,
      games: [
        {
          uuid: "game3_1",
          date: "2024-03-22T14:00:00Z",
          player1: null, // Winner of game2_1
          player2: null, // Winner of game2_2
          sourceGames: ["game2_1", "game2_2"],
          nextGameUuid: null, // Final game
          score: null,
          winner: null,
        },
      ],
    },
  ],
};

// This function only initializes mock data when using JS source
// When using API, the data comes directly from the backend
export function initializeTournaments(source = CONFIG.CURRENT_SOURCE) {
  // Skip initialization if using API source
  if (source === CONFIG.DATA_SOURCE.API) {
    return;
  }

  // Initialize JS mock data with relative dates
  const now = new Date();

  // Set timetable for Berlin tournament
  tournaments[3].timetable = timetableExample42Berlin;

  // Update starting dates
  tournaments[0].startingDate = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(); // Wimbledon: 6 days from now
  tournaments[1].startingDate = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(); // US Open: 3 hours from now
  tournaments[2].startingDate = new Date(now.getTime() + 40 * 60 * 1000).toISOString(); // 42 Network: 40 minutes from now
  tournaments[3].startingDate = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // 42 Berlin: started 30 minutes ago

  // Update registration dates
  tournaments[0].closingRegistrationDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 1 day before start
  tournaments[1].closingRegistrationDate = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 1 hour before start
  tournaments[2].closingRegistrationDate = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 10 minutes before start
  tournaments[3].closingRegistrationDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // closed yesterday

  addCurrentUserToTournaments();
}

function addCurrentUserToTournaments() {
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
}
