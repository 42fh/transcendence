import random
import math
from .ball_utils import BallUtils


def reset_ball(self, ball, ball_index, speed=0.006):
    """
    Reset ball to center with random direction
    Args:
        ball (dict): Ball object to reset
        speed (float): Initial ball speed
    Returns:
        dict: Updated ball object
    """
    BallUtils.reset_ball_position(
        ball, self.active_sides, self.settings.get("initial_speed", speed)
    )

    return ball
