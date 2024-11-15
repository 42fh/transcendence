from abc import ABC, abstractmethod
import math
import random


class AGameManager(ABC):
    def __init__(self, game_id):
        super().__init__(game_id)
        # Initialize metrics tracking
        self.game_metrics = {
            "total_paddle_hits": 0,
            "total_wall_hits": 0,
            "total_tunneling_events": 0,
            "total_balls_reset": 0,
            "highest_recorded_distance": 0,
            "longest_rally": 0,
            "current_rally": 0,
        }

        # Initialize frontend event configuration
        self.frontend_events = {
            "paddle_hit": {
                "enabled": True,
                "data": ["hit_position", "ball_speed", "paddle_index"],
            },
            "wall_hit": {"enabled": True, "data": ["hit_position", "wall_index"]},
            "ball_reset": {
                "enabled": True,
                "data": ["failed_paddle_index", "new_scores"],
            },
            "tunneling": {"enabled": True, "data": ["entry_point", "exit_point"]},
            "combo": {"enabled": True, "data": ["combo_count", "time_active"]},
        }
