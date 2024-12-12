from enum import Enum


class EnumGameMode(Enum):
    REGULAR = "regular"
    CLASSIC = "classic"
    CIRCULAR = "circular"
    IRREGULAR = "irregular"


DEFAULT_PLAYER = {
    "player_settings": {
        "move_cooldown": float(0.02),
        "move_speed": float(0.03),
        "move_speed_boost": float(1.0),
        "reverse_controls": False,
        "paddle_length": float(0.3),
    }
}


REGULAR_FIXED = {"type": "polygon", "mode": "regular", "shape": "regular"}

IRREGULAR_FIXED = {"type": "polygon", "mode": "irregular"}

DEFAULT_POLYGON = {
    "num_players": int(2),
    "num_balls": int(1),
    "min_players": int(2),
    "initial_ball_speed": float(0.006),
    "score": "first11",
}

DEFAULT_REGULAR = {
    "sides": int(5),
    "paddle_length": float(0.3),
    "paddle_width": float(0.06),
    "ball_size": float(0.05),
}


DEFAULT_IRREGULAR = {
    "sides": int(5),
    "paddle_length": float(0.3),
    "paddle_width": float(0.06),
    "ball_size": float(0.05),
    "shape": "irregular",
}

CIRCULAR_FIXED = {"type": "circular", "mode": "circular", "shape": "circular"}

DEFAULT_CIRCULAR = {
    "num_players": int(2),
    "num_balls": int(1),
    "min_players": int(2),
    "initial_ball_speed": float(0.02),
    "sides": int(3),
    "paddle_length": float(0.3),
    "paddle_width": float(0.06),
    "ball_size": float(0.05),
}

CLASSIC_FIXED = {
    "type": "polygon",
    "mode": "classic",
    "pongType": "irregular",
    "num_players": int(2),
    "num_balls": int(1),
    "min_players": int(2),
    "sides": int(4),
    "paddle_length": float(0.1),
    "paddle_width": float(0.015),
    "ball_size": float(0.015),
    "initial_ball_speed": float(0.003),
    "scale": float(2.0),
}

DEFAULT_CLASSIC = {"score": "first11"}
