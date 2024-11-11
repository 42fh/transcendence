def apply_wall_bounce_with_effects(self, ball, collision):
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
    physics_data = self.apply_wall_bounce_with_effects(ball, collision)
    
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
