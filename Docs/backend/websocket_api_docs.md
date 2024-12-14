# WebSocket Game API Documentation

## Connection Setup

### Connection URL Pattern

<!-- // TODO: update this, cause it't not really coorect -->

Connect to the game server using:

```
ws://[server-host]/ws/pong/[game_id]/
```

Where:

- `[server-host]` is your game server host
- `[game_id]` is the unique identifier for the game session

### Authentication

<!-- TODO: Maybe make it clear that the frontend doesn't need to do anything extra to authenticate the user, -->

The WebSocket connection requires user authentication. The server will validate the user's session and assign appropriate roles based on game booking status.

## Connection Process

1. **Initial Connection** Client --> Server

   - Client attempts WebSocket connection to the game URL
   - Server validates user authentication and game ID
   - Server checks game existence and player slot availability

2. **Connection Response** Server --> Client
   The server immediately sends an `initial_state` message with:

   - Game configuration
   - Player role assignment (player | spectator)
   - Game state
   - Player-specific settings

3. **Role Assignment**
   Players are assigned one of two roles:

   - `player`: Active game participant
   - `spectator`: Observer only

   Role assignment is based on:

   - Whether the game has available player slots
   - If the user has a valid game booking
   - Whether the user is already connected

4. **Booking Validation**

   - Server checks for valid booking using the pattern: `booked_user:[user_id]:[game_id]`
   - Without valid booking, user connects as spectator
   - Existing players reconnect as spectators

5. **Connection Results**

   Successful Connection (Player):

   ```json
   {
       "type": "initial_state",
       "role": "player",
       "player_index": number,
       "message": "Successfully joined as player",
       // ... additional game state
   }
   ```

   Successful Connection (Spectator):

   ```json
   {
     "type": "initial_state",
     "role": "spectator",
     "player_index": null,
     "message": "[Reason for spectator status]"
     // ... additional game state
   }
   ```

   Possible spectator messages:

   - "Game full - joining as spectator"
   - "Already connected - switching to spectator mode"
   - "No booking found - joining as spectator"

6. **Connection Maintenance**
   - Server monitors connection health
   - Disconnection occurs after 5 seconds without response
   - Automatic cleanup of disconnected players

## Error Handling

Connection will close with specific codes:

- 1011: Server initialization failure
- 1006: Connection timeout/health check failure

## Client-to-Server Messages

### Move Paddle

Use this message to control paddle position during gameplay.

```json
{
    "action": "move_paddle",
    "direction": "left" | "right",
}
```

#### Constraints:

- Direction must be either "left" or "right"
- user_id must match your assigned player_id -> user_id camo from scope
- Must respect movement cooldown
- Cannot move beyond paddle length boundaries
- Game must be running

#### Possible Error Responses:

```json
// Invalid Player
{
    "type": "error",
    "message": "Your are not allowed to move this player"
}

// Movement Too Fast
{
    "type": "error",
    "message": "Your are are too fast"
}

// Invalid Direction
{
    "type": "error",
    "message": "wrong move key [left , right]"
}

// Boundary Reached
{
    "type": "error",
    "message": "Your have reached beginning of paddle"
}
// or
{
    "type": "error",
    "message": "Your have reached end of paddle"
}

// Game Not Running
{
    "type": "error",
    "message": "Game is not running"
}

// Spectator Attempt
{
    "type": "error",
    "message": "Your are only allowed to watch 🌋"
}
```

## 1. Server -> Client Events

### 1.1 Initial State

Received immediately after successful connection. Contains complete game setup and your role.

NB: The message are sent in Json, but we are representing here in JS, cause Json accept only string or numbers, to types or objects and no comments.

```js
{
    "type": "initial_state",
    "game_state": GameState,        // See GameState structure below
    "role": "player" | "spectator", // Your assigned role
    "player_index": number | null,  // Your player index if role="player", null for spectators
    "message": string,              // Connection status message
    "player_values": PlayerValues,  // See PlayerValues structure below
    "game_setup": {
        "type": string,             // Game type ("polygon" or "circular")
        "vertices": Vertex[]        // See Vertex structure below
    }
}
```

### 1.2 **Game State Update**

Periodic updates during gameplay.

