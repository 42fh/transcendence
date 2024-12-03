# Game Coordinator API Documentation

## HTTP Endpoints

| Endpoint | Method | URL | Description |
|----------|--------|-----|-------------|
| Get All Games | GET | `/` | Retrieve list of all game IDs (not for production) |
| Create Game | POST | `/` | Create a new game and reserve player |
| Join Game | POST | `/{game_id}/player/` | Reserve a place for the player in an existing game |
| Get Waiting Games | GET | `/waiting` | Retrieve list of waiting game IDs |
| Get Game Details | GET | `/{game_id}` | Retrieve details for a specific game (not for production) |


Note: all endpoints are prefixed with `api/game` in urls.py: `path("api/game/", include("game.urls"))`

### Create Game
This endpoint creates a new game and reserves the player for the created game. If successful, the endpoint returns the websocket URLs, and the client only has to connect to them.

- **URL**: `/`  
  *(The root URL is already prefixed with `api/game`)*
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:  
  The request body must include at least one field, `mode`. The default variant is selected for the specified mode.
  ```json
  {
      "mode": "regular | classic | circular | irregular"
  }
  ```
- **Success Response**:
  - Code: `201`
  - Content:
    ```json
    {
        "available": true,
        "ws_url": "ws://localhost:8000/ws/game/{game_id}/",
        "message": "NEW Game created successfully! Joined Game."
    }
    ```
- **Error Responses**:
  - `401`: Unauthorized - missing authentication
  - `409`: Player already in an active game
  - `400`: Invalid game mode
  - `415`: Invalid content type
  - `500`: Game creation failed

### Join Game
This endpoint reserves a place for the player. If successful, the endpoint returns the websocket URLs, and the client only has to connect to them.

- **URL**: `/{game_id}/player/`
- **Method**: `POST`
- **Success Response**:
  - Code: `201`
  - Content:
    ```json
    {
        "available": true,
        "ws_url": "ws://localhost:8000/ws/game/{game_id}/",
        "message": "Joined Game!"
    }
    ```
- **Error Responses**:
  - `401`: Unauthorized - missing authentication
  - `409`: Player already in an active game
  - `500`: Join failed

### Get All Games
**Not for production**

- **URL**: `/`  
  *(The root URL is already prefixed with `api/game`)*
- **Method**: `GET`
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "games": "[list of game IDs]",
        "message": "all game uuids"
    }
    ```

### Get Waiting Games
As soon as the first player (the one who created the game) connects to the game, the game becomes visible through this endpoint.

**Under construction**: For now, only the game ID is returned, but additional information will be included in the future.

- **URL**: `/waiting`  
- **Method**: `GET`
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "games": "[list of waiting game IDs]",
        "message": "all game uuids"
    }
    ```

### Get Game Details
**Not for production**

- **URL**: `/{game_id}`  
- **Method**: `GET`
- **Query Parameters**: `game_id`
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "game_id": "id",
        "settings": "game settings",
        "message": "this are the settings of the game"
    }
    ```

