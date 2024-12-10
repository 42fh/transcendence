from typing import List, Dict, Optional, Any
import math
from .ball_utils import BallUtils
import time
import logging

logger = logging.getLogger(__name__)


@classmethod
def setup_game(cls, settings: Dict[str, Any]) -> dict:

    try:
        settings.update(cls.calculate_player_side_indices(settings))
        settings.update(cls.calculate_vertices(settings))
        settings.update(cls.calculate_sides_normals(settings))
        settings.update(cls.calculate_inner(settings))
        settings.update(cls.set_initial_state(settings))
        settings.update(cls.initialize_ball_movements(settings))
        return settings
    except Exception as e:
        logger.error(f"AGameManager setup error: {e}")


@classmethod
def calculate_vertices(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: calculate_vertices!")


@classmethod
def calculate_sides_normals(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: sides_normals!")


@classmethod
def calculate_inner(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: inner_boundaries!")


@classmethod
def initialize_ball_movements(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: inner_boundaries!")


@classmethod
def set_initial_state(cls, settings: Dict[str, Any]) -> dict:
    try:
        scale = settings.get("scale")
        num_balls = settings.get("num_balls")
        ball_size = settings.get("ball_size") * scale
        initial_speed = settings.get("initial_ball_speed") * scale
        active_sides = settings.get("players_sides")
        num_sides = settings.get("sides")

        # Initialize balls with random directions
        balls = [BallUtils.create_ball(ball_size) for _ in range(num_balls)]
        for ball in balls:
            BallUtils.reset_ball_position(ball, active_sides, initial_speed)
        # Initialize paddles
        paddles = []
        for side_index in range(num_sides):
            paddles.append(
                {
                    "position": float(0.5),
                    "active": side_index in active_sides,
                    "side_index": side_index,
                }
            )

        # Create complete state object
        state = {
            "balls": balls,
            "paddles": paddles,
            "scores": [int(0)] * len(active_sides),
            "dimensions": {
                "paddle_length": float(settings.get("paddle_length")) * scale,
                "paddle_width": float(settings.get("paddle_width")) * scale,
            },
            "game_type": settings.get("type"),
            "game_time": 0,  # Add game time tracking
            "last_update": time.time(),  # Add timestamp for game updates
        }

        return {"state": state}

    except Exception as e:
        logger.error(f"Error creating initial game state: {e}")
        raise


@classmethod
def calculate_player_side_indices(cls, settings: Dict[str, Any]) -> dict:
    """

    Determine which sides should be player sides with improved distribution.
    For high player counts (> sides/2), first alternates players, then fills remaining clockwise.

    Class method to calculate which sides should have paddles.
    Can be called before game instance creation.

        Args:
            settings: Dict containing game configuration

        Returns:
            list: Indices of sides that should have paddles

    """
    num_paddles = settings.get("num_players")
    num_sides = settings.get("sides")
    game_mode = settings.get("mode")
    game_type = settings.get("type")

    player_sides = []

    if game_mode == "classic" and num_paddles == 2 and num_sides == 4:
        player_sides = [1, 3]  # Vertical sides for classic Pong layout
    elif num_paddles == 2:
        # For 2 players, prefer opposite sides
        half_sides = num_sides // 2
        player_sides = [0, half_sides]  # Top and bottom when possible
    else:
        half_sides = num_sides // 2
        if num_paddles <= half_sides:
            # If players <= half sides, distribute evenly
            spacing = math.floor(num_sides / num_paddles)
            for i in range(num_paddles):
                player_sides.append((i * spacing) % num_sides)
        else:
            # First place players on alternating sides
            for i in range(half_sides):
                player_sides.append(i * 2)

            # Then fill remaining players clockwise in the gaps
            remaining_players = num_paddles - half_sides
            current_side = 1  # Start with the first gap

            while remaining_players > 0:
                if current_side not in player_sides:
                    player_sides.append(current_side)
                    remaining_players -= 1
                current_side = (current_side + 2) % num_sides

                # If we've gone all the way around, start filling sequential gaps
                if current_side == 1 and remaining_players > 0:
                    current_side = 1
                    while remaining_players > 0:
                        if current_side not in player_sides:
                            player_sides.append(current_side)
                            remaining_players -= 1
                        current_side = (current_side + 1) % num_sides

    # Sort the sides for consistent ordering
    player_sides.sort()

    logger.debug(
        f"Sides: {num_sides}, Players: {num_paddles}, Distribution: {player_sides}"  # debug
    )
    return {"players_sides": player_sides}
