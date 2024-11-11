
async def game_logic(self, current_state):
    """
    Main game logic orchestrator that uses the Step methods.
    Returns (new_state, game_over, cycle_data)
    """
    game_over = False
    new_state = current_state.copy()
    cycle_data = self.initialize_cycle_data()
    
    for ball_index, ball in enumerate(new_state["balls"]):
        # Movement Phase
        self.move_ball(ball)
        
        # Boundary Phase
        distance_from_center = self.get_distance(ball) 
        self.update_distance_metrics(distance_from_center, cycle_data)
        boundary_check = self.handle_distance_check(ball, distance_from_center, new_state, cyle_data)
        if boundary_check.get("skip_ball"):
            if boundary_check.get("game_over"):
                game_over = True
                # self.add_game_over_event(cycle_data, new_state)
                break
            continue
            
            
        # if ball should be. 
        # Collision Candidate Phase
        collision_candidate = self.find_collision_candidate(ball, ball_index, new_state, distance_from_center)
        if not collision_candidate:
            continue
            
        # Collision Verification Phase 
        verified_collision = self.verify_collision_candidate(ball, collision_candidate, new_state)
        if not verified_collision:
            continue

        # Impact Processing Phase
        collision_result = self.collision_handler(verified_collision, ball, new_state, cycle_data)
        
        if collision_result.get("game_over"):
            game_over = True
            # self.add_game_over_event(cycle_data, new_state)
            break            

    return new_state, game_over, cycle_data


# Movement Phase
def move_ball(self, ball):
    """Move ball according to its velocity"""
    ball["x"] += ball["velocity_x"]
    ball["y"] += ball["velocity_y"]

# Boundary Phase

def get_distance(self, point):
     """
    Calculate the Euclidean distance from point to game center (0,0).
    This is a core utility used by all game types.
    
    Args:
        point (dict): Point object with x,y coordinates
        
    Returns:
        float: Distance from center
    """
    return float(math.sqrt(point["x"] * point["x"] + point["y"] * point["y"]))




def handle_distance_check(self, ball, distance, state, cycle_data):
    """Handle distance checks and related actions"""
    result = {
        "skip_ball": False,
        "game_over": False
    }
    
    if distance > self.outer_boundary:
        collision = self.handle_outside_boundary(ball, state)
        if collision:
            collision_result = self.collision_handler(collision, ball, state, cycle_data)
            result.update(collision_result)
            result["skip_ball"] = True
            
            
    elif distance < self.get_inner_boundary(state, ball):
        result["skip_ball"] = True
        
    return result


def handle_outside_boundary(self, ball, state):
    """Handle ball outside boundary"""
    sector_info = None
    return self.handle_tunneling(ball, sector_info, state) # jump to Collision Verification Phase  


def get_inner_boundaries(self, state, ball):
    BUFFER = 0.8
    return (self.inner_boundary - state["dimensions"]["paddle_width"] - ball['size']) * BUFFER 



# Collision Candidate Phase abstarct 

# Collision Verification Phase 
def verify_collision_candidate(ball, collision_candidate, new_state) :
    """Handle interaction between ball and side"""
    if pair_info["type"] == "tunneling":
        return self.handle_tunneling(ball, pair_info, state)
        
    collision, active = self.get_collision_check_range(collision_candidate, new_state)
    if collision:
        if pair_info['type'] == 'parallel':
            # Case 1: Ball moving parallel to side
            return self.handle_parallel(ball, pair_info, new_statei, active)
        if active:
            # Case 2: Ball near active paddle side
            return self.handle_paddle(ball, pair_info, new_state)
        else
            # Case 3: Ball near wall
            return self.handle_wall(ball,  pair_info, new_state)
        
    return None

def get_collision_check_range(collision_candidate, new_state)
    
    side_index = collision_candidate['side_index']
    movement = collision_candidate['movement']
    
    # Get basic collision parameters
    collision_distance = movement['current_distance']
    is_active_side = side_index in self.active_sides   

 
    # Calculate collision threshold based on side type
    if is_active_side:
        # For paddle sides, include paddle width in collision distance
        paddle_width = new_state['dimensions']['paddle_width']
       collision_check = collision_distance <= ball['size'] + paddle_width)
    else:
        # For walls, just use ball size
        collision_check = collision_distance <= ball['size'])
    return collision_check is_active_side


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


# Impact Processing Phase

