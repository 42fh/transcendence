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

    def init_game_state(self):
        """Initialize the game state with unified structure for circular pong"""
        try:
            # Initialize balls in the center moving in random directions
            balls = []
            for i in range(self.num_balls):
                angle = random.uniform(0, 2 * math.pi)
                speed = 0.006
                balls.append({
                    "x": float(0),
                    "y": float(0),
                    "velocity_x": float(speed * math.cos(angle)),
                    "velocity_y": float(speed * math.sin(angle)),
                    "size": float(0.05),
                })

            # Initialize paddles evenly spaced around the circle
            # Now including active and side_index for unified structure
            paddles = []
            for i in range(self.num_players):
                paddles.append({
                    "position": float(0.5),
                    "active": True,          # All paddles are always active in circular
                    "side_index": i          # In circular, side_index represents the player's position around the circle
                })

            state = {
                "balls": balls,
                "paddles": paddles,
                "scores": [int(0)] * self.num_players,
                "dimensions": {
                    "paddle_length": float(0.4),
                    "paddle_width": float(0.2),
                },
                "game_type": "circular"
            }
            return state

        except Exception as e:
            print(f"Error in init_game_state: {e}")
            # Return a minimal valid state as fallback
            return {
                "balls": [{
                    "x": float(0.0),
                    "y": float(0.0),
                    "velocity_x": float(0.0),
                    "velocity_y": float(0.0),
                    "size": float(0.02)
                }],
                "paddles": [{
                    "position": float(0.0),
                    "active": True,
                    "side_index": 0
                }],
                "scores": [0] * self.num_players,
                "dimensions": {
                    "paddle_length": float(0.2),
                    "paddle_width": float(0.02)
                },
                "game_type": "circular"
            }
    

    async def game_logic(self, current_state):
        def calculate_distance(point):
            return math.sqrt(point["x"] ** 2 + point["y"] ** 2)

        def calculate_angle(point):
            angle = math.atan2(point["y"], point["x"]) * (180 / math.pi)
            return angle + 360 if angle < 0 else angle

        def get_max_paddle_offset(sector_index, sector_count, ball_size, paddle_length):
            sector_size = 360 / sector_count
            hit_zone_angle = ball_size * 180 / math.pi * 0.5
            paddle_angle = sector_size * paddle_length
            total_angle_needed = paddle_angle + (hit_zone_angle * 2)
            
            return 0 if total_angle_needed >= sector_size else (sector_size - total_angle_needed) / 2

        def calculate_paddle_collision(ball, distance, paddles, dimensions):
            angle = calculate_angle(ball)
            sector_count = len(paddles)
            sector_size = 360 / sector_count
            actual_paddle_length = sector_size * dimensions["paddle_length"]
            angular_hit_zone = ball["size"] * 180 / math.pi * 0.5
            
            # Check radial distance (distance from center)
            radial_hit_zone = ball["size"]
            outer_radius = 1.0
            inner_radius = outer_radius - dimensions["paddle_width"]
            
            is_in_radial_range = (distance >= (inner_radius - radial_hit_zone) and 
                                 distance <= outer_radius)
            
            if not is_in_radial_range:
                return None

            # Calculate active paddle positions
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
                angle_diff = ((angle - center + 180) % 360) - 180
                
                if abs(angle_diff) <= (half_size + angular_hit_zone):
                    # Calculate normalized offset
                    if abs(angle_diff) <= half_size:
                        normalized_offset = angle_diff / half_size
                    else:
                        hit_zone_diff = abs(angle_diff) - half_size
                        hit_zone_norm = hit_zone_diff / angular_hit_zone
                        normalized_offset = 1 + hit_zone_norm if angle_diff > 0 else -1 - hit_zone_norm
                    
                    # Return collision information
                    return {
                        "type": "paddle",
                        "side_index": paddle_info["side_index"],
                        "offset": angle_diff,
                        "normalized_offset": max(-2, min(2, normalized_offset)),
                        "normal": {
                            "x": ball["x"] / distance,
                            "y": ball["y"] / distance
                        },
                        "is_edge_hit": abs(angle_diff) > half_size
                    }
            
            return None

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
                failed_side_index = int(angle / sector_size)
                
                # Update scores
                new_state["scores"] = [
                    score + (1 if i != failed_side_index else 0)
                    for i, score in enumerate(new_state["scores"])
                ]
                
                # Reset ball
                self.reset_ball(ball, speed=0.003)  # Using lower speed for circular
                
                # Check win condition
                if self.check_winner(new_state["scores"]):
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
                new_velocities = self.apply_ball_bounce_effect(
                    ball,
                    collision["normal"],
                    collision["normalized_offset"]
                )
                ball.update(new_velocities)
        
        return new_state, game_over


    def determine_winner(self, state):
        """Determine the winner of the game"""
        return self.check_winner(state["scores"])         
