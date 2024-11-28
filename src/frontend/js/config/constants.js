// Configuration for data source and state management
export const CONFIG = {
  DATA_SOURCE: {
    API: "API",
    JS: "JS",
  },
  CURRENT_SOURCE: "API",
  // API_BASE_URL: "http://localhost:8080",
  // API depends on hostname, TODO: must become https
  API_BASE_URL: `http://${window.location.hostname}:8000`
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
  VIEWS_WITH_TAB: ["home", "tournaments", "profile", "chat"],
  DEFAULT_VIEW: "home",
};
