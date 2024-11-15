from ..agame.AGameManager import AGameManager
import math
import random
import msgpack
import time

# from .method_decorators import (
#    add_abstract_implementations,
#    add_setup,
#    add_collision_verification_phase,
#    add_collision_candidate_phase,
#    add_ball_movement_tracking
# )

# @add_ball_movement_tracking
# @add_collision_candidate_phase
# @add_collision_verification_phase
# @add_setup
# @add_abstract_implementations


# from Polypong reused: self.get_player_side_indices()


@AGameManager.register_game_type("circular")
class CircularPongGame(AGameManager):
    def __init__(self, game_id):
        super().__init__(game_id)
        self.num_paddles = 2  # Default number of players
        self.num_balls = 1  # Default number of balls
        self.num_sides = 4  # Total number of sectors
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
        # Ensure we have valid numbers for players and sides
        self.num_paddles = int(self.settings.get("num_players", 2))

        # For circular mode, if sides is not specified, use number of players
        sides_setting = self.settings.get("sides")
        self.num_sides = (
            int(sides_setting) if sides_setting is not None else self.num_paddles
        )

        # Validate that we have enough sides for players
        if self.num_paddles > self.num_sides:
            self.num_sides = self.num_paddles  # Adjust sides if needed

        # Initialize other game components
        self.active_sides = self.get_player_side_indices()  # From PolygonPong
        self.initialize_ball_movements(int(self.settings.get("num_balls", 1)))
        self.calculate_circular_vertices()
        self.calculate_sides_normals()
        self.calculate_inner_boundaries()
        await self.store_vertices(self.vertices)

    def get_game_type(self):
        return "circular"

    def calculate_circular_vertices(self):
        """
        Calculate vertices for circular game board based on number of sectors.
        Each sector is an arc segment of the circle.
        """
        if not self.active_sides:
            raise ValueError(
                "Active sides must be determined before calculating vertices"
            )

        vertices = []
        radius = 1.0  # Base radius of circle

        # Calculate angle for each sector
        angle_step = (2 * math.pi) / self.num_sides

        # Calculate vertices at intersection points of sectors
        for i in range(self.num_sides):
            angle = i * angle_step
            vertices.append(
                {
                    "x": float(radius * math.cos(angle)),
                    "y": float(radius * math.sin(angle)),
                    "angle": float(angle),  # Store angle for later use
                    "is_player": bool(i in self.active_sides),
                }
            )

        # Store additional arc information for each vertex
        for i in range(self.num_sides):
            vertex = vertices[i]
            next_vertex = vertices[(i + 1) % self.num_sides]

            # Calculate center angle of the arc segment
            start_angle = vertex["angle"]
            end_angle = next_vertex["angle"]
            center_angle = (start_angle + end_angle) / 2

            # Store arc segment information
            vertex.update(
                {
                    "arc_start": float(start_angle),
                    "arc_end": float(end_angle),
                    "arc_center": float(center_angle),
                    "arc_length": float(angle_step),
                    "radius": float(radius),
                }
            )

        self.vertices = vertices
        return vertices

    def calculate_sides_normals(self):
        """
        Calculate normal vectors for each arc segment.
        For a circle, normals always point towards the center.
        """
        if not self.vertices:
            raise ValueError("Vertices must be calculated before normals")

        self.side_normals = []

        for i in range(self.num_sides):
            vertex = self.vertices[i]
            center_angle = vertex["arc_center"]

            # Normal points inward from the arc center
            normal = {
                "x": float(
                    -math.cos(center_angle)
                ),  # Negative because we want inward-pointing
                "y": float(-math.sin(center_angle)),
                "side_index": int(i),
                "is_player": bool(i in self.active_sides),
                "angle": float(center_angle),
            }

            self.side_normals.append(normal)

    def calculate_inner_boundaries(self):
        """Calculate inner boundary for circular layout"""
        BUFFER = float(1)
        self.inner_boundary = self.outer_boundary * BUFFER

    def find_collision_candidate(
        self, ball, ball_index, new_state, distance_from_center
    ):
        """
        Find potential collision candidates for the circular layout.
        Uses angle-based sector detection and similar movement checks as polygon version.

        Args:
            ball (dict): Current ball state with position and velocity
            ball_index (int): Index of current ball for movement tracking
            new_state (dict): Current game state
            distance_from_center (float): Current distance of ball from center

        Returns:
            dict: Collision candidate info or None if no candidates found
        """
        # Calculate current angle of ball
        current_angle = math.atan2(ball["y"], ball["x"])
        if current_angle < 0:
            current_angle += 2 * math.pi

        # Calculate which sector the ball is in
        sector_size = 2 * math.pi / self.num_sides
        current_sector = int(current_angle / sector_size)

        # Initialize list for potential collisions
        collision_candidates = []

        # Check sectors that could be relevant (current and adjacent)
        sectors_to_check = [
            (current_sector - 1) % self.num_sides,
            current_sector,
            (current_sector + 1) % self.num_sides,
        ]

        for sector_index in sectors_to_check:
            ball_movement = self.check_ball_movement_relative_to_side(
                ball, sector_index, ball_index, new_state
            )

            if ball_movement["is_approaching"]:
                if ball_movement["type"] == "tunneling":
                    # Immediately return tunneling case, highest priority
                    return {
                        "side_index": sector_index,
                        "movement": ball_movement,
                        "type": "tunneling",
                        "angle_data": {
                            "sector_angle": sector_index * sector_size,
                            "ball_angle": current_angle,
                            "sector_size": sector_size,
                        },
                    }
                else:
                    # Add as potential candidate
                    collision_candidates.append(
                        {
                            "side_index": sector_index,
                            "movement": ball_movement,
                            "type": ball_movement["type"],
                            "angle_data": {
                                "sector_angle": sector_index * sector_size,
                                "ball_angle": current_angle,
                                "sector_size": sector_size,
                            },
                        }
                    )

        # Select closest potential collision if any exist
        if collision_candidates:
            return min(
                collision_candidates, key=lambda x: x["movement"]["current_distance"]
            )

        return None

    def check_ball_movement_relative_to_side(
        self, ball, side_index, ball_index, new_state
    ):
        """
        Check ball movement relative to a circular sector with explicit distance handling.
        """
        # Calculate distances
        radial_distance = math.sqrt(ball["x"] ** 2 + ball["y"] ** 2)
        signed_distance = (
            radial_distance - self.outer_boundary
        )  # Positive outside circle

        # Get current angle in the circle
        current_angle = math.atan2(ball["y"], ball["x"])
        if current_angle < 0:
            current_angle += 2 * math.pi

        # Calculate sector boundaries
        sector_size = 2 * math.pi / self.num_sides
        sector_start = side_index * sector_size
        sector_end = sector_start + sector_size
        sector_mid = (sector_start + sector_end) / 2

        # Calculate radial velocity (positive means moving outward)
        radial_velocity = (
            ball["x"] * ball["velocity_x"] + ball["y"] * ball["velocity_y"]
        ) / radial_distance

        # Get previous state
        previous_movement = self.previous_movements[ball_index]["sides"][side_index]
        previous_signed_distance = float(previous_movement["signed_distance"])
        previous_radial_velocity = float(previous_movement["dot_product"])
        was_approaching = previous_radial_velocity < 0

        PARALLEL_THRESHOLD = float(1e-10)

        # Case 1: Ball is moving parallel to boundary
        if abs(radial_velocity) < PARALLEL_THRESHOLD:
            self.update_ball_movement(
                ball_index,
                side_index,
                radial_distance,
                radial_velocity,
                signed_distance,
            )
            return {
                "is_approaching": True,
                "current_distance": float(radial_distance),
                "signed_distance": float(signed_distance),
                "approach_speed": float(0.0),
                "type": "parallel",
            }

        # Case 2: Ball is moving outward (approaching boundary)
        if radial_velocity > 0:
            self.update_ball_movement(
                ball_index,
                side_index,
                radial_distance,
                radial_velocity,
                signed_distance,
            )
            return {
                "is_approaching": True,
                "current_distance": float(radial_distance),
                "signed_distance": float(signed_distance),
                "approach_speed": float(radial_velocity),
                "type": "approaching",
            }

        # Case 3: Ball is moving inward
        else:
            # Case 3a: Was already moving inward
            if not was_approaching:
                self.update_ball_movement(
                    ball_index,
                    side_index,
                    radial_distance,
                    radial_velocity,
                    signed_distance,
                )
                return {
                    "is_approaching": False,
                    "current_distance": float(radial_distance),
                    "signed_distance": float(signed_distance),
                    "approach_speed": float(abs(radial_velocity)),
                    "type": "moving_away",
                }

            # Case 3b: Was moving outward last frame
            else:
                if (
                    was_approaching
                    and abs(previous_radial_velocity) > PARALLEL_THRESHOLD
                ):
                    # Check for boundary crossing using signed distances
                    position_sign_changed = (
                        signed_distance * previous_signed_distance < 0
                    )

                    # Case 3ba: Tunneling detected
                    if position_sign_changed:
                        # Don't update movement tracking for tunneling
                        return {
                            "is_approaching": True,
                            "current_distance": float(radial_distance),
                            "signed_distance": float(signed_distance),
                            "approach_speed": float(abs(radial_velocity)),
                            "type": "tunneling",
                        }

                # Case 3bb: Regular moving inward
                self.update_ball_movement(
                    ball_index,
                    side_index,
                    radial_distance,
                    radial_velocity,
                    signed_distance,
                )
                return {
                    "is_approaching": False,
                    "current_distance": float(radial_distance),
                    "signed_distance": float(signed_distance),
                    "approach_speed": float(abs(radial_velocity)),
                    "type": "moving_away",
                }

    def handle_wall(self, ball, collision_candidate, new_state):
        """
        Handle wall collision in circular layout, reusing pre-calculated data.

        Args:
            ball (dict): Ball object with position and velocity
            collision_candidate (dict): Contains collision detection info including angle data
            new_state (dict): Current game state

        Returns:
            dict: Complete collision information with debug data
        """
        side_index = collision_candidate["side_index"]
        angle_data = collision_candidate["angle_data"]

        # Reuse pre-calculated angles
        ball_angle = angle_data["ball_angle"]
        sector_size = angle_data["sector_size"]
        sector_start = angle_data["sector_angle"]
        sector_end = sector_start + sector_size

        # Calculate collision point on circle (use outer boundary as radius)
        collision_point = {
            "x": float(self.outer_boundary * math.cos(ball_angle)),
            "y": float(self.outer_boundary * math.sin(ball_angle)),
        }

        # Normal vector points inward from collision point
        normal = {"x": float(-math.cos(ball_angle)), "y": float(-math.sin(ball_angle))}

        # Calculate relative position along arc (0 to 1)
        relative_angle = ball_angle
        if relative_angle < sector_start:
            relative_angle += 2 * math.pi
        relative_position = float((relative_angle - sector_start) / sector_size)

        return {
            "type": "wall",
            "side_index": side_index,
            "distance": collision_candidate["movement"]["current_distance"],
            "normal": normal,
            "projection": collision_point,
            "hit_position": relative_position,
            "approach_speed": collision_candidate["movement"]["approach_speed"],
            "debug_info": {
                "relative_hit": relative_position,
                "ball_size": ball["size"],
                "impact_distance": collision_candidate["movement"]["current_distance"],
                "collision_point": collision_point,
                "sector_info": {
                    "start_angle": float(sector_start),
                    "end_angle": float(sector_end),
                    "center_angle": float((sector_start + sector_end) / 2),
                    "radius": float(self.outer_boundary),
                },
                "was_tunneling": (
                    collision_candidate["movement"]["type"] == "tunneling"
                ),
            },
        }

    def handle_paddle(self, ball, collision_candidate, new_state):
        """
        Handle paddle collision in circular layout with correct order of checks:
        1. Check if ball hits paddle position
        2. If no hit, check if ball is within hitzone distance
        3. Only then evaluate as miss if within hitzone

        Args:
            ball (dict): Ball object with position and velocity
            collision_candidate (dict): Contains collision detection info including angle data
            new_state (dict): Current game state

        Returns:
            dict: Complete collision info or None if ball should continue moving
        """
        side_index = collision_candidate["side_index"]
        angle_data = collision_candidate["angle_data"]
        paddle = new_state["paddles"][side_index]

        # Reuse pre-calculated angles
        ball_angle = angle_data["ball_angle"]
        sector_size = angle_data["sector_size"]
        sector_start = angle_data["sector_angle"]

        # Calculate relative position along arc (0 to 1)
        relative_angle = ball_angle
        if relative_angle < sector_start:
            relative_angle += 2 * math.pi
        relative_position = float((relative_angle - sector_start) / sector_size)

        # Get paddle dimensions
        paddle_length = new_state["dimensions"]["paddle_length"]
        paddle_half_length = paddle_length / 2.0
        paddle_center = paddle["position"]
        paddle_width = new_state["dimensions"]["paddle_width"]

        # Calculate collision point on circle
        collision_point = {
            "x": float(self.outer_boundary * math.cos(ball_angle)),
            "y": float(self.outer_boundary * math.sin(ball_angle)),
        }

        # First check if ball hits paddle position
        distance_from_paddle_center = abs(relative_position - paddle_center)
        if distance_from_paddle_center <= paddle_half_length:
            # Ball hits paddle - calculate normalized offset for bounce angle
            normalized_offset = (relative_position - paddle_center) / paddle_half_length
            normalized_offset = max(-1.0, min(1.0, normalized_offset))

            # Normal vector points inward from collision point
            normal = {
                "x": float(-math.cos(ball_angle)),
                "y": float(-math.sin(ball_angle)),
            }

            return {
                "type": "paddle",
                "side_index": side_index,
                "distance": collision_candidate["movement"]["current_distance"],
                "normal": normal,
                "projection": collision_point,
                "normalized_offset": normalized_offset,
                "is_edge_hit": abs(abs(normalized_offset) - 1.0) < 0.1,
                "paddle_index": side_index,
                "hit_position": relative_position,
                "approach_speed": collision_candidate["movement"]["approach_speed"],
                "debug_info": {
                    "paddle_center": paddle_center,
                    "paddle_length": paddle_length,
                    "paddle_width": paddle_width,
                    "relative_hit": relative_position,
                    "paddle_range": {
                        "start": paddle_center - paddle_half_length,
                        "end": paddle_center + paddle_half_length,
                    },
                    "distance_from_center": distance_from_paddle_center,
                    "normalized_distance": distance_from_paddle_center
                    / paddle_half_length,
                    "was_tunneling": (
                        collision_candidate["movement"]["type"] == "tunneling"
                    ),
                    "sector_info": {
                        "start_angle": float(sector_start),
                        "end_angle": float(sector_start + sector_size),
                        "radius": float(self.outer_boundary),
                    },
                },
            }

        # If no paddle hit, check if ball is within hitzone distance
        current_distance = collision_candidate["movement"]["current_distance"]
        hitzone_distance = paddle_width + ball["size"]

        if abs(current_distance) >= hitzone_distance:
            return None  # Let ball continue moving if not within hitzone

        # Ball missed the paddle and was within hitzone - generate miss event
        return {
            "type": "miss",
            "side_index": side_index,
            "distance": current_distance,
            "normal": {
                "x": float(-math.cos(ball_angle)),
                "y": float(-math.sin(ball_angle)),
            },
            "projection": collision_point,
            "active_paddle_index": self.active_sides.index(side_index),
            "approach_speed": collision_candidate["movement"]["approach_speed"],
            "debug_info": {
                "paddle_center": paddle_center,
                "paddle_length": paddle_length,
                "ball_position": relative_position,
                "paddle_range": {
                    "start": paddle_center - paddle_half_length,
                    "end": paddle_center + paddle_half_length,
                },
                "miss_distance": min(
                    abs(relative_position - (paddle_center - paddle_half_length)),
                    abs(relative_position - (paddle_center + paddle_half_length)),
                ),
                "was_tunneling": (
                    collision_candidate["movement"]["type"] == "tunneling"
                ),
                "sector_info": {
                    "start_angle": float(sector_start),
                    "end_angle": float(sector_start + sector_size),
                    "radius": float(self.outer_boundary),
                },
            },
        }

    def handle_tunneling(self, ball, current_sector, new_state):
        """
        Handle case where ball has tunneled through the circular boundary.
        Follows same pattern as polygon game but adapted for circular geometry.

        Args:
            ball (dict): Current ball state
            current_sector (dict): Information about current sector if available
            new_state (dict): Current game state

        Returns:
            dict: Collision information or None if no valid collision
        """
        # Case 1: No current sector - need to detect tunneling
        if not current_sector:
            # Calculate angle and distance
            angle = math.atan2(ball["y"], ball["x"])
            if angle < 0:
                angle += 2 * math.pi

            # Get sector from angle
            sector_size = 2 * math.pi / self.num_sides
            side_index = int(angle / sector_size)

            # Calculate intersection point on boundary
            intersection = {
                "x": float(self.outer_boundary * math.cos(angle)),
                "y": float(self.outer_boundary * math.sin(angle)),
            }

            # Calculate approach speed using radial velocity
            velocity_angle = math.atan2(ball["velocity_y"], ball["velocity_x"])
            rel_angle = velocity_angle - angle
            approach_speed = abs(
                math.sqrt(ball["velocity_x"] ** 2 + ball["velocity_y"] ** 2)
                * math.cos(rel_angle)
            )

            # Create standardized movement info matching format from check_ball_movement_relative_to_side
            movement_info = {
                "is_approaching": True,
                "current_distance": float(0.0),  # At intersection point
                "approach_speed": float(approach_speed),
                "type": "tunneling",
            }

            # Create standardized sector info
            standardized_sector = {
                "side_index": side_index,
                "movement": movement_info,
                "type": "tunneling",
                "projection": intersection,
                "angle_data": {
                    "sector_angle": side_index * sector_size,
                    "ball_angle": angle,
                    "sector_size": sector_size,
                },
            }

            # Set ball position to intersection point
            ball["x"], ball["y"] = intersection["x"], intersection["y"]

            # Handle based on side type
            if side_index in self.active_sides:
                return self.handle_paddle(ball, standardized_sector, new_state)
            else:
                return self.handle_wall(ball, standardized_sector, new_state)

        # Case 2: Already have sector info - use it directly
        side_index = current_sector["side_index"]
        if side_index in self.active_sides:
            return self.handle_paddle(ball, current_sector, new_state)
        else:
            return self.handle_wall(ball, current_sector, new_state)

    def initialize_ball_movements(self, num_balls):
        """
        Initialize the nested array structure for ball movement tracking in circular layout.

        Args:
            num_balls (int): Number of balls to track

        Creates a data structure for each ball that tracks:
        - Per-sector movement data
        - Deadzone state
        - Last position (x,y)
        - Last angular position
        - Last radial distance
        """
        self.previous_movements = [
            {
                "sides": [
                    {
                        "distance": float(0.0),  # Distance from boundary
                        "signed_distance": float(
                            0.0
                        ),  # Signed distance (positive = outside)
                        "dot_product": float(0.0),  # Radial velocity component
                        "angle": float(0.0),  # Angular position within sector
                    }
                    for _ in range(self.num_sides)
                ],
                "in_deadzone": True,  # Start in deadzone (center)
                "last_position": {"x": float(0.0), "y": float(0.0)},
                "last_angle": float(0.0),  # Last angular position
                "last_radial_distance": float(0.0),  # Last distance from center
            }
            for _ in range(num_balls)
        ]

    def update_ball_movement(
        self, ball_index, side_index, distance, dot_product, signed_distance=None
    ):
        """
        Update movement data for a specific ball and sector in circular layout.

        Args:
            ball_index (int): Index of the ball to update
            side_index (int): Index of the sector/side
            distance (float): Current distance from boundary
            dot_product (float): Current radial velocity component
            signed_distance (float, optional): Signed distance value
        """
        # Expand tracking array if needed for new balls
        if ball_index >= len(self.previous_movements):
            additional_balls = ball_index - len(self.previous_movements) + 1
            self.previous_movements.extend(
                [
                    {
                        "sides": [
                            {
                                "distance": float(0.0),
                                "signed_distance": float(0.0),
                                "dot_product": float(0.0),
                                "angle": float(0.0),
                            }
                            for _ in range(self.num_sides)
                        ],
                        "in_deadzone": True,
                        "last_position": {"x": float(0.0), "y": float(0.0)},
                        "last_angle": float(0.0),
                        "last_radial_distance": float(0.0),
                    }
                    for _ in range(additional_balls)
                ]
            )

        # Calculate current angle from last known position
        current_angle = math.atan2(
            self.previous_movements[ball_index]["last_position"]["y"],
            self.previous_movements[ball_index]["last_position"]["x"],
        )
        if current_angle < 0:
            current_angle += 2 * math.pi

        # Update sector-specific movement data
        self.previous_movements[ball_index]["sides"][side_index] = {
            "distance": float(distance),
            "dot_product": float(dot_product),
            "signed_distance": float(
                signed_distance if signed_distance is not None else distance
            ),
            "angle": float(current_angle),
        }

    def reset_ball_movement(self, ball_index):
        """
        Reset movement tracking for a specific ball in circular layout.

        Args:
            ball_index (int): Index of the ball to reset

        Resets all tracking data to initial values, including:
        - Per-sector movement data
        - Deadzone state
        - Position tracking
        - Angular tracking
        """
        if ball_index < len(self.previous_movements):
            self.previous_movements[ball_index] = {
                "sides": [
                    {
                        "distance": float(0.0),
                        "signed_distance": float(0.0),
                        "dot_product": float(0.0),
                        "angle": float(0.0),
                    }
                    for _ in range(self.num_sides)
                ],
                "in_deadzone": True,
                "last_position": {"x": float(0.0), "y": float(0.0)},
                "last_angle": float(0.0),
                "last_radial_distance": float(0.0),
            }

    def reset_ball(self, ball, ball_index, speed=0.006):
        """
        Extends parent reset_ball method by also resetting movement tracking.

        Args:
            ball (dict): Ball object to reset
            speed (float): Initial ball speed
        Returns:
            dict: Updated ball object
        """
        # Call parent method first
        ball = super().reset_ball(ball, ball_index, speed)

        # Add our polygon-specific reset
        self.reset_ball_movement(ball_index)

        return ball

    def get_player_side_indices(self):
        """
        Determine which sides should be player sides with improved distribution.
        For high player counts (> sides/2), first alternates players, then fills remaining clockwise.
        """
        if self.num_paddles > self.num_sides:
            raise ValueError("Number of paddles cannot exceed number of sides")

        player_sides = []

        if self.num_paddles == 2:
            # For 2 players, prefer opposite sides
            half_sides = self.num_sides // 2
            player_sides = [0, half_sides]  # Top and bottom when possible

        else:
            half_sides = self.num_sides // 2

            if self.num_paddles <= half_sides:
                # If players <= half sides, distribute evenly
                spacing = math.floor(self.num_sides / self.num_paddles)
                for i in range(self.num_paddles):
                    player_sides.append((i * spacing) % self.num_sides)
            else:
                # First place players on alternating sides
                for i in range(half_sides):
                    player_sides.append(i * 2)

                # Then fill remaining players clockwise in the gaps
                remaining_players = self.num_paddles - half_sides
                current_side = 1  # Start with the first gap

                while remaining_players > 0:
                    if current_side not in player_sides:
                        player_sides.append(current_side)
                        remaining_players -= 1
                    current_side = (current_side + 2) % self.num_sides

                    # If we've gone all the way around, start filling sequential gaps
                    if current_side == 1 and remaining_players > 0:
                        current_side = 1
                        while remaining_players > 0:
                            if current_side not in player_sides:
                                player_sides.append(current_side)
                                remaining_players -= 1
                            current_side = (current_side + 1) % self.num_sides

        # Sort the sides for consistent ordering
        player_sides.sort()

        print(
            f"Sides: {self.num_sides}, Players: {self.num_paddles}, Distribution: {player_sides}"
        )
        return player_sides
