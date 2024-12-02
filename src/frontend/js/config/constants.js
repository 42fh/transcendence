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
