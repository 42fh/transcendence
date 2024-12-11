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

// export const DEFAULT_GAME_SETTINGS = {
//   numPlayers: 2,
//   numSides: 4,
//   numBalls: 1,
//   shape: "regular",
//   scoreMode: "classic",
//   pongType: "classic",
// };

export const GAME_2D_CONFIG_TYPE_DEFAULT = "classic";

// export const DEFAULT_GAME_2D_SETTING_INPUT_CONSTRAINTS = {
//   players: {
//     min: 2,
//     max: 8,
//     disabled: true,
//     value: 2,
//     getHelpText: function () {
//       return `Min: ${this.min}, Max: ${this.max} players`;
//     },
//   },
//   sides: {
//     min: 3,
//     max: 12,
//     disabled: true,
//     value: 4,
//     getHelpText: function () {
//       return `Min: ${this.min}, Max: ${this.max} sides`;
//     },
//   },
//   balls: {
//     min: 1,
//     max: 4,
//     disabled: true,
//     value: 1,
//     getHelpText: function () {
//       return `Min: ${this.min}, Max: ${this.max} balls`;
//     },
//   },
// };

export const GAME_2D_CONFIG_TYPES = {
  classic: {
    type: "polygon",
    sides: 4,
    players: 2,
    description: "Classic 2-player pong with 2 paddles and 4 walls",
    input_constraints: {
      players: {
        min: 2,
        max: 2,
        disabled: true, // Classic always has 2 players
        value: 2,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} players`;
        },
      },
      sides: {
        min: 4,
        max: 4,
        disabled: true, // Classic always has 4 sides
        value: 4,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} sides`;
        },
      },
      balls: {
        min: 1,
        max: 1,
        disabled: true, // Classic always has 1 ball
        value: 1,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} balls`;
        },
      },
    },
  },
  regular: {
    type: "polygon",
    sides: 4,
    players: 4,
    description: "Regular polygon with all sides playable",
    input_constraints: {
      players: {
        min: 2,
        max: 4,
        disabled: false, // Players can be configured
        value: 4,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} players`;
        },
      },
      sides: {
        min: 3,
        max: 8,
        disabled: false, // Sides can be configured
        value: 4,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} sides`;
        },
      },
      balls: {
        min: 1,
        max: 4,
        disabled: false,
        value: 1,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} balls`;
        },
      },
    },
  },
  circular: {
    type: "circular",
    sides: 8,
    players: 8,
    description: "Circular arena with curved paddles and sides",
    input_constraints: {
      players: {
        min: 2,
        max: 8,
        disabled: false,
        value: 8,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} players`;
        },
      },
      sides: {
        min: 2,
        max: 12,
        disabled: false,
        value: 8,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} sides`;
        },
      },
      balls: {
        min: 1,
        max: 4,
        disabled: false,
        value: 1,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} balls`;
        },
      },
    },
  },
  irregular: {
    type: "polygon",
    sides: 6,
    players: 6,
    description: "Irregular polygon shape with customizable sides",
    input_constraints: {
      players: {
        min: 2,
        max: 6,
        disabled: false,
        value: 6,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} players`;
        },
      },
      sides: {
        min: 3,
        max: 8,
        disabled: false,
        value: 6,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} sides`;
        },
      },
      balls: {
        min: 1,
        max: 4,
        disabled: false,
        value: 1,
        getHelpText: function () {
          return `Min: ${this.min}, Max: ${this.max} balls`;
        },
      },
    },
    shapes: {
      regular: "Standard polygon",
      irregular: "Slightly deformed polygon with balanced sides",
      star: "Star-like shape with alternating long and short sides",
      crazy: "Extreme deformation with sharp transitions",
    },
  },
};

export const CHAT_WS_MSG_TYPE = {
  MESSAGE: "chat_message",
  SYSTEM: "system",
  SELF: "self",
  OTHER: "other",
  MESSAGE_HISTORY: "message_history",
  SEND_NOTIFICATION: "send_notification",
};

export const WS_RECONNECTION = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000,
};