```json
{
    "type": "game_state",
    "game_state": GameState  // See GameState structure below
}
```

### 1.3 **Game Events**

Notifications of game collisions.

```json
{
    "type": "game_event",
    "game_state": {
        "collision_type": "paddle_hit" | "wall_hit" | "miss",
        "details": CollisionDetails  // See CollisionDetails structure below
    }
}
```

### 4. Player Join

Notification when new players join.

```json
{
    "type": "player_joined",
    "player_id": string,          // Unique identifier of joining player
    "player_index": number,       // Index in paddles array (matches GameState.paddles)
    "current_players": number     // Total number of active players
}
```

### 5. Game Finished

Sent when game ends.

```json
{
    "type": "game_finished",
    "game_state": GameState,      // Final GameState
    "winner": "you" | "other"     // Winner indication
}
```

### 6. Waiting

Sent while waiting for players.

```json
{
    "type": "waiting",
    "current_players": number,     // Current number of connected players
    "required_players": number     // Minimum players needed to start
}
```

## Data Structure References

### GameState

Used in: initial_state, game_state, game_finished

```js
{
    "balls": Ball[],           // Array of Ball objects
    "paddles": Paddle[],       // Array of Paddle objects
    "scores": number[],        // Player scores
    "dimensions": Dimensions,  // Game dimensions
    "game_type": string,      // Game type identifier
    "game_time": number,      // Time elapsed in seconds
    "last_update": number     // Last update timestamp
}
```

### Ball

Used in: GameState.balls

```json
{
    "x": number,            // Position in range [-1, 1]
    "y": number,            // Position in range [-1, 1]
    "velocity_x": number,   // Horizontal velocity
    "velocity_y": number,   // Vertical velocity
    "size": number         // Ball radius
}
```

### Paddle

Used in: GameState.paddles

```json
{
    "position": number,     // Range [0, 1]
    "active": boolean,      // Player controlled?
    "side_index": number   // Game boundary side
}
```

### Dimensions

Used in: GameState.dimensions

```json
{
    "paddle_length": number, // Relative to side (0-1)
    "paddle_width": number  // Relative to game area
}
```

### PlayerValues

Used in: initial_state.player_values

```json
{
    "move_cooldown": number,    // Seconds between moves
    "move_speed": number,       // Base speed
    "move_speed_boost": number, // Speed multiplier
    "paddle_length": number     // Current length
}
```

### Vertex

Used in: initial_state.game_setup.vertices

For Polygon Games:

```json
{
    "x": number,           // Range [-1, 1]
    "y": number,           // Range [-1, 1]
    "is_player": boolean   // Player side?
}
```

For Circular Games:

```json
{
    "x": number,           // Range [-1, 1]
    "y": number,           // Range [-1, 1]
    "is_player": boolean,  // Player side?
    "angle": number,       // Radians
    "arc_start": number,   // Arc start angle
    "arc_end": number,     // Arc end angle
    "arc_center": number,  // Arc center angle
    "arc_length": number,  // Arc segment length
    "radius": number      // Vertex radius
}
```

### CollisionDetails

Used in: game_event.game_state.details

```json
{
    "side_index": number,         // Collision side
    "hit_position": number,       // Position on side [0-1]
    "approach_speed": number,     // Impact velocity
    "normalized_offset"?: number  // Paddle hits only [-1 to 1]
}
```

### Initial State Event

This event is crucial for setting up the game client. It contains all necessary information to initialize the game UI and player controls.

```json
{
    "type": "initial_state",
    "game_state": GameState,
    "role": "player" | "spectator",
    "player_index": number | null,
    "message": string,
    "player_values": PlayerValues,
    "game_setup": {
        "type": string,
        "vertices": Vertex[]
    }
}
```

#### Field Usage Guide

##### 1. `role` and `player_index`

Use these to determine the player's capabilities in the game:

- If `role === "player"`:
  - Enable paddle controls
  - Show player-specific UI elements (score, controls, etc.)
  - Use `player_index` to identify which paddle belongs to this player in the `game_state.paddles` array
- If `role === "spectator"`:
  - Disable all game controls
  - Show spectator-specific UI elements
  - `player_index` will be null

##### 2. `game_state`

Contains the initial game configuration:

