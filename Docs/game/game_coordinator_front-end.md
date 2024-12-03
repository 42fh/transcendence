# Game Modes Overview

The Game Coordinator is the entity responsible for processing user-defined settings from a request and transferring them to the game engine. It enables the creation of games based on customizable configurations. The Game Coordinator manages multiple concurrent games and players, leveraging Redis for state and data management.

The following settings are available for the front-end to use when communicating with the Game Coordinator. These settings are configured in the front-end component that serves as the counterpart to the Game Coordinator:

### Game Modes:

1. **Classic Mode**:  
   - Traditional Pong with a **16:9 rectangular boundary**.  
   - **4 sides**, **2 players** on narrow sides, and **1 ball**.  
   - Most settings are fixed to maintain the classic feel.

2. **Regular Mode**:  
   - Uses a **regular polygon** shape.  
   - **Fully customizable** with adjustable settings (e.g., number of sides, players, paddle, and ball properties).

3. **Irregular Mode**:  
   - Features an **irregular polygonal boundary**.  
   - Customizable settings with asymmetrical shapes for unpredictable gameplay.

4. **Circular Mode**:  
   - **Circular boundary** for smooth, free-flowing play.  
   - Customizable settings for players and ball properties.

# Game Settings:

This table documents the available settings for creating a game, detailing their descriptions, available modes, and example values.

| **Setting Name**      | **Description**                                                                 | **Available In Modes**                                 | **Example Value**          |
|------------------------|---------------------------------------------------------------------------------|-------------------------------------------------------|----------------------------|
| `mode`                | The game mode (`REGULAR`, `IRREGULAR`, `CIRCULAR`, `CLASSIC`).                 | All                                                  | `REGULAR`                 |
| `type`                | Game type (e.g., "polygon", "circular").                                        | All                                                  | `polygon`                 |
| `num_players`         | Number of players in the game.                                                  | All                                                  | `4`                       |
| `min_players`         | Minimum number of players.                                                     | All                                                  | `2`                       |
| `num_balls`           | Number of balls in play.                                                       | All                                                  | `3`                       |
| `sides`               | Number of sides for the game boundary (e.g., polygon sides).                   | `REGULAR`, `IRREGULAR`                               | `6`                       |
| `paddle_length`       | Length of the paddles as a fraction of the boundary (e.g., 0.5 for half the side). | All                                                  | `0.4`                     |
| `paddle_width`        | Width of the paddles (fractional value).                                        | All                                                  | `0.1`                     |
| `ball_size`           | Size of the ball as a fraction of the game space.                               | All                                                  | `0.05`                    |
| `ball_speed`          | Speed of the ball (if implemented in specific game modes).                      | Mode-dependent (check individual implementation)     | `1.5`                     |
| `polygon_sides`       | Number of sides for a polygonal boundary.                                       | `REGULAR`, `IRREGULAR`                               | `8`                       |
| `shape`               | Defines the game shape only relevant for irregular (e.g. "star", crazy).                 	| set in all, used in `IRREGULAR`,                   | `star`                  |
| `game_speed`          | Speed of the game overall (affects all elements). Not implemented  
