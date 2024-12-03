// Configuration for data source and state management
export const CONFIG = {
  DATA_SOURCE: {
    API: "API",
    JS: "JS",
  },
  CURRENT_SOURCE: "API",
  // API BASE URL is the same as where the page is hosted
  // if the page is opened at http://localhost:1234 then
  // API_BASE_URL is also http://localhost:1234
  API_BASE_URL: window.location.origin,
  API_ENDPOINTS: {
    TOURNAMENTS: "/api/game/tournaments",
  },
};

export const LOCAL_STORAGE_KEYS = {
  USER_ID: "pongUserId",
  USERNAME: "pongUsername",
  THEME: "pongTheme",
};

export const ASSETS = {
  IMAGES: {
    DEFAULT_AVATAR: "../../../../media/avatars/default/default.jpeg",
  },
};

export const NAVIGATION = {
  VIEWS_WITH_TAB: ["home", "tournaments", "profile", "chat", "users"],
  DEFAULT_VIEW: "home",
};

/* Not used atm */
export const PROFILE_ICONS = {
  FRIEND: {
    ADD: "add_circle", // Alternative: 'person_add'
    REMOVE: "cancel", // Alternative: 'person_remove'
  },
  BLOCK: {
    BLOCK: "block", // Alternative: 'person_cancel'
    UNBLOCK: "person_add", // Alternative: 'check_circle'
  },
  ONLINE: "circle", // Will be styled with CSS for different states
  PLAY: "play_circle", // Alternative: 'sports_esports'
  CHAT: "maps_ugc", // Alternative: 'chat_bubble'
};

/* GameSettings AKA Game coordinator in the front-end*/
// config/constants.js

export const GAME_MODES = ["classic", "regular", "circular", "irregular"];

export const DEFAULT_GAME_SETTINGS = {
  playerId: "",
  numPlayers: 2,
  numSides: 22,
  numBalls: 1,
  shape: "regular",
  scoreMode: "classic",
  mode: "regular",
};

export const PLAYER_LIMITS = {
  min: 1,
  max: 8, // You can adjust this as needed to reflect the overall max across game modes.
};

export const GAME_CONFIGS = {
  classic: {
    type: "classic",
    sides: 10,
    maxPlayers: 2,
    description: "Classic 2-player pong with 2 paddles and 2 walls",
  },
  regular: {
    type: "classic",
    sides: 11,
    maxPlayers: 4,
    description: "Regular polygon with all sides playable",
  },
  circular: {
    type: "circular",
    sides: 12,
    maxPlayers: 8,
    description: "Circular arena with curved paddles and sides",
  },
  irregular: {
    type: "classic",
    sides: 13,
    maxPlayers: 6,
    description: "Irregular polygon shape with customizable sides",
    shapes: {
      regular: "Standard polygon",
      irregular: "Slightly deformed polygon with balanced sides",
      star: "Star-like shape with alternating long and short sides",
      crazy: "Extreme deformation with sharp transitions",
    },
  },
};
