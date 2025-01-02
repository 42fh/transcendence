### Tests

- **Unit Tests**: Inside each app folder (e.g., `users/tests/`)
- **Integration Tests**: Centralized in `src/backend/django/tests/`

## Notes from Jonathan

### Setup

#### Redis

1. Install Redis:
   - **Mac Users**:
     ```bash
     brew install redis
     brew services start redis
     ```
2. Redis Configuration:
   - Redis must be running locally (`localhost`) for the application to function correctly.

#### Game State Management

- When a game is created, it will store its state in Redis using an ID.
- **Important**: If you want to restart a game with the same ID, you must delete the existing game state manually:
  ```bash
  redis-cli DEL game_state:<your_game_id>
  ```

---

### Game Logic

#### Frontend

- This version of the **Game Logic** is designed to work with this [Frontend](./src/frontend/pong_test.html).
- On the linked frontend page, you can:
  - Manually assign a game ID and player ID.

#### Running the Game

1. Start **Daphne** to enable gameplay:
   ```bash
   daphne -u /path/to/your/asgi:application
   ```
2. Open the frontend and play the game.

---

### Features

1. **Anti-Cheating Mechanisms**:
   - If you press your paddle faster than **300ms**, the game will block your moves.
   - If you change your `player_id` in the browser console, the game will block your moves.
