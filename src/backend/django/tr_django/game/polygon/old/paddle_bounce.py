def paddle_bounce(self, ball, collision):
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
