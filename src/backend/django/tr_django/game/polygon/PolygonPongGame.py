from .AGameManager import AGameManager
import math
import random
import msgpack
import time


@add_collision_handlers     # Handles specific collision types
@add_movement_tracking     # Tracks ball movement data
@add_collision_detection   # Detects potential collisions
@add_ratio_calculations   # Polygon deformation 
@add_polygon_setup       # Basic polygon structure
@add_helper_methods     # Utility functions
@AGameManager.register_game_type("polygon")
class PolygonPongGame(AGameManager):
    def __init__(self, game_id):
        super().__init__(game_id)
        self.num_sides = 4  # Default number of sides
        self.num_paddles = 2  # Default number of paddles
        self.vertices = None  # Will store calculated vertices
        self.active_sides = None  # Will store which sides have paddles
        self.side_normals = None  # Will store normal vectors for each side
        self.previous_movements = []   # Will be initialized after num_sides is set from settings
        self.game_mode = 'regular'  # Default mode
        # Initialize combo system
        self.hit_combo = 0
        self.last_hit_time = 0
        self.combo_timeout = 1.5  # seconds
        self.highest_recorded_speed = 0




    async def apply_game_settings(self):
        """Apply game-specific values from settings"""
        self.num_sides = self.settings['sides']
        self.num_paddles = self.settings['num_players']
        self.game_mode = self.settings.get('mode', 'regular')  # Get mode from settings
        self.active_sides = self._get_player_side_indices()
        self.initialize_ball_movements(self.settings.get('num_balls', 1))
        self.calculate_polygon_vertices()
        self.calculate_side_normals()
        await self.store_vertices(self.vertices)


    def get_game_type(self):
        return "polygon"



    # 


    async def game_logic(self, current_state):
        """
        Main game logic loop processing ball movement and collisions.
        """
        game_over = False
        new_state = current_state.copy()
        current_time = time.time()  # Get current time for combo system

        # Process each ball
        for ball_index, ball in enumerate(new_state["balls"]):
            # Move ball
            ball["x"] += ball["velocity_x"]
            ball["y"] += ball["velocity_y"]

            # Get current sector for optimization
            current_sector = self.get_ball_sector(ball, ball_index, new_state)
            if not current_sector:
                continue

            # Initialize collision as None
            collision = None
                
            # Handle different movement cases
            if current_sector['type'] == 'tunneling':
                collision = self.handle_tunneling(ball, current_sector, new_state)
            elif current_sector['movement']['current_distance'] <= ball['size']:
                if current_sector['type'] == 'parallel':
                    collision = self.handle_parallel(ball, current_sector, new_state)
                elif current_sector['side_index'] in self.active_sides:
                    collision = self.handle_paddle(ball, current_sector, new_state)
                else:
                    collision = self.handle_wall(ball, current_sector, new_state)

            # Process collision results
            if collision:
                if collision["type"] == "paddle":
                    # Update combo for paddle hits
                    self.update_hit_combo(current_time, ball)
                    # Apply bounce effect
                    new_velocities = self.apply_ball_bounce_effect(
                        ball, 
                        collision["normal"],
                        collision.get("normalized_offset", 0)
                    )
                    ball.update(new_velocities)

                elif collision["type"] == "wall":
                    # Apply bounce effect without updating combo
                    new_velocities = self.apply_ball_bounce_effect(
                        ball, 
                        collision["normal"],
                        0  # No offset for wall bounces
                    )
                    ball.update(new_velocities)

                # Check for stuck condition after bounce
                if collision["type"] in ["paddle", "wall"]:
                    post_sector = self.get_ball_sector(ball, ball_index, new_state)
                    if post_sector:
                        post_collision = self._find_nearest_collision(
                            ball, 
                            new_state["paddles"], 
                            self.vertices,
                            post_sector,
                            new_state
                        )
                        if post_collision and post_collision["distance"] < ball["size"]:
                            self.apply_collision_resolution(ball, post_collision)

                elif collision["type"] == "miss":
                    # Reset combo on miss
                    self.hit_combo = 0
                    active_paddle_index = collision.get("active_paddle_index")
                    if active_paddle_index is not None:
                        new_state["scores"] = [
                            score + (1 if i != active_paddle_index else 0)
                            for i, score in enumerate(new_state["scores"])
                        ]
                    
                        self.reset_ball(ball, ball_index)
                        
                        if self.check_winner(new_state["scores"]):
                            game_over = True

        return new_state, game_over

    def check_ball_movement_relative_to_side(self, ball, side_index, ball_index, new_state): 
        """
        Movement tracking with clear case distinctions
        """
        # Get normal from class's side_normals
        normal = self.side_normals[side_index]
        start = self.vertices[side_index]
        
        # Calculate current state
        current_distance = float(
            (ball['x'] - start['x']) * normal['x'] + 
            (ball['y'] - start['y']) * normal['y']
        )
        
        current_dot_product = float(
            ball['velocity_x'] * normal['x'] + 
            ball['velocity_y'] * normal['y']
        )
        
        # Get previous state
        previous_movement = self.previous_movements[ball_index][side_index]
        previous_distance = float(previous_movement['distance'])
        previous_dot_product = float(previous_movement['dot_product'])
        was_approaching = previous_dot_product < 0
        
        # Case 1: Ball is parallel to side
        PARALLEL_THRESHOLD = float(1e-10) # can be global or const , in c it would stand in a h file
        if abs(current_dot_product) < PARALLEL_THRESHOLD:
            current_distance = self.check_paddle(current_distance, new_state, side_index, ball)# this should reduze the distance to side with the paddle width plus radius 
            self.update_ball_movement(ball_index, side_index, current_distance, current_dot_product)
            return {
                'is_approaching': True,
                'current_distance': float(current_distance),
                'approach_speed': float(0.0),
                'type': 'parallel'
            }
        
        # Case 2: Ball is moving towards side
        if current_dot_product < 0:
            current_distance = self.check_paddle(current_distance, new_state, side_index, ball)# this should reduze the distance to side with the paddle width plus radius  
            self.update_ball_movement(ball_index, side_index, current_distance, current_dot_product)
            return {
                'is_approaching': True,
                'current_distance': float(current_distance),
                'approach_speed': float(abs(current_dot_product)),
                'type': 'approaching'
            }
        
        # Case 3: Ball is moving away from side
        else:
            # Case 3a: Was already moving away
            if not was_approaching:
                self.update_ball_movement(ball_index, side_index, current_distance, current_dot_product)
                return {
                    'is_approaching': False,
                    'current_distance': float(current_distance),
                    'approach_speed': float(abs(current_dot_product)),
                    'type': 'moving_away'
                }
            
            # Case 3b: Was moving towards last frame
            else:
                # Check for tunneling using position and velocity signs
                position_sign_changed = (current_distance * previous_distance < 0)
                
                # Case 3ba: Tunneling detected
                if position_sign_changed:
                    # Don't update previous_movements for tunneling case
                    # This preserves the state before tunneling for proper bounce handling
                    return {
                        'is_approaching': True,  # Consider approaching for collision handling
                        'current_distance': float(min(current_distance, previous_distance)),
                        'approach_speed': float(abs(current_dot_product)),
                        'type': 'tunneling'
                    }
                
                # Case 3bb: Regular moving away (including post-bounce)
                else:
                    self.update_ball_movement(ball_index, side_index, current_distance, current_dot_product)
                    return {
                        'is_approaching': False,
                        'current_distance': float(current_distance),
                        'approach_speed': float(abs(current_dot_product)),
                        'type': 'moving_away'
                    }


    def get_ball_sector(self, ball, ball_index, new_state):
        """
        Check for collisions with list-based movement tracking.
        """
        
        collisions = []
        
        for side_index in range(self.num_sides) :
            movement = self.check_ball_movement_relative_to_side(ball, side_index, ball_index, new_state)           
            if movement['is_approaching']:
                if movement['type'] == 'tunneling':
                    # Tunneling detected - return immediately
                    return {
                        'side_index': side_index,
                        'movement' : movement,
                        'type': 'tunneling'
                    }
                else:
                    # Add collision candidate
                    collisions.append({
                        'side_index': side_index,
                        'movement' : movement,
                        'type': movement['type']
                    })
        if collisions:
            return min(collisions, key=lambda x: x['movement']['current_distance'])
        
        # No collisions found
        return None

     
    def apply_collision_resolution(self, ball, collision):
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





