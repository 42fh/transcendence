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
            "last_hit_time": self.last_hit_time,
        },
        "physics": physics_data,
    }

    # Store data
    cycle_data["collision_data"].append(event_data)
    cycle_data["events"].append({"type": "paddle_hit", "data": event_data})

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
    current_speed = math.sqrt(ball["velocity_x"] ** 2 + ball["velocity_y"] ** 2)
    initial_state = {
        "velocity": {"x": ball["velocity_x"], "y": ball["velocity_y"]},
        "speed": current_speed,
    }

    # Apply paddle-specific bounce effect
    new_velocities = self.apply_ball_bounce_effect(
        ball, collision["normal"], collision.get("normalized_offset", 0)
    )
    ball.update(new_velocities)

    # Calculate final state
    new_speed = math.sqrt(ball["velocity_x"] ** 2 + ball["velocity_y"] ** 2)

    # Update combo system and speed records
    current_time = time.time()
    self.update_hit_combo(current_time, ball)
    self.highest_recorded_speed = max(self.highest_recorded_speed, new_speed)

    return {
        "initial": initial_state,
        "final": {"velocity": new_velocities, "speed": new_speed},
        "combo": {
            "count": self.hit_combo,
            "highest_speed": self.highest_recorded_speed,
        },
    }
