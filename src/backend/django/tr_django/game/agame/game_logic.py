import asyncio
import math
import time
import logging
import random


logger = logging.getLogger(__name__)


def initialize_cycle_data(self):
    """Initialize data structure for tracking events and metrics"""
    return {
        "events": [],
        "highest_distance": 0,
        "state_updates": {},
        "collision_data": [],
    }


async def game_logic(self, current_state):
    """
    Main game logic orchestrator that uses the Step methods.
    Returns (new_state, game_over, cycle_data)
    """
    game_over = False
    new_state = current_state.copy()
    logger.debug(f"{self.game_id}: {new_state}")
    cycle_data = self.initialize_cycle_data()
    try:
        for ball_index, ball in enumerate(new_state["balls"]):
            # Movement Phase
            self.move_ball(ball)
            # Boundary Phase
            distance_from_center = self.get_distance(ball)
            # self.update_distance_metrics(distance_from_center, cycle_data)
            logger.info(f"{self.game_id}/ball[{ball_index}]: {distance_from_center} / ball ({ball['x']} / {ball['x']})")
            boundary_check = self.handle_distance_check(
                ball_index, ball, distance_from_center, new_state, cycle_data
            )
            if boundary_check.get("skip_ball"):
                if boundary_check.get("game_over"):
                    game_over = True
                    # self.add_game_over_event(cycle_data, new_state)
                    break
                continue

            # if ball should be.
            # Collision Candidate Phase
            collision_candidate = self.find_collision_candidate(
                ball, ball_index, new_state, distance_from_center
            )
            if not collision_candidate:
                continue

            # Collision Verification Phase
            verified_collision = self.verify_collision_candidate(
                ball, collision_candidate, new_state
            )
            if not verified_collision:
                continue
            logger.debug(
                f"{self.game_id}/ball[{ball_index}]colliosion: {verified_collision}"
            )
            # Impact Processing Phase
            collision_result = self.collision_handler(
                verified_collision, ball, new_state, cycle_data, ball_index
            )
            if not collision_result:
                continue
            if collision_result.get("game_over"):
                game_over = True
                break
        return new_state, game_over, cycle_data
    except Exception as e:
        logger.error(f"Error in game_logic: {e}")
        raise


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


def handle_distance_check(self, ball_index, ball, distance, state, cycle_data):
    """Handle distance checks and related actions"""
    result = {"skip_ball": False, "game_over": False}

    inner_boundary = self.get_inner_boundary(state, ball)

    # Get current deadzone state
    was_in_deadzone = self.previous_movements[ball_index]["in_deadzone"]
    is_in_deadzone = distance < inner_boundary
    # Calculate ball movement distance since last frame
    prev_pos = self.previous_movements[ball_index].get(
        "last_position", {"x": ball["x"], "y": ball["y"]}
    )
    movement_distance = math.sqrt(
        (ball["x"] - prev_pos["x"]) ** 2 + (ball["y"] - prev_pos["y"]) ** 2
    )

    # If ball moved more than the inner_boundary in one step, it might have skipped the deadzone
    if movement_distance > inner_boundary:
        # Check if ball path intersected deadzone
        t = inner_boundary / movement_distance  # interpolation factor
        intersection_point = {
            "x": prev_pos["x"] + t * (ball["x"] - prev_pos["x"]),
            "y": prev_pos["y"] + t * (ball["y"] - prev_pos["y"]),
        }
        intersection_distance = math.sqrt(
            intersection_point["x"] ** 2 + intersection_point["y"] ** 2
        )

        if intersection_distance < inner_boundary:
            # Ball path crossed deadzone - reset movement tracking
            self.reset_ball_movement(ball_index)

    # Normal deadzone transitioni
    # Only reset when entering deadzone
    elif is_in_deadzone and not was_in_deadzone:
        logger.info(f"{self.game_id}/ball[{ball_index}]: set deadzone")
        self.reset_ball_movement(ball_index)
    # When exiting, just update the state
    elif was_in_deadzone and not is_in_deadzone:
        self.previous_movements[ball_index]["in_deadzone"] = False
        logger.info(f"{self.game_id}/ball[{ball_index}]: out of deadzone")
    # Store current position for next frame's comparison
    self.previous_movements[ball_index]["last_position"] = {
        "x": ball["x"],
        "y": ball["y"],
    }

    if distance > self.outer_boundary:
        collision = self.handle_outside_boundary(ball, state)
        if collision:
            logger.info(f"{self.game_id}/ball[{ball_index}]/tunnel: {collision}")
            collision_result = self.collision_handler(
                collision, ball, state, cycle_data, ball_index
            )
            result.update(collision_result)
            result["skip_ball"] = True
    elif is_in_deadzone:
        result["skip_ball"] = True

    return result


