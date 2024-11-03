from .AGameManager import AGameManager
import math
import random
import msgpack

@AGameManager.register_game_type("circular")
class CircularPongGame(AGameManager):
    def __init__(self, game_id):
        super().__init__(game_id)
        self.num_players = 3  # Default number of players
        self.num_balls = 1    # Default number of balls

    def apply_game_settings(self):
        """Apply game-specific values from settings"""
        self.num_players = self.settings['num_players']
        self.num_balls = self.settings['num_balls']

    def get_game_type(self):
        return "circular"

    
    def game_logic(self, current_state):
        def calculate_distance(point):
            return math.sqrt(point["x"] ** 2 + point["y"] ** 2)

        def calculate_angle(point):
            angle = math.atan2(point["y"], point["x"]) * (180 / math.pi)
            return angle + 360 if angle < 0 else angle

        def get_max_paddle_offset(sector_index, sector_count, ball_size, paddle_length):
            """Calculate maximum allowed paddle offset within its sector"""
            sector_size = 360 / sector_count
            hit_zone_angle = ball_size * 180 / math.pi * 0.5
            paddle_angle = sector_size * paddle_length
            total_angle_needed = paddle_angle + (hit_zone_angle * 2)
            
            return 0 if total_angle_needed >= sector_size else (sector_size - total_angle_needed) / 2

        def calculate_paddle_collision(ball, distance, paddles, dimensions):
            """Detect collisions between ball and paddles with constrained sector movement"""
            angle = calculate_angle(ball)
            sector_count = len(paddles)
            sector_size = 360 / sector_count
            actual_paddle_length = sector_size * dimensions["paddle_length"]
            hit_zone_angle = ball["size"] * 180 / math.pi * 0.5
            
            # Check radial distance (distance from center)
            radial_hit_zone = ball["size"]
            outer_radius = 1.0
            inner_radius = outer_radius - dimensions["paddle_width"]
            
            is_in_radial_range = (distance >= (inner_radius - radial_hit_zone) and 
                                 distance <= outer_radius)
            
            if not is_in_radial_range:
                return None

            # Calculate active paddle positions with constrained movement
            active_paddle_centers = []
            for paddle in paddles:
                if not paddle["active"]:
                    continue
                    
                max_offset = get_max_paddle_offset(
                    paddle["side_index"], 
                    sector_count,
                    ball["size"],
                    dimensions["paddle_length"]
                )
                # Convert paddle position (0-1) to angle offset within allowed range
                offset_angle = (paddle["position"] - 0.5) * 2 * max_offset
                position = (paddle["side_index"] * sector_size) + offset_angle
                
                active_paddle_centers.append({
                    "center": position % 360,
                    "side_index": paddle["side_index"]
                })

            # Check for collisions with active paddles
            for paddle_info in active_paddle_centers:
                center = paddle_info["center"]
                half_size = actual_paddle_length / 2
                
                # Calculate angle difference with wrapping
                angle_diff = ((angle - center + 180) % 360) - 180
                
                if abs(angle_diff) <= (half_size + hit_zone_angle):
                    # Calculate normalized offset for bounce angle
                    if abs(angle_diff) <= half_size:
                        normalized_offset = angle_diff / half_size
                    else:
                        hit_zone_diff = abs(angle_diff) - half_size
                        hit_zone_norm = hit_zone_diff / hit_zone_angle
                        normalized_offset = 1 + hit_zone_norm if angle_diff > 0 else -1 - hit_zone_norm
                    
                    # Calculate radial position for collision response
                    radial_position = (distance - (inner_radius - radial_hit_zone)) / \
                                    (dimensions["paddle_width"] + radial_hit_zone)
                    
                    return {
                        "type": "paddle",
                        "side_index": paddle_info["side_index"],
                        "offset": angle_diff,
                        "normalized_offset": max(-2, min(2, normalized_offset)),
                        "radial_position": radial_position,
                        "normal": {
                            "x": ball["x"] / distance,
                            "y": ball["y"] / distance
                        },
                        "is_edge_hit": abs(angle_diff) > half_size
                    }
            
            return None

        def apply_ball_bounce_effect(ball, normal, normalized_offset):
            """Calculate new ball velocity after paddle collision"""
            # Calculate current velocity vector
            velocity_magnitude = math.sqrt(ball["velocity_x"]**2 + ball["velocity_y"]**2)
            
            # Calculate reflection
            dot_product = (ball["velocity_x"] * normal["x"] + ball["velocity_y"] * normal["y"])
            reflected_x = ball["velocity_x"] - 2 * dot_product * normal["x"]
            reflected_y = ball["velocity_y"] - 2 * dot_product * normal["y"]
            
            # Apply paddle offset effect (angle adjustment)
            offset_angle = normalized_offset * math.pi * 0.25  # Max ±45 degree adjustment
            cos_offset = math.cos(offset_angle)
            sin_offset = math.sin(offset_angle)
            
            # Apply the offset rotation
            final_velocity_x = reflected_x * cos_offset - reflected_y * sin_offset
            final_velocity_y = reflected_x * sin_offset + reflected_y * cos_offset
            
            # Normalize and apply speed with slight increase
            magnitude = math.sqrt(final_velocity_x**2 + final_velocity_y**2)
            speed = velocity_magnitude * 1.05  # 5% speed increase on hit
            
            return {
                "velocity_x": (final_velocity_x / magnitude) * speed,
                "velocity_y": (final_velocity_y / magnitude) * speed
            }

        # Main game logic
        game_over = False
        new_state = current_state.copy()
        
        # Process each ball
        for ball in new_state["balls"]:
            # Move ball
            ball["x"] += ball["velocity_x"]
            ball["y"] += ball["velocity_y"]
            
            distance = calculate_distance(ball)
            
            # Check if ball is out of bounds (missed all paddles)
            if distance > 1.0:
                angle = calculate_angle(ball)
                sector_size = 360 / len(new_state["paddles"])
                # Adjust angle calculation to match sector boundaries
                shifted_angle = (angle + (sector_size/2)) % 360
                failed_side_index = int(shifted_angle / sector_size)
                
                # Update scores (everyone but the failing paddle gets a point)
                new_state["scores"] = [
                    score + (1 if i != failed_side_index else 0)
                    for i, score in enumerate(new_state["scores"])
                ]
                
                # Reset ball position
                ball["x"] = 0
                ball["y"] = 0
                
                # Set new random direction
                new_angle = random.uniform(0, 2 * math.pi)
                speed = 0.003  # Initial ball speed
                ball["velocity_x"] = speed * math.cos(new_angle)
                ball["velocity_y"] = speed * math.sin(new_angle)
                
                # Check win condition
                if max(new_state["scores"]) >= 11:  # Win at 11 points
                    game_over = True
                    break
            
            # Handle paddle collisions
            collision = calculate_paddle_collision(
                ball, 
                distance, 
                new_state["paddles"], 
                new_state["dimensions"]
            )
            
            if collision and collision["type"] == "paddle":
                # Apply bounce effect with the calculated normal and offset
                new_velocities = apply_ball_bounce_effect(
                    ball,
                    collision["normal"],
                    collision["normalized_offset"]
                )
                ball["velocity_x"] = new_velocities["velocity_x"]
                ball["velocity_y"] = new_velocities["velocity_y"]
        
        return new_state, game_over








    def determine_winner(self, state):
        """Determine the winner of the game"""
        return self.check_winner(state["scores"])         
