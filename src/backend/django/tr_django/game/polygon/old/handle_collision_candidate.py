def handle_paddle(self, ball, collision_candidate, new_state):
    """
    Determines if ball hits a paddle or misses it using pre-calculated sector info.
    Takes advantage of paddle array being indexed by side.

    Args:
        ball (dict): Ball object with position and size
        collision_candidate (dict): Contains sector info like side_index, movement, projection
        new_state (dict): Current game state with paddles and dimensions

    Returns:
        dict: Complete collision info - either paddle hit or miss data with enhanced debugging info
    """
    side_index = collision_candidate["side_index"]
    paddle = new_state["paddles"][side_index]
    relative_position = self._calculate_relative_position(ball, side_index)

    # Calculate paddle position and width
    paddle_width = new_state["dimensions"]["paddle_width"]
    paddle_half_width = paddle_width / 2.0
    paddle_center = paddle["position"]

    # Initialize collision point
    collision_point = None
    if collision_candidate["movement"]["type"] == "tunneling":
        collision_point = collision_candidate.get("projection", None)

    if not collision_point:
        start = self.vertices[side_index]
        end = self.vertices[(side_index + 1) % self.num_sides]
        collision_point = {
            "x": start["x"] + (end["x"] - start["x"]) * relative_position,
            "y": start["y"] + (end["y"] - start["y"]) * relative_position,
        }

    # Check if ball hits paddle
    distance_from_paddle_center = abs(relative_position - paddle_center)
    if distance_from_paddle_center <= paddle_half_width:
        normalized_offset = (relative_position - paddle_center) / paddle_half_width
        normalized_offset = max(-1.0, min(1.0, normalized_offset))

        return {
            "type": "paddle",
            "side_index": side_index,
            "distance": collision_candidate["movement"]["current_distance"],
            "normal": self.side_normals[side_index],
            "projection": collision_point,
            "normalized_offset": normalized_offset,
            "is_edge_hit": abs(abs(normalized_offset) - 1.0) < 0.1,
            "paddle_index": side_index,
            "hit_position": relative_position,
            "approach_speed": collision_candidate["movement"]["approach_speed"],
            # New debug/statistics information
            "debug_info": {
                "paddle_center": paddle_center,  # Where paddle should be (0-1)
                "paddle_width": paddle_width,  # Width of paddle
                "relative_hit": relative_position,  # Where ball hit on side (0-1)
                "paddle_range": {  # Actual paddle coverage
                    "start": paddle_center - paddle_half_width,
                    "end": paddle_center + paddle_half_width,
                },
                "distance_from_center": distance_from_paddle_center,  # How far from paddle center
                "normalized_distance": distance_from_paddle_center
                / paddle_half_width,  # 0-1 value where 1 is edge
                "was_tunneling": (
                    collision_candidate.get("movement", {}).get("type") == "tunneling"
                ),
            },
        }

    # Ball missed the paddle - include miss statistics too
    return {
        "type": "miss",
        "side_index": side_index,
        "distance": collision_candidate["movement"]["current_distance"],
        "normal": self.side_normals[side_index],
        "projection": collision_point,
        "active_paddle_index": self._get_active_paddle_index(
            side_index, new_state["paddles"]
        ),
        "approach_speed": collision_candidate["movement"]["approach_speed"],
        # New debug/statistics for misses
        "debug_info": {
            "paddle_center": paddle_center,
            "paddle_width": paddle_width,
            "ball_position": relative_position,
            "paddle_range": {
                "start": paddle_center - paddle_half_width,
                "end": paddle_center + paddle_half_width,
            },
            "miss_distance": min(
                abs(relative_position - (paddle_center - paddle_half_width)),
                abs(relative_position - (paddle_center + paddle_half_width)),
            ),  # How far the miss was from nearest paddle edge
            "was_tunneling": (
                collision_candidate.get("movement", {}).get("type") == "tunneling"
            ),
        },
    }


def handle_wall(self, ball, collision_candidate, new_state):
    """
    Determines wall collision with matching structure to paddle handler.
    Takes advantage of same pre-calculated sector info.

    Args:
        ball (dict): Ball object with position and size
        collision_candidate (dict): Contains sector info like side_index, movement, projection
        new_state (dict): Current game state with dimensions

    Returns:
        dict: Complete collision info with enhanced debugging info
    """
    side_index = collision_candidate["side_index"]
    relative_position = self._calculate_relative_position(ball, side_index)

    # Initialize collision point
    collision_point = None
    if collision_candidate["movement"]["type"] == "tunneling":
        collision_point = collision_candidate.get("projection", None)

    if not collision_point:
        start = self.vertices[side_index]
        end = self.vertices[(side_index + 1) % self.num_sides]
        collision_point = {
            "x": start["x"] + (end["x"] - start["x"]) * relative_position,
            "y": start["y"] + (end["y"] - start["y"]) * relative_position,
        }

    return {
        "type": "wall",
        "side_index": side_index,
        "distance": collision_candidate["movement"]["current_distance"],
        "normal": self.side_normals[side_index],
        "projection": collision_point,
        "hit_position": relative_position,
        "approach_speed": collision_candidate["movement"]["approach_speed"],
        # Debug info matching paddle collision pattern
        "debug_info": {
            "relative_hit": relative_position,  # Where ball hit on wall (0-1)
            "ball_size": ball["size"],  # Size of the ball
            "impact_distance": collision_candidate["movement"][
                "current_distance"
            ],  # Distance at impact
            "collision_point": {  # Exact collision coordinates
                "x": collision_point["x"],
                "y": collision_point["y"],
            },
            "side_vertices": {  # Wall endpoints
                "start": {
                    "x": self.vertices[side_index]["x"],
                    "y": self.vertices[side_index]["y"],
                },
                "end": {
                    "x": self.vertices[(side_index + 1) % self.num_sides]["x"],
                    "y": self.vertices[(side_index + 1) % self.num_sides]["y"],
                },
            },
            "was_tunneling": (collision_candidate["movement"]["type"] == "tunneling"),
        },
    }