```json
{
    "balls": [
        {
            "x": number,          // Use for initial ball positioning
            "y": number,          // Coordinates are in range [-1, 1]
            "velocity_x": number, // Use for ball movement animation
            "velocity_y": number,
            "size": number       // Relative size for ball rendering
        }
    ],
    "paddles": [
        {
            "position": number,   // Range [0, 1], use for paddle positioning
            "active": boolean,    // If true, paddle is player-controlled
            "side_index": number  // Determines which side this paddle belongs to
        }
    ],
    "scores": number[],          // Array of scores, index matches player positions
    "dimensions": {
        "paddle_length": number, // Use for paddle size calculations
        "paddle_width": number   // Use for paddle thickness rendering
    },
    "game_type": string,        // "polygon" or "circular" - determines game shape
    "game_time": number,        // Current game time in seconds
    "last_update": number       // Timestamp for state synchronization
}
```

##### 3. `player_values`

Use these values for player movement and control configuration:

```json
{
    "move_cooldown": number,    // Minimum time (seconds) between move commands
    "move_speed": number,       // Base movement distance per command
    "move_speed_boost": number, // Current speed multiplier (for power-ups)
    "paddle_length": number     // Current paddle length (may change during game)
}
```

##### 4. `game_setup`

Use this to set up the game arena:

```json
{
    "type": string,     // "polygon" or "circular" - determines rendering approach
    "vertices": Vertex[] // Points defining the game boundary
}
```

For polygon games:

- Connect vertices in order to draw game boundaries
- Each vertex contains:
  ```json
  {
      "x": number,           // Range [-1, 1]
      "y": number,           // Range [-1, 1]
      "is_player": boolean   // True if this side can have a paddle
  }
  ```

For circular games:

- Use additional arc information for curved boundaries:
  ```json
  {
      "x": number,          // Range [-1, 1]
      "y": number,          // Range [-1, 1]
      "is_player": boolean,
      "angle": number,      // Use for arc calculations
      "arc_start": number,  // Start of this boundary segment
      "arc_end": number,    // End of this boundary segment
      "arc_center": number, // Center point of arc
      "arc_length": number, // Length of arc segment
      "radius": number     // Distance from center
  }
  ```

#### Implementation Guidelines

1. **Game Arena Setup**:

   - Scale game area to fit your canvas/container while maintaining aspect ratio
   - Use `game_setup.vertices` to draw game boundaries
   - For polygon: Draw straight lines between vertices
   - For circular: Draw arc segments using the provided angles

2. **Player Setup**:

   - If `role === "player"`:
     - Set up keyboard/touch controls
     - Implement move cooldown using `player_values.move_cooldown`
     - Configure movement distance using `player_values.move_speed`

3. **Paddle Rendering**:

   - Use `dimensions.paddle_length` for paddle size relative to boundary length
   - Use `dimensions.paddle_width` for paddle thickness
   - Position paddles using their `position` value along their assigned side

4. **Ball Setup**:

   - Scale ball size using `ball.size`
   - Position using `ball.x` and `ball.y`
   - Initialize any ball movement animations using velocity values

5. **Score Display**:

   - Use `scores` array for initial score setup
   - Highlight current player's score if `role === "player"`

