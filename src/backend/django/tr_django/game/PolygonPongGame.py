from .AGameManager import AGameManager
import math
import random
import msgpack

@AGameManager.register_game_type("polygon")
class PolygonPongGame(AGameManager):
    def __init__(self, game_id):
        super().__init__(game_id)
        self.num_sides = 4  # Default number of sides
        self.num_paddles = 2  # Default number of paddles

    def init_game_state(self):
        """Initialize the game state with unified structure for polygon pong"""
        try:
            # Initialize ball with random direction in the unified ball array format
            angle = random.uniform(0, 2 * math.pi)
            speed = 0.006
            
            balls = [{
                "x": float(0),
                "y": float(0),
                "velocity_x": float(speed * math.cos(angle)),
                "velocity_y": float(speed * math.sin(angle)),
                "size": float(0.1)
            }]

            # Initialize paddles array with structured objects
            paddles = []
            spacing = math.floor(self.num_sides / self.num_paddles)
            active_paddle_count = 0  # Keep track of active paddles
            
            # Create all potential paddle positions
            for side_index in range(self.num_sides):
                # Calculate if this side should have an active paddle
                is_active = False
                for i in range(min(self.num_paddles, self.num_sides)):
                    if side_index == (i * spacing) % self.num_sides:
                        is_active = True
                        active_paddle_count += 1
                        break
                
                # Add paddle object for this side
                paddles.append({
                    "position": float(0.5),  # Center position
                    "active": is_active,     # Whether this side has an active paddle
                    "side_index": side_index # Which polygon side this paddle is on
                })

            state = {
                "balls": balls,
                "paddles": paddles,
                "scores": [int(0)] * active_paddle_count,  # Only create scores for active paddles
                "dimensions": {
                    "paddle_length": float(0.3),
                    "paddle_width": float(0.2)
                },
                "game_type": "polygon"
            }
            
            return state

        except Exception as e:
            print(f"Error in init_game_state: {e}")
            # Return minimal valid state as fallback
            return {
                "balls": [{
                    "x": float(0),
                    "y": float(0),
                    "velocity_x": float(0),
                    "velocity_y": float(0),
                    "size": float(0.05)
                }],
                "paddles": [{
                    "position": float(0.5),
                    "active": True,
                    "side_index": 0
                }],
                "scores": [0],  # Single score for single active paddle
                "dimensions": {
                    "paddle_length": float(0.3),
                    "paddle_width": float(0.2)
                },
                "game_type": "polygon"
            }

    async def game_logic(self, current_state):
        def get_polygon_vertices():
            vertices = []
            angle_step = (2 * math.pi) / self.num_sides
            
            for i in range(self.num_sides):
                angle = i * angle_step - math.pi / 2  # Start from top
                vertices.append({
                    "x": math.cos(angle),
                    "y": math.sin(angle)
                })
            return vertices

        def calculate_distance_to_side(point, side_index, vertices):
            start = vertices[side_index]
            end = vertices[(side_index + 1) % self.num_sides]
            
            segment_x = end["x"] - start["x"]
            segment_y = end["y"] - start["y"]
            point_x = point["x"] - start["x"]
            point_y = point["y"] - start["y"]
            
            segment_length_sq = segment_x**2 + segment_y**2
            t = max(0, min(1, (point_x * segment_x + point_y * segment_y) / segment_length_sq))
            
            projection_x = start["x"] + t * segment_x
            projection_y = start["y"] + t * segment_y
            
            dx = point["x"] - projection_x
            dy = point["y"] - projection_y
            distance = math.sqrt(dx**2 + dy**2)
            
            def calculate_normal(dx, dy, distance):
                if distance < 1e-10:
                    segment_length = math.sqrt(segment_length_sq)
                    if segment_length < 1e-10:
                        return {"x": 1, "y": 0}
                    return {
                        "x": -segment_y / segment_length,
                        "y": segment_x / segment_length
                    }
                return {
                    "x": dx / distance,
                    "y": dy / distance
                }

            return {
                "distance": distance,
                "position": t,
                "projection": {"x": projection_x, "y": projection_y},
                "normal": calculate_normal(dx, dy, distance)
            }

        def get_active_paddle_index(side_index, paddles):
            """Convert side_index to active paddle index"""
            active_count = 0
            for paddle in paddles:
                if paddle["active"]:
                    if paddle["side_index"] == side_index:
                        return active_count
                    active_count += 1
            return None

        """def calculate_paddle_collision(side_index, collision_info, ball, paddles, dimensions):
            paddle = next((p for p in paddles if p["side_index"] == side_index), None)
            if not paddle or not paddle["active"]:
                return None

            vertices = get_polygon_vertices()
            start = vertices[side_index]
            end = vertices[(side_index + 1) % self.num_sides]
            
            # Calculate side vector and normal
            dx = end["x"] - start["x"]
            dy = end["y"] - start["y"]
            side_length = math.sqrt(dx**2 + dy**2)
            
            # Normalize vectors
            normal_x = -dy / side_length
            normal_y = dx / side_length
            
            # Paddle dimensions with slightly larger collision zone at edges
            paddle_length = side_length * dimensions["paddle_length"]
            half_paddle_length = paddle_length / 2 * 1.1  # 10% larger collision zone at edges
            
            # Calculate paddle's actual position in space
            paddle_position = paddle["position"] * side_length
            paddle_center_x = start["x"] + (dx * paddle["position"])
            paddle_center_y = start["y"] + (dy * paddle["position"])
            
            # Expand paddle thickness near edges for better corner detection
            base_thickness = dimensions["paddle_width"] + ball["size"]
            edge_distance = abs(ball["x"] - paddle_center_x) / half_paddle_length
            paddle_thickness = base_thickness * (1 + 0.2 * edge_distance)  # Up to 20% thicker at edges
            
            # Ball to paddle calculations
            ball_to_paddle_x = ball["x"] - paddle_center_x
            ball_to_paddle_y = ball["y"] - paddle_center_y
            
            # Project ball position onto paddle line
            projected_len = (ball_to_paddle_x * dx + ball_to_paddle_y * dy) / side_length
            
            # Calculate distance from ball to paddle surface
            dist_to_paddle = abs(ball_to_paddle_x * normal_x + ball_to_paddle_y * normal_y)
            
            # Check for corner collisions
            is_near_edge = abs(projected_len) > (half_paddle_length * 0.8)
            is_corner_collision = False
            
            if is_near_edge:
                # Check both corners
                for corner_offset in [-half_paddle_length, half_paddle_length]:
                    corner_x = paddle_center_x + (dx * corner_offset / side_length)
                    corner_y = paddle_center_y + (dy * corner_offset / side_length)
                    
                    # Distance from ball to corner
                    corner_dx = ball["x"] - corner_x
                    corner_dy = ball["y"] - corner_y
                    corner_dist = math.sqrt(corner_dx**2 + corner_dy**2)
                    
                    if corner_dist <= (ball["size"] + dimensions["paddle_width"]) * 1.2:  # Slightly larger corner collision zone
                        is_corner_collision = True
                        break
            
            # Expanded collision checks
            is_within_paddle_length = abs(projected_len) <= half_paddle_length or is_corner_collision
            is_within_paddle_thickness = dist_to_paddle <= paddle_thickness
            
            active_paddle_index = get_active_paddle_index(side_index, paddles)
            
            if is_within_paddle_length and is_within_paddle_thickness:
                print("\n=== COLLISION DETECTED ===")
                print(f"Edge Hit: {is_near_edge}")
                print(f"Corner Hit: {is_corner_collision}")
                print(f"Distance to Paddle: {dist_to_paddle:.4f}")
                print(f"Projected Length: {projected_len:.4f}")
                print("=========================\n")
                
                return {
                    "type": "paddle",
                    "side_index": side_index,
                    "active_paddle_index": active_paddle_index,
                    "offset": projected_len,
                    "normalized_offset": projected_len / (half_paddle_length / 1.1),  # Adjust for the expanded collision zone
                    "distance": dist_to_paddle,
                    "position": (paddle_position + projected_len) / side_length,
                    "projection": collision_info["projection"],
                    "normal": {
                        "x": normal_x,
                        "y": normal_y
                    },
                    "is_edge_hit": is_near_edge,
                    "is_corner_hit": is_corner_collision
                }
            
            return {
                "type": "miss",
                "side_index": side_index,
                "active_paddle_index": active_paddle_index,
                "distance": collision_info["distance"],
                "position": collision_info["position"],
                "projection": collision_info["projection"],
                "normal": collision_info["normal"]
            }

        """""" 
        def calculate_paddle_collision(side_index, collision_info, ball, paddles, dimensions):
            paddle = next((p for p in paddles if p["side_index"] == side_index), None)
            if not paddle or not paddle["active"]:
                return None

            vertices = get_polygon_vertices()
            start = vertices[side_index]
            end = vertices[(side_index + 1) % self.num_sides]
            
            # Calculate side vector and normal
            dx = end["x"] - start["x"]
            dy = end["y"] - start["y"]
            side_length = math.sqrt(dx**2 + dy**2)
            
            # Normalize vectors
            normal_x = -dy / side_length
            normal_y = dx / side_length
            
            # Paddle dimensions
            paddle_length = side_length * dimensions["paddle_length"]
            half_paddle_length = paddle_length / 2
            total_collision_width = dimensions["paddle_width"] + ball["size"]

            # Paddle center position
            paddle_position = paddle["position"] * side_length
            
            # Vector from start to ball center
            to_point_x = ball["x"] - start["x"]
            to_point_y = ball["y"] - start["y"]
            
            # Project point onto side line
            projected_len = (to_point_x * dx + to_point_y * dy) / side_length
            
            # Distance along normal direction
            normal_dist = abs(to_point_x * normal_x + to_point_y * normal_y)
            
            # Check if within paddle length
            dist_from_paddle_center = abs(projected_len - paddle_position)
            is_within_paddle_length = dist_from_paddle_center <= half_paddle_length

            # Check if within collision width
            is_within_collision_width = normal_dist <= total_collision_width
            
            # NEW: Edge collision detection
            if not is_within_paddle_length and normal_dist <= total_collision_width:
                # Check distance to each corner of the paddle
                corner_positions = [
                    paddle_position - half_paddle_length,
                    paddle_position + half_paddle_length
                ]
                
                for corner_pos in corner_positions:
                    # Calculate corner position
                    corner_x = start["x"] + (dx * corner_pos/side_length)
                    corner_y = start["y"] + (dy * corner_pos/side_length)
                    
                    # Add paddle width in normal direction
                    corner_normal_x = corner_x + normal_x * dimensions["paddle_width"]
                    corner_normal_y = corner_y + normal_y * dimensions["paddle_width"]
                    
                    # Calculate distance from ball center to corner
                    delta_x = ball["x"] - corner_normal_x
                    delta_y = ball["y"] - corner_normal_y
                    corner_dist = math.sqrt(delta_x**2 + delta_y**2)
                    
                    # If ball intersects with corner
                    if corner_dist <= ball["size"]:
                        is_within_paddle_length = True
                        break

            active_paddle_index = get_active_paddle_index(side_index, paddles)
            
            if is_within_paddle_length and is_within_collision_width:
                position_diff = projected_len - paddle_position
                return {
                    "type": "paddle",
                    "side_index": side_index,
                    "active_paddle_index": active_paddle_index,
                    "offset": position_diff,
                    "normalized_offset": position_diff / half_paddle_length,
                    "distance": normal_dist,
                    "position": projected_len / side_length,
                    "projection": collision_info["projection"],
                    "normal": collision_info["normal"],
                    "is_edge_hit": abs(position_diff) > half_paddle_length * 0.9  # Added flag for edge hits
                }
            
            return {
                "type": "miss",
                "side_index": side_index,
                "active_paddle_index": active_paddle_index,
                "distance": collision_info["distance"],
                "position": collision_info["position"],
                "projection": collision_info["projection"],
                "normal": collision_info["normal"]
            }"""
        def calculate_paddle_collision(side_index, collision_info, ball, paddles, dimensions):
            vertices = get_polygon_vertices()
            paddle = next((p for p in paddles if p["side_index"] == side_index), None)
            if not paddle or not paddle["active"]:
                return None

            start = vertices[side_index]
            end = vertices[(side_index + 1) % self.num_sides]
            
            # Calculate side vector and normal
            dx = end["x"] - start["x"]
            dy = end["y"] - start["y"]
            side_length = math.sqrt(dx**2 + dy**2)
            
            # Normalize vectors
            normal_x = -dy / side_length
            normal_y = dx / side_length
            
            # Paddle dimensions
            paddle_length = side_length * dimensions["paddle_length"]
            half_paddle_length = paddle_length / 2
            
            # Calculate paddle's actual position in space
            paddle_position = paddle["position"] * side_length
            paddle_center_x = start["x"] + (dx * paddle["position"])
            paddle_center_y = start["y"] + (dy * paddle["position"])
            
            # Calculate paddle thickness zone
            paddle_thickness = dimensions["paddle_width"] + ball["size"]
            
            # Create paddle collision zone
            paddle_min_x = paddle_center_x - (dx * half_paddle_length / side_length)
            paddle_min_y = paddle_center_y - (dy * half_paddle_length / side_length)
            paddle_max_x = paddle_center_x + (dx * half_paddle_length / side_length)
            paddle_max_y = paddle_center_y + (dy * half_paddle_length / side_length)
            
            # Check if ball is within paddle's extended collision zone
            ball_to_paddle_x = ball["x"] - paddle_center_x
            ball_to_paddle_y = ball["y"] - paddle_center_y
            
            # Project ball position onto paddle line
            projected_len = (ball_to_paddle_x * dx + ball_to_paddle_y * dy) / side_length
            
            # Calculate distance from ball to paddle surface
            dist_to_paddle = abs(ball_to_paddle_x * normal_x + ball_to_paddle_y * normal_y)
            
            # Check if ball is within paddle's bounds
            is_within_paddle_length = abs(projected_len) <= half_paddle_length
            is_within_paddle_thickness = dist_to_paddle <= paddle_thickness
            
            active_paddle_index = get_active_paddle_index(side_index, paddles)
            
            if is_within_paddle_length and is_within_paddle_thickness:
                print("\n=== PADDLE COLLISION DETECTED ===")
                print(f"Ball Properties:")
                print(f"  - Position: x={ball['x']:.4f}, y={ball['y']:.4f}")
                print(f"  - Size: {ball['size']:.4f}")
                print(f"  - Velocity: vx={ball['velocity_x']:.4f}, vy={ball['velocity_y']:.4f}")
                
                print(f"\nPaddle Properties:")
                print(f"  - Side Index: {side_index}")
                print(f"  - Active Paddle Index: {active_paddle_index}")
                print(f"  - Center Position: x={paddle_center_x:.4f}, y={paddle_center_y:.4f}")
                print(f"  - Length: {paddle_length:.4f} (half={half_paddle_length:.4f})")
                print(f"  - Thickness Zone: {paddle_thickness:.4f}")
                
                print(f"\nCollision Details:")
                print(f"  - Distance to Paddle: {dist_to_paddle:.4f}")
                print(f"  - Projected Length: {projected_len:.4f}")
                print(f"  - Is Edge Hit: {abs(projected_len) > half_paddle_length * 0.9}")
                print(f"  - Normal Vector: nx={normal_x:.4f}, ny={normal_y:.4f}")
                print("=============================\n")
                return {
                    "type": "paddle",
                    "side_index": side_index,
                    "active_paddle_index": active_paddle_index,
                    "offset": projected_len,
                    "normalized_offset": projected_len / half_paddle_length,
                    "distance": dist_to_paddle,
                    "position": (paddle_position + projected_len) / side_length,
                    "projection": collision_info["projection"],
                    "normal": collision_info["normal"],
                    "is_edge_hit": abs(projected_len) > half_paddle_length * 0.9
                }
            
            return {
                "type": "miss",
                "side_index": side_index,
                "active_paddle_index": active_paddle_index,
                "distance": collision_info["distance"],
                "position": collision_info["position"],
                "projection": collision_info["projection"],
                "normal": collision_info["normal"]
            }


        """def find_nearest_collision(ball, paddles, vertices):
            best_collision = None
            min_distance = float('inf')

            for i in range(self.num_sides):
                collision_info = calculate_distance_to_side(ball, i, vertices)
                
                if collision_info["distance"] <= ball["size"]:
                    paddle = next((p for p in paddles if p["side_index"] == i), None)
                    
                    if paddle and paddle["active"]:
                        collision_info = calculate_paddle_collision(i, collision_info, ball, paddles, current_state["dimensions"])
                        if collision_info and collision_info["distance"] < min_distance:
                            min_distance = collision_info["distance"]
                            best_collision = collision_info
                    else:
                        if collision_info["distance"] < min_distance:
                            min_distance = collision_info["distance"]
                            best_collision = {
                                "type": "wall",
                                "side_index": i,
                                **collision_info
                            }

            return best_collision"""
        def find_nearest_collision(ball, paddles, vertices):
            best_collision = None
            min_distance = float('inf')

            for i in range(self.num_sides):
                collision_info = calculate_distance_to_side(ball, i, vertices)
                paddle = next((p for p in paddles if p["side_index"] == i), None)
                
                if paddle and paddle["active"]:
                    # Check for paddle collision first, regardless of wall distance
                    paddle_collision = calculate_paddle_collision(i, collision_info, ball, paddles, current_state["dimensions"])
                    if paddle_collision and paddle_collision["type"] == "paddle" and paddle_collision["distance"] < min_distance:
                        min_distance = paddle_collision["distance"]
                        best_collision = paddle_collision
                    elif paddle_collision["type"] == "miss" and collision_info["distance"] <= ball["size"]:
                        # Now we properly register misses when the ball is past the wall
                        min_distance = collision_info["distance"]
                        best_collision = paddle_collision
                else:
                    # Only check wall collision if there's no paddle on this side
                    if collision_info["distance"] <= ball["size"] and collision_info["distance"] < min_distance:
                        min_distance = collision_info["distance"]
                        best_collision = {
                            "type": "wall",
                            "side_index": i,
                            **collision_info
                        }

            return best_collision
            """            
        def apply_collision_resolution(ball, collision):
            """"""Adjust ball position to prevent paddle/wall penetration"""
            """# Add a small buffer to prevent sticking
            BUFFER = 0.001
            
            if collision["type"] in ["paddle", "wall"]:
                # Calculate penetration depth
                penetration = ball["size"] - collision["distance"]
                
                if penetration > 0:
                    # Move ball out along collision normal by penetration amount plus buffer
                    ball["x"] = (collision["projection"]["x"] + 
                                collision["normal"]["x"] * (ball["size"] + BUFFER))
                    ball["y"] = (collision["projection"]["y"] + 
                                collision["normal"]["y"] * (ball["size"] + BUFFER))
                    
                    # For edge hits, ensure proper positioning
                    if collision.get("is_edge_hit", False):
                        # Additional adjustment to account for edge collision
                        ball["x"] += collision["normal"]["x"] * BUFFER
                        ball["y"] += collision["normal"]["y"] * BUFFER
            """
        def apply_collision_resolution(ball, collision):
            """Adjust ball position to prevent paddle/wall penetration"""
            # Add a small buffer to prevent sticking
            BUFFER = 0.001
            
            if collision["type"] in ["paddle", "wall"]:
                # Calculate penetration depth
                penetration = ball["size"] - collision["distance"]
                
                if penetration > 0:
                    if collision["type"] == "paddle":
                        # For paddle collisions, use the paddle's surface as the reference point
                        # Get the normal vector pointing away from the paddle
                        normal_x = collision["normal"]["x"]
                        normal_y = collision["normal"]["y"]
                        
                        # Calculate the point on the paddle's surface closest to the ball
                        paddle_surface_x = ball["x"] - normal_x * collision["distance"]
                        paddle_surface_y = ball["y"] - normal_y * collision["distance"]
                        
                        # Move ball out to the edge of the paddle's collision zone
                        ball["x"] = paddle_surface_x + normal_x * (ball["size"] + BUFFER)
                        ball["y"] = paddle_surface_y + normal_y * (ball["size"] + BUFFER)
                    else:
                        # For wall collisions, use the original wall projection
                        ball["x"] = (collision["projection"]["x"] + 
                                    collision["normal"]["x"] * (ball["size"] + BUFFER))
                        ball["y"] = (collision["projection"]["y"] + 
                                    collision["normal"]["y"] * (ball["size"] + BUFFER))
                    
                    # For edge hits, ensure proper positioning
                    if collision.get("is_edge_hit", False):
                        # Additional adjustment to account for edge collision
                        ball["x"] += collision["normal"]["x"] * BUFFER
                        ball["y"] += collision["normal"]["y"] * BUFFER
       
         # Main game logic
        game_over = False
        new_state = current_state.copy()
        vertices = get_polygon_vertices()

        # Process each ball
        for ball_idx, ball in enumerate(new_state["balls"]):
            # Move ball
            ball["x"] += ball["velocity_x"]
            ball["y"] += ball["velocity_y"]

        # Check for collisions
            collision = find_nearest_collision(ball, new_state["paddles"], vertices)
            if collision:
                if collision["type"] in ["paddle", "wall"]:
                    apply_collision_resolution(ball, collision)
                    new_velocities = self.apply_ball_bounce_effect(
                        ball, 
                        collision["normal"],
                        collision.get("normalized_offset", 0)
                    )
                    ball.update(new_velocities)
                    post_collision = find_nearest_collision(ball, new_state["paddles"], vertices)
                    if post_collision and post_collision["distance"] < ball["size"]:
                        apply_collision_resolution(ball, post_collision)
                elif collision["type"] == "miss":
                    active_paddle_index = collision.get("active_paddle_index")
                    if active_paddle_index is not None:
                        # Update scores only for active paddles
                        new_state["scores"] = [
                            score + (1 if i != active_paddle_index else 0)
                            for i, score in enumerate(new_state["scores"])
                        ]
                    
                        # Reset this ball
                        self.reset_ball(ball)
                        # Check win condition
                        if self.check_winner(new_state["scores"]):
                            game_over = True

        return new_state, game_over
