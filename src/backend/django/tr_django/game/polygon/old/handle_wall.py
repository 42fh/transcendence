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