def collision_handler(self, collision, ball, new_state, cycle_data):
    """Main collision handler that delegates to specific collision type handlers"""
    gameover = {"game_over": False}
    if collision["type"] == "paddle":
        gameover.update(self.collision_paddle(collision, ball, new_state, cycle_data))
    elif collision["type"] == "wall":
        gameover.update(self.collision_wall(collision, ball, new_state, cycle_data))
    elif collision["type"] == "miss":
        gameover.update(self.collision_miss(collision, ball, new_state, cycle_data))
    return gameover


def collision_paddle(self, collision, ball, new_state, cycle_data):
    """Handle paddle collision with events"""
    # Step 1: Move ball to inner edge of paddle
    BUFFER = 0.001
    normal = collision["normal"]
    paddle_width = new_state["dimensions"]["paddle_width"]
    
    # Handle both regular and tunneling collisions
    if collision.get("debug_info", {}).get("was_tunneling", False):
        paddle_outer_x = ball["x"]
        paddle_outer_y = ball["y"]
    else:
        paddle_outer_x = collision["projection"]["x"]
        paddle_outer_y = collision["projection"]["y"]
    
    # Move ball inward from paddle surface
    ball["x"] = paddle_outer_x + normal["x"] * (paddle_width + ball["size"] + BUFFER)
    ball["y"] = paddle_outer_y + normal["y"] * (paddle_width + ball["size"] + BUFFER)
    
    if collision.get("is_edge_hit", False):
        ball["x"] += normal["x"] * BUFFER
        ball["y"] += normal["y"] * BUFFER
    
    # Step 2: Apply bounce effects and get physics data
    physics_data = self.bounce_paddle(ball, collision)
    
    # Step 3: Create collision event data
    event_data = {
        "collision": collision,
        "timing": {
            "timestamp": time.time(),
            "combo_timeout": self.combo_timeout,
            "last_hit_time": self.last_hit_time
        },
        "physics": physics_data
    }

    # Store data
    cycle_data["collision_data"].append(event_data)
    cycle_data["events"].append({
        "type": "paddle_hit",
        "data": event_data
    })
    
    return {"game_over": False}


def bounce_paddle(self, ball, collision):
    """
    Apply paddle-specific bounce effects including speed changes and combo system.
    
    Args:
        ball (dict): Ball object to update
        collision (dict): Collision data containing normal and offset info
        
    Returns:
        dict: Physics data including initial and final states
    """
    # Calculate initial state
    current_speed = math.sqrt(ball["velocity_x"]**2 + ball["velocity_y"]**2)
    initial_state = {
        "velocity": {"x": ball["velocity_x"], "y": ball["velocity_y"]},
        "speed": current_speed
    }
    
    # Apply paddle-specific bounce effect
    new_velocities = self.apply_ball_bounce_effect(
        ball,
        collision["normal"],
        collision.get("normalized_offset", 0)
    )
    ball.update(new_velocities)
    
    # Calculate final state
    new_speed = math.sqrt(ball["velocity_x"]**2 + ball["velocity_y"]**2)
    
    # Update combo system and speed records
    current_time = time.time()
    self.update_hit_combo(current_time, ball)
    self.highest_recorded_speed = max(self.highest_recorded_speed, new_speed)
    
    return {
        "initial": initial_state,
        "final": {
            "velocity": new_velocities,
            "speed": new_speed
        },
        "combo": {
            "count": self.hit_combo,
            "highest_speed": self.highest_recorded_speed
        }
    }



def collision_wall(self, collision, ball, new_state, cycle_data):
    """
    Handle wall collision with events.
    Follows same pattern as paddle collisions but uses wall-specific bounce.
    
    Args:
        collision (dict): Wall collision information
        ball (dict): Ball object to update
        new_state (dict): Current game state
        cycle_data (dict): Data collection for current cycle
        
    Returns:
        dict: Game over status (always False for wall collisions)
    """
    # Step 1: Move ball to inner edge of wall
    BUFFER = 0.001
    normal = collision["normal"]
    
    # Handle both regular and tunneling collisions
    if collision.get("debug_info", {}).get("was_tunneling", False):
        wall_outer_x = ball["x"]
        wall_outer_y = ball["y"]
    else:
        wall_outer_x = collision["projection"]["x"]
        wall_outer_y = collision["projection"]["y"]
    
    # Move ball inward from wall surface
    ball["x"] = wall_outer_x + normal["x"] * (ball["size"] + BUFFER)
    ball["y"] = wall_outer_y + normal["y"] * (ball["size"] + BUFFER)
    
    # Step 2: Apply bounce effects and get physics data
    physics_data = self.wall_bounce(ball, collision)
    
    # Step 3: Create collision event data
    event_data = {
        "collision": collision,
        "timing": {
            "timestamp": time.time()
        },
        "physics": physics_data
    }

    # Store data
    cycle_data["collision_data"].append(event_data)
    cycle_data["events"].append({
        "type": "wall_hit",
        "data": event_data
    })
    
    return {"game_over": False}


