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
  - `405`: Method not allowd
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
  - `405`: Method not allowd
  - `409`: Player already in an active game
  - `500`: Join failed


### Get Player Count
This endpoint retrieves the current and reserved player counts for a specific game.

- **URL**: `/api/games/{game_id}/players/count/`
- **Method**: `GET`
- **URL Parameters**:
  - `game_id`: UUID of the game

- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "player_counts": {
            "status": true,
            "current_players": int,
            "reserved_players": int
        },
        "message": "Current player counts retrieved successfully"
    }
    ```

- **Error Responses**:
  - `405`: Method not allowed
  - `500`: Server Error


### Cancel Booking
This endpoint cancels all active bookings for the authenticated user.

- **URL**: `/games/booking/cancel/`
- **Method**: `DELETE`
- **Authentication Required**: Yes

- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "message": "Booking(s) cancelled successfully",
        "status": "success",
        "warning": "Multiple bookings found and removed" // Optional field
    }
    ```

- **Error Responses**:
  - `401`: Unauthorized - missing authentication
  - `404`: No booking found
  - `500`: Server Error

## User Managment

### User Online Status
Manages the online status of users.

- **URL**: `/api/game/user/online/`
- **Methods**: `GET`, `POST`, `DELETE`
- **Authentication Required**: Yes

#### GET
Check if a user is online.

- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "online": boolean,
        "user_id": string
    }
    ```

#### POST
Set user as online. Refreshes the expiry timer to USER_ONLINE_EXPIRY seconds.

- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "message": "User set to online",
        "user_id": string
    }
    ```

#### DELETE
Set user as offline.

- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "message": "User set to offline",
        "user_id": string
    }
    ```

#### Error Responses:
- `401`: Unauthorized - missing authentication
- `500`: Server error processing request





## Data for all followings calls 
       

game_data = {                                                          

	'game_id': game_id,                                                
	'mode': game_settings.get('mode'),                                 	
	'type': game_settings.get('type'),                                 
	 'sides': game_settings.get('sides'),                               
	 'score': game_settings.get('score'),                               
	'num_players': game_settings.get('num_players'),                   
	'min_players': game_settings.get('min_players'),                   
	'initial_ball_speed': game_settings.get('initial_ball_speed'),     
	 'paddle_length': game_settings.get('paddle_length'),               
	 'paddle_width': game_settings.get('paddle_width'),                 
	 'ball_size': game_settings.get('ball_size'),                       
	 'players': {                                                       
	     'current': current_players,                                    
	     'reserved': reserved_players,                                  
	     'total_needed': game_settings.get('num_players', 0)            
		 }                                    

### Get Waiting Games
As soon as the first player (the one who created the game) connects to the game, the game becomes visible through this endpoint.


- **URL**: `/waiting`  
- **Method**: `GET`
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "games": game_data,
        "message": "all game uuids"
    }
    ```
- **Error Responses**:
  - `405`: Method not allowd     

### Get Running Games

- **URL**: `/running`  
- **Method**: `GET`
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "games": game_data,
        "message": "all game uuids"
    }
    ```
- **Error Responses**:
  - `405`: Method not allowd     


### Get all Games

- **URL**: `/running`  
- **Method**: `GET`
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "games": game_data,
        "message": "all game uuids"
    }
    ```
- **Error Responses**:
  - `405`: Method not allowd     



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

## Not activated