6. **UI Elements**:

   - Show/hide controls based on `role`
   - Display `message` to indicate connection status
   - Set up score display based on number of active paddles

   ## Base Structure

   ```json
   {
       "type": "paddle_hit" | "wall_hit" | "miss",  // Type of collision
       "side_index": number,                        // Index of collision side
       "distance": number,                          // Distance to collision point
       "normal": {                                  // Normal vector at collision point
           "x": number,                            // X component
           "y": number                             // Y component
       },
       "projection": {                              // Point of collision
           "x": number,                            // X coordinate
           "y": number                             // Y coordinate
       },
       "approach_speed": number                     // Velocity towards collision point
   }
   ```

   ## Type-Specific Fields

   ### 1. Paddle Hit Collision

   Includes additional data for paddle collisions:

   ```json
   {
       // ... base structure fields ...
       "normalized_offset": number,       // Position relative to paddle center (-1 to 1)
       "is_edge_hit": boolean,           // Whether hit was near paddle edge
       "paddle_index": number,           // Index of hit paddle
       "hit_position": number,           // Position along the side (0-1)
       "debug_info": {
           "paddle_center": number,      // Center position of paddle (0-1)
           "paddle_length": number,      // Length of paddle
           "relative_hit": number,       // Where ball hit on side (0-1)
           "paddle_range": {            // Actual paddle coverage
               "start": number,         // Start position on side
               "end": number           // End position on side
           },
           "distance_from_center": number,  // Distance from paddle center
           "normalized_distance": number,   // Normalized distance from center (0-1)
           "was_tunneling": boolean       // If ball tunneled through boundary
       }
   }
   ```

   ### 2. Wall Hit Collision

   Wall-specific collision information:

   ```json
   {
       // ... base structure fields ...
       "hit_position": number,           // Position along wall (0-1)
       "debug_info": {
           "relative_hit": number,       // Where ball hit on wall (0-1)
           "ball_size": number,          // Size of the ball
           "impact_distance": number,     // Distance at impact
           "collision_point": {          // Exact collision coordinates
               "x": number,
               "y": number
           },
           "side_vertices": {           // Wall endpoints
               "start": {
                   "x": number,
                   "y": number
               },
               "end": {
                   "x": number,
                   "y": number
               }
           },
           "was_tunneling": boolean    // If ball tunneled through wall
       }
   }
   ```

   ### 3. Miss Collision

   Information about paddle misses:

   ```json
   {
       // ... base structure fields ...
       "active_paddle_index": number,    // Index of paddle that missed
       "debug_info": {
           "paddle_center": number,      // Center of missed paddle
           "paddle_length": number,      // Length of paddle
           "ball_position": number,      // Where ball crossed boundary
           "paddle_range": {            // Paddle coverage area
               "start": number,
               "end": number
           },
           "miss_distance": number,      // Distance to nearest paddle edge
           "was_tunneling": boolean     // If ball tunneled through boundary
       }
   }
   ```

   ### Circular Game Additional Fields

   For circular game mode, collision details include:

   ```json
   {
       // ... type-specific fields ...
       "debug_info": {
           // ... other debug info ...
           "sector_info": {
               "start_angle": number,    // Start angle of sector (radians)
               "end_angle": number,      // End angle of sector (radians)
               "center_angle": number,   // Center angle of sector (radians)
               "radius": number         // Radius at collision point
           }
       }
   }
   ```

## Vertex Object

Represents a point in the game area's boundary. Used in game_setup.vertices.

#### Common Properties (Both Game Types)

```json
{
    "x": number,           // X coordinate (-1 to 1)
    "y": number,           // Y coordinate (-1 to 1)
    "is_player": boolean   // Whether this vertex is part of a player side
}
```

#### Circular Game Type

```json
{
    // Common properties plus:
    "angle": number,       // Angle in radians
    "arc_start": number,   // Start angle of arc
    "arc_end": number,     // End angle of arc
    "arc_center": number,  // Center angle of arc
    "arc_length": number,  // Length of arc segment
    "radius": number      // Radius at this vertex
}
```

#### Polygon Game Type

For polygon games, vertices are simpler as they only represent the corner points of the polygon. The server calculates lines between consecutive vertices to form the game boundary.

is_player is atm (8/12) only on the circular

```json
{
    // Only common properties:
    "x": number,           // X coordinate (-1 to 1)
    "y": number,           // Y coordinate (-1 to 1)
    "is_player": boolean   // Whether this vertex is part of a player side
}
```

Note: Vertices are ordered counterclockwise. For a square game area (classic mode), vertices would form a rectangle with width 2 and appropriate height for the aspect ratio.

Example Polygon Vertex Array:

```json
// Example for a square game area (4 vertices)
"vertices": [
    {"x": -1.0, "y": 0.5625, "is_player": false},    // Top left
    {"x": 1.0, "y": 0.5625, "is_player": true},     // Top right
    {"x": 1.0, "y": -0.5625, "is_player": false},   // Bottom right
    {"x": -1.0, "y": -0.5625, "is_player": true}    // Bottom left
]
```

## Connection Close Codes

The server may close the connection with these codes:

- 1011: Internal server error or initialization failure
- 1006: Connection timeout or health check failure