def wall_bounce(self, ball, collision):
    """
    Apply wall-specific bounce effects and return physics data.
    Similar pattern to paddle bounce but with wall-specific behavior.
    
    Args:
        ball (dict): Ball object to update
        collision (dict): Wall collision information
    
    Returns:
        dict: Physics data from bounce
    """
    # Store initial state for physics data
    initial_position = {"x": ball["x"], "y": ball["y"]}
    initial_velocity = {"x": ball["velocity_x"], "y": ball["velocity_y"]}
    
    # Apply basic bounce effect - walls don't modify angles
    new_velocities = self.apply_ball_bounce_effect(
        ball,
        collision["normal"],
        0  # No offset for wall bounces
    )
    ball.update(new_velocities)
    
    # Return complete physics data
    return {
        "pre_collision_position": initial_position,
        "post_collision_position": {"x": ball["x"], "y": ball["y"]},
        "pre_collision_velocity": initial_velocity,
        "post_collision_velocity": new_velocities,
        "approach_speed": collision["approach_speed"],
        "hit_position": collision["hit_position"]
    }


def collision_miss(self, collision, ball, new_state, cycle_data):
    """
    Handle miss collision with events.
    Follows same pattern as paddle/wall collisions for consistency.
    
    Args:
        collision (dict): Miss collision information
        ball (dict): Ball object to update
        new_state (dict): Current game state
        cycle_data (dict): Data collection for current cycle
        
    Returns:
        dict: Game over status based on score check
    """
    # Step 1: Record initial state for physics data
    initial_position = {"x": ball["x"], "y": ball["y"]}
    initial_velocity = {"x": ball["velocity_x"], "y": ball["velocity_y"]}
    
    # Step 2: Update game state
    active_paddle_index = collision["active_paddle_index"]
    if active_paddle_index is not None:
        new_state["scores"] = [
            score + (1 if i != active_paddle_index else 0)
            for i, score in enumerate(new_state["scores"])
        ]
    
    # Reset combo tracking
    self.hit_combo = 0
    self.last_hit_time = time.time()
    
    # Step 3: Reset ball and collect physics data
    self.reset_ball(ball)
    physics_data = {
        "pre_collision_position": initial_position,
        "post_collision_position": {"x": ball["x"], "y": ball["y"]},
        "pre_collision_velocity": initial_velocity,
        "post_collision_velocity": {"x": ball["velocity_x"], "y": ball["velocity_y"]},
        "approach_speed": collision["approach_speed"],
        "hit_position": collision["hit_position"]
    }
    
    # Step 4: Create collision event data
    event_data = {
        "collision": collision,
        "timing": {
            "timestamp": time.time(),
            "combo_break": True
        },
        "physics": physics_data,
        "game_data": {
            "failed_paddle_index": active_paddle_index,
            "new_scores": new_state["scores"]
        }
    }
    
    # Store data
    cycle_data["collision_data"].append(event_data)
    cycle_data["events"].append({
        "type": "miss",
        "data": event_data
    })
    
    # Check for winners
    winners = self.check_winner(new_state["scores"])
    if winners:  # If we have any winners
        cycle_data["events"].append({
            "type": "game_over",
            "data": {
                "winners": winners,  # List of winning player indices
                "scores": new_state["scores"]
            }
        })
        return {"game_over": True}
    
    return {"game_over": False}



# extras 



#def update_scores(self, current_scores, failed_player_index):
#    """
#    Update scores when a player fails to hit the ball
#    Args:
#        current_scores (list): Current scores
#        failed_player_index (int): Index of player who missed
#    Returns:
#        list: Updated scores
#    """
#    return [score + (1 if i != failed_player_index else 0) for i, score in enumerate(current_scores)]



# needed in collison_miss and game_update()
def check_winner(self, scores, win_threshold=11):
    max_score = max(scores)
    if max_score >= win_threshold:
        # Find all players with max score
        return [i for i, score in enumerate(scores) if score == max_score]
    return []
