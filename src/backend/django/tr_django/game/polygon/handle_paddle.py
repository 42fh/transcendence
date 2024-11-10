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
    side_index = collision_candidate['side_index']
    paddle = new_state["paddles"][side_index]
    relative_position = self._calculate_relative_position(ball, side_index)
    
    # Calculate paddle position and width
    paddle_width = new_state["dimensions"]["paddle_width"]
    paddle_half_width = paddle_width / 2.0
    paddle_center = paddle["position"]
    
    # Initialize collision point
    collision_point = None
    if collision_candidate['movement']['type'] == 'tunneling':
        collision_point = collision_candidate.get('projection', None)
    
    if not collision_point:
        start = self.vertices[side_index]
        end = self.vertices[(side_index + 1) % self.num_sides]
        collision_point = {
            "x": start["x"] + (end["x"] - start["x"]) * relative_position,
            "y": start["y"] + (end["y"] - start["y"]) * relative_position
        }

    # Check if ball hits paddle
    distance_from_paddle_center = abs(relative_position - paddle_center)
    if distance_from_paddle_center <= paddle_half_width:
        normalized_offset = (relative_position - paddle_center) / paddle_half_width
        normalized_offset = max(-1.0, min(1.0, normalized_offset))
        
        return {
            "type": "paddle",
            "side_index": side_index,
            "distance": collision_candidate['movement']['current_distance'],
            "normal": self.side_normals[side_index],
            "projection": collision_point,
            "normalized_offset": normalized_offset,
            "is_edge_hit": abs(abs(normalized_offset) - 1.0) < 0.1,
            "paddle_index": side_index,
            "hit_position": relative_position,
            "approach_speed": collision_candidate['movement']['approach_speed'],
            # New debug/statistics information
            "debug_info": {
                "paddle_center": paddle_center,          # Where paddle should be (0-1)
                "paddle_width": paddle_width,            # Width of paddle
                "relative_hit": relative_position,       # Where ball hit on side (0-1)
                "paddle_range": {                        # Actual paddle coverage
                    "start": paddle_center - paddle_half_width,
                    "end": paddle_center + paddle_half_width
                },
                "distance_from_center": distance_from_paddle_center,  # How far from paddle center
                "normalized_distance": distance_from_paddle_center / paddle_half_width,  # 0-1 value where 1 is edge
                "was_tunneling": (collision_candidate.get('movement', {}).get('type') == 'tunneling')
            }
        }
    
    # Ball missed the paddle - include miss statistics too
    return {
        "type": "miss",
        "side_index": side_index,
        "distance": collision_candidate['movement']['current_distance'],
        "normal": self.side_normals[side_index],
        "projection": collision_point,
        "active_paddle_index": self._get_active_paddle_index(side_index, new_state["paddles"]),
        "approach_speed": collision_candidate['movement']['approach_speed'],
        # New debug/statistics for misses
        "debug_info": {
            "paddle_center": paddle_center,
            "paddle_width": paddle_width,
            "ball_position": relative_position,
            "paddle_range": {
                "start": paddle_center - paddle_half_width,
                "end": paddle_center + paddle_half_width
            },
            "miss_distance": min(
                abs(relative_position - (paddle_center - paddle_half_width)),
                abs(relative_position - (paddle_center + paddle_half_width))
            ),  # How far the miss was from nearest paddle edge
            "was_tunneling": (collision_candidate.get('movement', {}).get('type') == 'tunneling')
        }
    }