def handle_outside_boundary(self, ball, state):
    """Handle ball outside boundary"""
    sector_info = None
    return self.handle_tunneling(
        ball, sector_info, state
    )  # jump to Collision Verification Phase


def get_inner_boundary(self, state, ball):
    BUFFER = 0.8
    return (
        self.inner_boundary - state["dimensions"]["paddle_width"] - ball["size"]
    ) * BUFFER


# Collision Candidate Phase abstarct


# Collision Verification Phase
def verify_collision_candidate(self, ball, collision_candidate, new_state):
    """Handle interaction between ball and side"""
    if collision_candidate["type"] == "tunneling":
        return self.handle_tunneling(ball, collision_candidate, new_state)

    collision, active = self.get_collision_check_range(
        ball, collision_candidate, new_state
    )
    if collision:
        if collision_candidate["type"] == "parallel":
            # Case 1: Ball moving parallel to side
            return self.handle_parallel(
                ball, collision_candidate, new_state
            )  # active could load into handle_parallel
        if active:
            # Case 2: Ball near active paddle side
            return self.handle_paddle(ball, collision_candidate, new_state)
        else:
            # Case 3: Ball near wall
            return self.handle_wall(ball, collision_candidate, new_state)

    return None


def get_collision_check_range(self, ball, collision_candidate, new_state):

    side_index = collision_candidate["side_index"]
    movement = collision_candidate["movement"]

    # Get basic collision parameters
    collision_distance = movement["current_distance"]
    is_active_side = side_index in self.active_sides

    # Calculate collision threshold based on side type
    if is_active_side:
        # For paddle sides, include paddle width in collision distance
        paddle_width = new_state["dimensions"]["paddle_width"]
        collision_check = collision_distance <= (ball["size"] + paddle_width)
    else:
        # For walls, just use ball size
        collision_check = collision_distance <= ball["size"]
    return collision_check, is_active_side


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


# Impact Processing Phase


def collision_handler(self, collision, ball, new_state, cycle_data, ball_index):
    """Main collision handler that delegates to specific collision type handlers"""
    gameover = {"game_over": False}
    if collision:
        if collision["type"] == "paddle":
            gameover.update(
                self.collision_paddle(collision, ball, new_state, cycle_data)
            )
        elif collision["type"] == "wall":
            gameover.update(self.collision_wall(collision, ball, new_state, cycle_data))
        elif collision["type"] == "miss":
            gameover.update(
                self.collision_miss(collision, ball, new_state, cycle_data, ball_index)
            )
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
            "last_hit_time": self.last_hit_time,
        },
        "physics": physics_data,
    }

    # Store data
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
    # current_time = time.time()
    # self.update_hit_combo(current_time, ball)
    # self.highest_recorded_speed = max(self.highest_recorded_speed, new_speed)

    return {
        "initial": initial_state,
        "final": {"velocity": new_velocities, "speed": new_speed},
        "combo": {
            "count": self.hit_combo,
            "highest_speed": self.highest_recorded_speed,
        },
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
    physics_data = self.bounce_wall(ball, collision)

    # Step 3: Create collision event data
    event_data = {
        "collision": collision,
        "timing": {"timestamp": time.time()},
        "physics": physics_data,
    }

    # Store data
    cycle_data["collision_data"].append(event_data)
    cycle_data["events"].append({"type": "wall_hit", "data": event_data})

    return {"game_over": False}


def bounce_wall(self, ball, collision):
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
        ball, collision["normal"], 0  # No offset for wall bounces
    )
    ball.update(new_velocities)

    # Return complete physics data
    return {
        "pre_collision_position": initial_position,
        "post_collision_position": {"x": ball["x"], "y": ball["y"]},
        "pre_collision_velocity": initial_velocity,
        "post_collision_velocity": new_velocities,
        "approach_speed": collision["approach_speed"],
        "hit_position": collision["hit_position"],
    }


