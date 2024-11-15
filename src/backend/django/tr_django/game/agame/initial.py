import asyncio
import msgpack
import redis.asyncio as redis
import random
import math


async def initialize(self, create_new=False):
    """Initialize game resources"""
    try:
        await self.setup_connections()
        await self.apply_game_settings()  # with this line each instance has the values from states in the instance.
        if create_new:
            await self.initialize_new_game()
    except Exception as e:
        print(f"Error in initialize: {e}")
        raise


async def initialize_new_game(self):
    """Initialize a new game with settings"""
    try:
        # Verify settings exist
        if not hasattr(self, "settings"):
            raise ValueError("Settings must be set before initialization")

        # Create and store initial game state
        initial_state = self.create_initial_state()
        await self.redis_conn.set(self.state_key, msgpack.packb(initial_state))

        # Set game as not running
        await self.redis_conn.set(self.running_key, b"0")

        # Setup paddle positions
        paddle_positions = {
            str(i): msgpack.packb({"position": 0.5})
            for i in range(self.settings["num_players"])
        }
        await self.redis_conn.hset(self.paddles_key, mapping=paddle_positions)

    except Exception as e:
        print(f"Error initializing new game: {e}")
        raise


def create_initial_state(self):
    """Create initial game state based on settings"""
    try:
        # Initialize ball(s) with random direction
        balls = []
        num_balls = self.settings.get("num_balls", 1)
        ball_size = self.settings.get("ball_size", 0.08)
        initial_speed = self.settings.get("initial_ball_speed", 0.006)

        for _ in range(num_balls):
            angle = random.uniform(0, 2 * math.pi)
            balls.append(
                {
                    "x": float(0),
                    "y": float(0),
                    "velocity_x": float(initial_speed * math.cos(angle)),
                    "velocity_y": float(initial_speed * math.sin(angle)),
                    "size": float(ball_size),
                }
            )

        # Initialize paddles based on game type
        paddles = []
        # if self.get_game_type() == "polygon":
        spacing = math.floor(self.num_sides / self.num_paddles)
        active_paddle_count = 0

        for side_index in range(self.num_sides):
            is_active = False
            for i in range(min(self.num_paddles, self.num_sides)):
                if side_index == (i * spacing) % self.num_sides:
                    is_active = True
                    active_paddle_count += 1
                    break

            paddles.append(
                {"position": float(0.5), "active": is_active, "side_index": side_index}
            )
        score_count = active_paddle_count

        # elif self.get_game_type() == "circular":
        #    for i in range(self.num_players):
        #        paddles.append({
        #            "position": float(0.5),
        #            "active": True,
        #            "side_index": i
        #        })
        #    score_count = self.num_players

        state = {
            "balls": balls,
            "paddles": paddles,
            "scores": [int(0)] * score_count,
            "dimensions": {
                "paddle_length": float(self.settings.get("paddle_length", 0.3)),
                "paddle_width": float(self.settings.get("paddle_width", 0.1)),
            },
            "game_type": self.get_game_type(),
        }

        return state

    except Exception as e:
        print(f"Error in create_initial_state: {e}")
        # Return minimal valid state as fallback
        return {
            "balls": [
                {
                    "x": float(0),
                    "y": float(0),
                    "velocity_x": float(0),
                    "velocity_y": float(0),
                    "size": float(0.05),
                }
            ],
            "paddles": [{"position": float(0.5), "active": True, "side_index": 0}],
            "scores": [0],
            "dimensions": {"paddle_length": float(0.3), "paddle_width": float(0.2)},
            "game_type": self.get_game_type(),
        }