def handle_parallel(self, ball, collision_candidate, new_state):
    """
    Determines whether a parallel moving ball should be handled as paddle or wall collision.
    Takes advantage of same pre-calculated sector info.

    Args:
        ball (dict): Ball object with position and size
        collision_candidate (dict): Contains sector info like side_index, movement, projection
        new_state (dict): Current game state with dimensions

    Returns:
        dict: Complete collision info with enhanced debugging info
    """
    side_index = collision_candidate["side_index"]

    # Check if this is a paddle side
    if side_index in self.active_sides:
        # Use paddle handler for paddle sides
        return self.handle_paddle(ball, collision_candidate, new_state)
    else:
        # Use wall handler for wall sides
        return self.handle_wall(ball, collision_candidate, new_state)


def handle_tunneling(self, ball, collision_candidate, new_state):
    """
    Handle case where ball has tunneled through a side.

    Args:
        ball (dict): Current ball state
        collision_candidate (dict): Information about the current sector and collision
        new_state (dict): Current game state

    Returns:
        dict: Collision information or None if no valid collision
    """
    # Case 1: No current sector - need to detect tunneling
    if not collision_candidate:
        # Get crossed side using sign change detection
        side_index, intersection = self._get_nearest_side_index(ball)
        if side_index is None:
            return None

        # Calculate approach speed using dot product of velocity and normal
        normal = self.side_normals[side_index]
        approach_speed = abs(
            ball["velocity_x"] * normal["x"] + ball["velocity_y"] * normal["y"]
        )

        # Create standardized movement info
        movement_info = {
            "is_approaching": True,
            "current_distance": float(0.0),
            "approach_speed": float(approach_speed),
            "type": "tunneling",
        }

        # Create standardized sector info
        standardized_sector = {
            "side_index": side_index,
            "movement": movement_info,
            "type": "tunneling",
            "projection": intersection,
        }

        # Set ball position to intersection point
        ball["x"], ball["y"] = intersection["x"], intersection["y"]

        # Handle based on side type
        if side_index in self.active_sides:
            return self.handle_paddle(ball, standardized_sector, new_state)
        else:
            return self.handle_wall(ball, standardized_sector, new_state)

    # Case 2: Already have sector info - use it directly
    side_index = collision_candidate["side_index"]
    if side_index in self.active_sides:
        return self.handle_paddle(ball, collision_candidate, new_state)
    else:
        return self.handle_wall(ball, collision_candidate, new_state)


def _get_nearest_side_index(self, ball):
    """
    Find the side index that the ball passed through by checking sign changes
    in the distance when moving backwards along velocity vector.

    Args:
        ball (dict): Ball object with x,y position and velocity

    Returns:
        tuple: (side_index, intersection_point) or (None, None) if no intersection
    """
    # Create a test point sufficiently far back along velocity vector
    # distance = speed * time, use a large enough time to ensure we cross the polygon
    speed = math.sqrt(ball["velocity_x"] ** 2 + ball["velocity_y"] ** 2)
    if speed < 1e-10:  # Check for stationary ball
        return None, None

    # Use 2x the polygon size to ensure we cross it
    time_back = 2.0 / speed

    test_point = {
        "x": ball["x"] - ball["velocity_x"] * time_back,
        "y": ball["y"] - ball["velocity_y"] * time_back,
        "size": ball["size"],
    }

    # For each side, check if the line from test_point to ball crosses it
    crossings = []
    for side_index in range(self.num_sides):
        # Calculate distances from both points to the side
        normal = self.side_normals[side_index]
        start = self.vertices[side_index]

        # Distance from current ball position to side
        current_dist = (ball["x"] - start["x"]) * normal["x"] + (
            ball["y"] - start["y"]
        ) * normal["y"]

        # Distance from test point to side
        test_dist = (test_point["x"] - start["x"]) * normal["x"] + (
            test_point["y"] - start["y"]
        ) * normal["y"]

        # If signs are different, we crossed this side
        if (
            current_dist * test_dist <= 0
        ):  # Less than or equal includes touching the side
            # Calculate relative position along the side
            relative_pos = self._calculate_relative_position(ball, side_index)

            # Only count if intersection is within the side segment
            if 0 <= relative_pos <= 1:
                # Calculate intersection point
                # Use linear interpolation between test point and ball position
                t = current_dist / (current_dist - test_dist)  # interpolation factor
                intersection = {
                    "x": ball["x"] + t * (test_point["x"] - ball["x"]),
                    "y": ball["y"] + t * (test_point["y"] - ball["y"]),
                }

                crossings.append(
                    {
                        "side_index": side_index,
                        "distance": abs(current_dist),
                        "intersection": intersection,
                    }
                )

    # If we found crossings, return the nearest one
    if crossings:
        closest = min(crossings, key=lambda x: x["distance"])
        return closest["side_index"], closest["intersection"]

    return None, None
