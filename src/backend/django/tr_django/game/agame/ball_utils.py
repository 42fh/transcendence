# ball_utils.py
import math
import random
from typing import Tuple, Dict, List


class BallUtils:
    @staticmethod
    def get_random_direction(
        active_sides: List[int], initial_speed: float
    ) -> Tuple[float, float]:
        """Calculate random direction for ball towards a player."""
        # Choose a random player
        target_side = random.choice(active_sides)

        # Base angle for that player (0° for right, 180° for left)
        base_direction = target_side * 2 * math.pi / 4

        # Add random variation within ±45°
        variation = random.uniform(-math.pi / 4, math.pi / 4)
        final_angle = base_direction + variation

        return (
            float(initial_speed * math.cos(final_angle)),
            float(initial_speed * math.sin(final_angle)),
        )

    @staticmethod
    def reset_ball_position(
        ball: Dict, active_sides: List[int], initial_speed: float
    ) -> Dict:
        """Reset ball to center with new random direction."""
        velocity_x, velocity_y = BallUtils.get_random_direction(
            active_sides, initial_speed
        )

        ball.update(
            {
                "x": float(0),
                "y": float(0),
                "velocity_x": velocity_x,
                "velocity_y": velocity_y,
            }
        )
        return ball

    @staticmethod
    def create_ball(ball_size: float) -> Dict:
        """Create an empty ball with default values."""
        return {
            "x": float(0),
            "y": float(0),
            "velocity_x": float(0),
            "velocity_y": float(0),
            "size": float(ball_size),
        }