def apply_ball_bounce_effect(self, ball, normal, offset=0, speed_multiplier=1.05):
    """
    Apply enhanced bounce effect to ball including reflection, slight randomization,
    and angle adjustments to avoid repetitive patterns while maintaining plausible physics.
    
    Args:
        ball (dict): Ball object
        normal (dict): Normal vector of collision
        offset (float): Normalized offset from center (-1 to 1)
        speed_multiplier (float): Speed increase factor
    Returns:
        dict: Updated ball velocities
    """
    # Calculate standard reflection
    dot_product = ball["velocity_x"] * normal["x"] + ball["velocity_y"] * normal["y"]
    reflected_x = ball["velocity_x"] - 2 * dot_product * normal["x"]
    reflected_y = ball["velocity_y"] - 2 * dot_product * normal["y"]

    # Calculate current angle relative to normal
    incident_angle = math.atan2(ball["velocity_y"], ball["velocity_x"])
    reflect_angle = math.atan2(reflected_y, reflected_x)
    
    # Add variation based on speed and angle
    current_speed = math.sqrt(ball["velocity_x"] ** 2 + ball["velocity_y"] ** 2)
    
    # Calculate angle relative to wall (0 = parallel, π/2 = perpendicular)
    relative_angle = abs(math.pi/2 - abs(incident_angle - math.atan2(normal["y"], normal["x"])))
    
    # Add more variation for shallow angles to avoid repetitive bounces
    if relative_angle < math.pi/6:  # Less than 30 degrees from parallel
        # Add stronger angle adjustment for very shallow angles
        max_angle_adjustment = math.pi/6 * (1 - relative_angle/(math.pi/6))
        angle_adjustment = random.uniform(-max_angle_adjustment, max_angle_adjustment)
    else:
        # Smaller random adjustment for more direct hits
        angle_adjustment = random.uniform(-math.pi/12, math.pi/12)
    
    # Apply speed-based angle adjustment (faster = less random)
    speed_factor = min(current_speed / (ball["size"] * 1.5), 1.0)
    angle_adjustment *= (1 - speed_factor * 0.7)  # Reduce randomness at high speeds
    
    # Apply the adjusted angle
    final_angle = reflect_angle + angle_adjustment
    
    # Calculate new velocity components
    new_speed = current_speed * speed_multiplier
    
    # Limit speed to prevent tunneling
    MAX_SPEED = ball["size"] * 1.5
    if new_speed > MAX_SPEED:
        new_speed = MAX_SPEED
    
    final_x = new_speed * math.cos(final_angle)
    final_y = new_speed * math.sin(final_angle)
    
    # Ensure we're still moving away from the wall
    new_dot_product = final_x * normal["x"] + final_y * normal["y"]
    if math.copysign(1, new_dot_product) == math.copysign(1, dot_product):
        # If we accidentally flipped direction, revert to standard reflection
        final_x = reflected_x
        final_y = reflected_y
        # Apply speed limit
        current_speed = math.sqrt(final_x ** 2 + final_y ** 2)
        if current_speed > MAX_SPEED:
            scale = MAX_SPEED / current_speed
            final_x *= scale
            final_y *= scale

    return {"velocity_x": final_x, "velocity_y": final_y}

   #def apply_ball_bounce_effect(self, ball, normal, offset=0, speed_multiplier=1.05):
    """
    Apply bounce effect to ball including reflection and speed increase
    Args:
        ball (dict): Ball object
        normal (dict): Normal vector of collision
        offset (float): Normalized offset from center (-1 to 1)
        speed_multiplier (float): Speed increase factor
    Returns:
        dict: Updated ball velocities
    """
    # Calculate reflection
    """dot_product = ball["velocity_x"] * normal["x"] + ball["velocity_y"] * normal["y"]

    reflected_x = ball["velocity_x"] - 2 * dot_product * normal["x"]
    reflected_y = ball["velocity_y"] - 2 * dot_product * normal["y"]

    # Apply angle modification based on offset
    angle_mod = offset * math.pi * 0.25
    cos_mod = math.cos(angle_mod)
    sin_mod = math.sin(angle_mod)

    final_x = reflected_x * cos_mod - reflected_y * sin_mod
    final_y = reflected_x * sin_mod + reflected_y * cos_mod

    # Apply speed increase
    current_speed = math.sqrt(ball["velocity_x"] ** 2 + ball["velocity_y"] ** 2)
    new_speed = current_speed * speed_multiplier
    # Limit speed to 80% of ball size to prevent tunneling
    MAX_SPEED = ball["size"] * 1.5
    if new_speed > MAX_SPEED:
        scale = MAX_SPEED / new_speed
        final_x *= scale
        final_y *= scale

    return {"velocity_x": (final_x), "velocity_y": (final_y)}
    """

def collision_miss(self, collision, ball, new_state, cycle_data, ball_index):
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
    self.reset_ball(ball, ball_index)

    # Step 3: Create collision event data
    event_data = {
        "collision": collision,
        "timing": {"timestamp": time.time()},
    }
    # Store data
    cycle_data["events"].append({"type": "miss", "data": event_data})
    # Check for winners
    winners = self.check_winner(new_state["scores"])
    if winners:  # If we have any winners
        """cycle_data["events"].append({
            "type": "game_over",
            "data": {
                "winners": winners,  # List of winning player indices
                "scores": new_state["scores"]
            }
        })"""
        return {"game_over": True}

    return {"game_over": False}


# needed in collison_miss and game_update()
def check_winner(self, scores, win_threshold=11):
    max_score = max(scores)
    if max_score >= win_threshold:
        # Find all players with max score
        return [i for i, score in enumerate(scores) if score == max_score]
    return []
