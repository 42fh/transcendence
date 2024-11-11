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
