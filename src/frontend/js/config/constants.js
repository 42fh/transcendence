// Configuration for data source and state management
export const CONFIG = {
  DATA_SOURCE: {
    API: "API",
    JS: "JS",
  },
  CURRENT_SOURCE: "API",
  API_BASE_URL: "http://localhost:8080",
  API_ENDPOINTS: {
    TOURNAMENTS: "/api/game/tournaments",
  },
};

export const LOCAL_STORAGE_KEYS = {
  USER_ID: "pongUserId",
  USERNAME: "pongUsername",
  THEME: "pongTheme",
};
