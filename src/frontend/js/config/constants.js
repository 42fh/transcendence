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

export const GAME_CONFIGS = {
  classic: {
    type: "polygon",
    sides: 4,
    maxPlayers: 2,
    description: "Classic 2-player pong with 2 paddles and 2 walls",
  },
  regular: {
    type: "polygon",
    sides: 4,
    maxPlayers: 4,
    description: "Regular polygon with all sides playable",
  },
  circular: {
    type: "circular",
    sides: 8,
    maxPlayers: 8,
    description: "Circular arena with curved paddles and sides",
  },
  irregular: {
    type: "polygon",
    sides: 6,
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

export const DEFAULT_GAME_SETTINGS = {
  numPlayers: 2,
  numSides: 4,
  numBalls: 1,
  shape: "regular",
  scoreMode: "classic",
  pongType: "classic",
};

/* The config file in the test_frontend  */
export const OLD_CONFIG = {
  API_BASE_URL: "/api", // Base URL for REST API calls
  WS_BASE_URL: "ws://localhost:8000/ws", // Base WebSocket URL
  GAME_MODES: {
    POLYGON: "polygon",
    CIRCULAR: "circular",
  },
  DEFAULT_SETTINGS: {
    PLAYERS: 2,
    BALLS: 1,
    DEBUG: false,
  },
};
