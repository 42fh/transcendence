
# Setup
def calculate_inner_boundaries(self):
    vertex_distances = [ 
        self.get_distance(v)
        for v in self.vertices
        ]
    self.inner_boundary = float(min(vertex_distances))        

# Movement Phase
        
# Boundary Phase
        
# Collision Candidate Phase
def find_collision_candidate(self, ball, ball_index, new_state, distance_from_center):
    
    collisions_candidates = []
    
    for side_index in range(self.num_sides) :
        ball_movement = self.check_ball_movement_relative_to_side(ball, side_index, ball_index, new_state)           
        if ball_movement['is_approaching']:
            if ball_movement['type'] == 'tunneling':
                # Tunneling detected - return immediately
                return {
                    'side_index': side_index,
                    'movement' : ball_movement,
                    'type': 'tunneling'
                }
            else:
                # Add collision candidate
                collisions_candidates.append({
                    'side_index': side_index,
                    'movement' : ball_movement,
                    'type': ball_movement['type']
                })
    if collisions_candidates:
        return min(collisions_candidates, key=lambda x: x['movement']['current_distance'])
    
    # No collisions found
    return None

        
# Collision Verification Phase
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
    # Case 1: No current sector - need to detect tunneling
    if not current_sector:
        # Get crossed side using sign change detection
        side_index, intersection = self.get_nearest_side_index(ball)
        if side_index is None:
            return None
            
        # Calculate approach speed using dot product of velocity and normal
        normal = self.side_normals[side_index]
        approach_speed = abs(
            ball["velocity_x"] * normal["x"] + 
            ball["velocity_y"] * normal["y"]
        )
        
        # Create standardized movement info
        movement_info = {
            'is_approaching': True,
            'current_distance': float(0.0),
            'approach_speed': float(approach_speed),
            'type': 'tunneling'
        }
        
        # Create standardized sector info
        standardized_sector = {
            'side_index': side_index,
            'movement': movement_info,
            'type': 'tunneling',
            'projection': intersection
        }
        
        # Set ball position to intersection point
        ball["x"], ball["y"] = intersection["x"], intersection["y"]
        
        # Handle based on side type
        if side_index in self.active_sides:
            return self.handle_paddle(ball, standardized_sector, new_state)
        else:
            return self.handle_wall(ball, standardized_sector, new_state)
    
    # Case 2: Already have sector info - use it directly
    side_index = current_sector['side_index']
    if side_index in self.active_sides:
        return self.handle_paddle(ball, current_sector, new_state)
    else:
        return self.handle_wall(ball, current_sector, new_state)
    
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
        
        # Impact Processing Phase
