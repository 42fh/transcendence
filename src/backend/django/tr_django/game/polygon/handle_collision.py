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
    side_index = collision_candidate['side_index']
    relative_position = self._calculate_relative_position(ball, side_index)
    
    
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

    return {
        "type": "wall",
        "side_index": side_index,
        "distance": collision_candidate['movement']['current_distance'],
        "normal": self.side_normals[side_index],
        "projection": collision_point,
        "hit_position": relative_position,
        "approach_speed": collision_candidate['movement']['approach_speed'],
        # Debug info matching paddle collision pattern
        "debug_info": {
            "relative_hit": relative_position,       # Where ball hit on wall (0-1)
            "ball_size": ball["size"],              # Size of the ball
            "impact_distance": collision_candidate['movement']['current_distance'],  # Distance at impact
            "collision_point": {                     # Exact collision coordinates
                "x": collision_point["x"],
                "y": collision_point["y"]
            },
            "side_vertices": {                       # Wall endpoints
                "start": {
                    "x": self.vertices[side_index]["x"],
                    "y": self.vertices[side_index]["y"]
                },
                "end": {
                    "x": self.vertices[(side_index + 1) % self.num_sides]["x"],
                    "y": self.vertices[(side_index + 1) % self.num_sides]["y"]
                }
            },
            "was_tunneling": (collision_candidate['movement']['type'] == 'tunneling')
        }
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
    side_index = collision_candidate['side_index']
    
        
    # Check if this is a paddle side
    if side_index in self.active_sides:
        # Use paddle handler for paddle sides
        return self.handle_paddle(ball, collision_candidate, new_state)
    else:
        # Use wall handler for wall sides
        return self.handle_wall(ball, collision_candidate, new_state)



    def handle_tunneling(self, ball, current_sector, new_state):
        """
        Handle case where ball has tunneled through a side.
        
        Args:
            ball (dict): Current ball state
            current_sector (dict): Information about the current sector and collision
            new_state (dict): Current game state
            
        Returns:
            dict: Collision information or None if no valid collision
        """
        if not current_sector:
            # Get crossed side using sign change detection
            side_index, intersection = self.get_nearest_side_index(ball)
            if side_index is None:
                return None
                
            collision_info = {
                "distance": 0,
                "normal": self.side_normals[side_index],
                "projection": intersection
            }
            
            if side_index in self.active_sides:
                # Check for paddle collision at crossing point
                original_x, original_y = ball["x"], ball["y"]
                ball["x"], ball["y"] = intersection["x"], intersection["y"]
                
                paddle_collision = self._calculate_paddle_collision(
                    side_index,
                    collision_info,
                    ball,
                    state["paddles"],
                    state["dimensions"]
                )
                
                
                if paddle_collision and paddle_collision["type"] == "paddle":
                    normal = self.side_normals[side_index]
                    paddle_width = state["dimensions"]["paddle_width"]
                    # Move ball out by paddle width plus ball size
                    ball["x"] += normal["x"] * (paddle_width + ball["size"])
                    ball["y"] += normal["y"] * (paddle_width + ball["size"])
                    
                    return paddle_collision
                else:
                    return {
                        "type": "miss",
                        "side_index": side_index,
                        "active_paddle_index": self._get_active_paddle_index(side_index, state["paddles"]),
                        **collision_info
                    }
            else:
                return {
                    "type": "wall",
                    "side_index": side_index,
                    **collision_info
                }
        
        side_index = current_sector['side_index']
        
        # Calculate basic collision info using previous frame's position
        collision_info = {
            "distance": current_sector['movement']['current_distance'],
            "normal": self.side_normals[side_index],
            "projection": self._calculate_projection(ball, side_index)
        }
        
        if side_index in self.active_sides:
            # Check for paddle collision
            paddle_collision = self._calculate_paddle_collision(
                side_index,
                collision_info,
                ball,
                new_state["paddles"],
                new_state["dimensions"]
            )
            
            if paddle_collision and paddle_collision["type"] == "paddle":
                # Reset ball position to paddle surface
                self.apply_collision_resolution(ball, paddle_collision) 
                return paddle_collision
            else:
                # Reset ball position to wall and return miss
                self.apply_collision_resolution(ball, {
                    "type": "miss",
                    "side_index": side_index,
                    **collision_info
                })
                return {
                    "type": "miss",
                    "side_index": side_index,
                    "active_paddle_index": self._get_active_paddle_index(side_index, new_state["paddles"]),
                    **collision_info
                }
        else:
            # Reset ball position to wall
            self.apply_collision_resolution(ball, {
                "type": "wall",
                "side_index": side_index,
                **collision_info
            })
            return {
                "type": "wall",
                "side_index": side_index,
                **collision_info
            }

