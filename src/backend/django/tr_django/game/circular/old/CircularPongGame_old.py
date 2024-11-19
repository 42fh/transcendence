from ..agame.AGameManager import AGameManager
import math
import random
import msgpack
import time

from .method_decorators import (
    add_abstract_implementations,
    add_setup,
    add_collision_verification_phase,
    add_collision_candidate_phase,
    add_ball_movement_tracking,
)


@add_ball_movement_tracking
@add_collision_candidate_phase
@add_collision_verification_phase
@add_setup
@AGameManager.register_game_type("circular")
@add_abstract_implementations
class CircularPongGame(AGameManager):
    def __init__(self, game_id):
        super().__init__(game_id)
        self.num_players = 2  # Default number of players
        self.num_balls = 1  # Default number of balls
        self.vertices = None  # Will store calculated vertices
        self.active_sides = None  # Will store which sides have paddles
        self.side_normals = None  # Will store normal vectors for each side
        self.previous_movements = []  # Will be initialized after num_sides is set
        self.game_mode = "regular"  # Default mode
        # Initialize combo system
        self.hit_combo = 0
        self.last_hit_time = 0
        self.combo_timeout = 1.5  # seconds
        self.highest_recorded_speed = 0

    async def apply_game_settings(self):
        """Apply game-specific values from settings"""
        self.num_players = self.settings.get("num_players", 2)
        self.num_sides = self.num_players  # In circular, sides = players
        self.active_sides = list(range(self.num_players))  # All sides are active
        self.initialize_ball_movements(self.settings.get("num_balls", 1))
        self.calculate_circular_vertices()
        self.calculate_side_normals()
        self.calculate_inner_boundaries()
        await self.store_vertices(self.vertices)

    def get_game_type(self):
        return "circular"

    # Setup Methods
    def calculate_circular_vertices(self):
        """Calculate vertices for circular layout"""
        vertices = []
        for i in range(self.num_players):
            angle = (2 * math.pi * i) / self.num_players
            vertices.append({"x": float(math.cos(angle)), "y": float(math.sin(angle))})
        self.vertices = vertices

    def calculate_side_normals(self):
        """Calculate normal vectors for each circular segment"""
        if not self.vertices:
            raise ValueError("Vertices must be calculated before normals")

        self.side_normals = []
        for i in range(self.num_players):
            angle = (2 * math.pi * i) / self.num_players
            self.side_normals.append(
                {
                    "x": float(math.cos(angle)),
                    "y": float(math.sin(angle)),
                    "side_index": int(i),
                    "is_player": True,  # All sides are player sides in circular
                }
            )

    # Collision Candidate Phase
    def check_ball_movement_relative_to_side(
        self, ball, side_index, ball_index, new_state
    ):
        """Check ball movement relative to circular segment"""
        normal = self.side_normals[side_index]
        center_to_ball = {"x": ball["x"], "y": ball["y"]}

        # Calculate current state
        distance = math.sqrt(center_to_ball["x"] ** 2 + center_to_ball["y"] ** 2)
        if distance < 1e-10:  # Avoid division by zero
            return {
                "is_approaching": False,
                "current_distance": float(0),
                "approach_speed": float(0),
                "type": "stationary",
            }

        # Normalize center_to_ball
        center_to_ball = {
            "x": center_to_ball["x"] / distance,
            "y": center_to_ball["y"] / distance,
        }

        # Calculate dot product with normal
        current_dot_product = (
            center_to_ball["x"] * normal["x"] + center_to_ball["y"] * normal["y"]
        )

        # Get angle between vectors
        angle = math.acos(max(-1.0, min(1.0, current_dot_product))) * 180 / math.pi

        # Calculate if ball is in sector
        sector_size = 360 / self.num_players
        is_in_sector = angle <= sector_size / 2

        if not is_in_sector:
            return {
                "is_approaching": False,
                "current_distance": float(distance),
                "approach_speed": float(0),
                "type": "wrong_sector",
            }

        # Calculate approach speed
        radial_velocity = (
            ball["velocity_x"] * center_to_ball["x"]
            + ball["velocity_y"] * center_to_ball["y"]
        )

        # Adjust distance for paddle width
        current_distance = self.check_paddle(distance, new_state, side_index, ball)

        # Update movement tracking
        self.update_ball_movement(
            ball_index, side_index, current_distance, radial_velocity
        )

        # Determine movement type
        if abs(radial_velocity) < 1e-10:  # Nearly parallel
            return {
                "is_approaching": True,
                "current_distance": float(current_distance),
                "approach_speed": float(0),
                "type": "parallel",
            }
        elif radial_velocity > 0:  # Moving outward
            return {
                "is_approaching": True,
                "current_distance": float(current_distance),
                "approach_speed": float(radial_velocity),
                "type": "approaching",
            }
        else:  # Moving inward
            return {
                "is_approaching": False,
                "current_distance": float(current_distance),
                "approach_speed": float(abs(radial_velocity)),
                "type": "moving_away",
            }

    # Collision Verification Phase
    def calculate_relative_position(self, ball, side_index):
        """Calculate relative position along circular arc"""
        angle = math.atan2(ball["y"], ball["x"]) * 180 / math.pi
        if angle < 0:
            angle += 360

        sector_size = 360 / self.num_players
        sector_start = side_index * sector_size
        relative_angle = angle - sector_start
        if relative_angle < 0:
            relative_angle += 360

        return relative_angle / sector_size

    def handle_paddle(self, ball, collision_candidate, new_state):
        """Handle paddle collision in circular layout"""
        side_index = collision_candidate["side_index"]
        paddle = new_state["paddles"][side_index]
        relative_position = self.calculate_relative_position(ball, side_index)

        # Calculate paddle position and width
        paddle_length = new_state["dimensions"]["paddle_length"]
        paddle_half_length = paddle_length / 2.0
        paddle_center = paddle["position"]

        # Calculate collision point
        distance = math.sqrt(ball["x"] ** 2 + ball["y"] ** 2)
        angle = math.atan2(ball["y"], ball["x"])
        collision_point = {
            "x": math.cos(angle) * distance,
            "y": math.sin(angle) * distance,
        }

        # Check if ball hits paddle
        distance_from_paddle_center = abs(relative_position - paddle_center)
        if distance_from_paddle_center <= paddle_half_length:
            normalized_offset = (relative_position - paddle_center) / paddle_half_length
            normalized_offset = max(-1.0, min(1.0, normalized_offset))

            return {
                "type": "paddle",
                "side_index": side_index,
                "distance": collision_candidate["movement"]["current_distance"],
                "normal": {"x": ball["x"] / distance, "y": ball["y"] / distance},
                "projection": collision_point,
                "normalized_offset": normalized_offset,
                "is_edge_hit": abs(abs(normalized_offset) - 1.0) < 0.1,
                "paddle_index": side_index,
                "hit_position": relative_position,
                "approach_speed": collision_candidate["movement"]["approach_speed"],
            }

        # Ball missed the paddle
        return {
            "type": "miss",
            "side_index": side_index,
            "distance": collision_candidate["movement"]["current_distance"],
            "normal": {"x": ball["x"] / distance, "y": ball["y"] / distance},
            "projection": collision_point,
            "active_paddle_index": side_index,
            "approach_speed": collision_candidate["movement"]["approach_speed"],
        }

    def handle_tunneling(self, ball, collision_candidate, new_state):
        """Handle tunneling for circular layout"""
        if not collision_candidate:
            # Get crossed sector using angle calculation
            angle = math.atan2(ball["y"], ball["x"]) * 180 / math.pi
            if angle < 0:
                angle += 360

            sector_index = int((angle * self.num_players) / 360)
            distance = math.sqrt(ball["x"] ** 2 + ball["y"] ** 2)

            # Create standardized collision info
            return self.handle_paddle(
                ball,
                {
                    "side_index": sector_index,
                    "movement": {
                        "current_distance": distance,
                        "approach_speed": math.sqrt(
                            ball["velocity_x"] ** 2 + ball["velocity_y"] ** 2
                        ),
                    },
                },
                new_state,
            )

        # Use existing collision candidate
        return self.handle_paddle(ball, collision_candidate, new_state)
