# Game WebSocket API Documentation

## WebSocket Events

If a player tries to connect to a websocket without a reservation, he automatically becomes a spectator.

### 1. Server → Client Events

NB: Json does't accept comments and doesn't accept type description. Some like `"ballNum": number` is invalid and prevent the auto-formatting. Therefore actual values has been used.

#### 1.1 **Initial State**

```json
{
  "type": "initial_state",
  "game_state": {
    "balls": [
      {
        "x": 0.0,
        "y": 0.0,
        "velocity_x": 0.0,
        "velocity_y": 0.0,
        "size": 0.1
      }
    ],
    "paddles": [
      {
        "position": 0.5,
        "active": true,
        "side_index": 0
      }
    ],
    "scores": [0],
    "dimensions": {
      "paddle_length": 0.3,
      "paddle_width": 0.2
    },
    "game_type": "classic"
  },
  "role": "player",
  "player_index": 0,
  "message": "Game started",
  "player_values": {
    "move_cooldown": 0.1,
    "move_speed": 0.05,
    "move_speed_boost": 1.0,
    "reverse_controls": false,
    "paddle_length": 0.3
  },
  "game_setup": {
    "type": "classic",
    "vertices": []
  }
}
```

- `role`: String ("player" or "spectator")
  `game_type` can be ...
  `player_index` means ...

Field Types:

- `game_state.balls[].x`: Float (e.g., 0.0)
- `game_state.balls[].y`: Float (e.g., 0.0)
- `game_state.balls[].velocity_x`: Float (e.g., 0.5)
- `game_state.balls[].velocity_y`: Float (e.g., 0.5)
- `game_state.balls[].size`: Float (e.g., 0.1)
- `game_state.paddles[].position`: Float between 0.0 and 1.0
- `game_state.paddles[].active`: Boolean
- `game_state.paddles[].side_index`: Integer
- `game_state.scores`: Array of integers
- `game_state.dimensions.paddle_length`: Float (e.g., 0.3)
- `game_state.dimensions.paddle_width`: Float (e.g., 0.2)
- `game_state.game_type`: String
- `role`: String ("player" or "spectator")
- `player_index`: Integer or null
- `message`: String
- `game_setup.type`: String
- `game_setup.vertices`: Array
- `player_values`: Object with the following properties:

  - `move_cooldown`: Float (e.g., 0.1) - Time between allowed moves
  - `move_speed`: Float (e.g., 0.05) - Base movement speed
  - `move_speed_boost`: Float (e.g., 1.0) - Movement speed multiplier
  - `reverse_controls`: Boolean - Whether controls are reversed
  - `paddle_length`: Float (e.g., 0.3) - Length of the paddle
    ...

#### 1. 2 **Game State Update**

```json
{
  "type": "game_state",
  "game_state": {
    "balls": [
      {
        "x": 0.0,
        "y": 0.0,
        "velocity_x": 0.0,
        "velocity_y": 0.0,
        "size": 0.1
      }
    ],
    "paddles": [
      {
        "position": 0.5,
        "active": true,
        "side_index": 0
      }
    ],
    "scores": [0],
    "dimensions": {
      "paddle_length": 0.3,
      "paddle_width": 0.2
    },
    "game_type": "classic"
  }
}
```

#### 1.3 **Game Events**

Game events are special events during the game: Paddle Hit, Wall Hit, Miss

- **Paddle Hit**

```json
{
  "type": "game_event",
  "game_state": {
    "type": "paddle",
    "side_index": 0,
    "distance": 0.5,
    "normal": { "x": 0.0, "y": 1.0 },
    "projection": { "x": 0.5, "y": 0.0 },
    "normalized_offset": 0.5,
    "is_edge_hit": false,
    "paddle_index": 0,
    "hit_position": 0.5,
    "approach_speed": 1.0,
    "debug_info": {
      "paddle_center": 0.5,
      "paddle_length": 0.3,
      "relative_hit": 0.6,
      "paddle_range": {
        "start": 0.35,
        "end": 0.65
      },
      "distance_from_center": 0.1,
      "normalized_distance": 0.33,
      "was_tunneling": false
    }
  }
}
```

- **Wall Hit**

```json
{
  "type": "game_event",
  "game_state": {
    "type": "wall",
    "side_index": 0,
    "distance": 0.5,
    "normal": { "x": 0.0, "y": 1.0 },
    "projection": { "x": 0.5, "y": 0.0 }
  }
}
```

- **Miss**

```json
{
  "type": "game_event",
  "game_state": {
    "type": "miss",
    "side_index": 0,
    "scoring_player": 1
  }
}
```

Field Types:

- Common fields:
  - `type`: String ("paddle", "wall", or "miss")
  - `side_index`: Integer - Index of the side where the event occurred
- Paddle hit specific:
  - `normalized_offset`: Float - Position on paddle (-1 to 1)
  - `is_edge_hit`: Boolean - Whether hit was on paddle edge
  - `paddle_index`: Integer - Index of hit paddle
  - `hit_position`: Float - Exact hit position
  - `approach_speed`: Float - Ball speed at impact
  - Various debug info fields
- Wall hit specific:
  - `distance`: Float - Distance at collision point
  - `normal`: Object - Normal vector at collision
  - `projection`: Object - Collision coordinates
- Miss specific:
  - `scoring_player`: Integer - Index of player who scored

#### 1.4 Player Joined

```json
{
    "type": "player_joined",
    "player_id": string,
    "player_index": number,
    "current_players": number
}
```

#### Game Finished

```json
{
    "type": "game_finished",
    "game_state": {...},
    "winner": "you|other"
}
```

#### Waiting

```json
{
    "type": "waiting",
    "current_players": number,
    "required_players": number
}
```

#### Error

```json
{
    "type": "error",
    "message": string
}
```

### Client → Server Events

#### Move Paddle

```json
{
    "action": "move_paddle",
    "direction": "left|right",
    "user_id": string
}
```

### Connection Management

- The WebSocket connection includes a ping/pong mechanism with:
  - Ping interval: 5 seconds
  - Ping timeout: 5 seconds
  - Server sends "ping" messages
  - Client should respond with "pong"

### WebSocket Connection URL Format

- `ws://localhost:8000/ws/game/{game_id}/`
- `wss://localhost:8000/ws/game/{game_id}/`
- `ws://localhost:8000/ws/pong/{game_id}/`
- `wss://localhost:8000/ws/pong/{game_id}/`

Support for game_id types:

- Integer IDs
- UUID
- String IDs

## Sources:

1. `src/backend/django/tr_django/game/agame/gamestate.py`: Game state structure validation
2. `src/backend/django/tr_django/game/consumers.py`: WebSocket event handling and message structures (all events)
3. `src/backend/django/tr_django/game/agame/AGameManager.py`: Game management and state handling
4. `src/backend/django/tr_django/game/agame/method_decorators.py`: Game component organization
5. `src/backend/django/tr_django/game/agame/game_flow.py`: Game loop and collision event broadcasting (game_state, game_event)
6. `src/backend/django/tr_django/game/agame/game_logic.py`: Collision handling and game physics (game_event)
7. `src/backend/django/tr_django/game/polygon/abstract_implementations.py`: Collision detection and event data structures (game_event)
