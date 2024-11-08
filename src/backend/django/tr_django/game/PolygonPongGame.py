from .AGameManager import AGameManager
import math
import random
import msgpack
import time



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
        self.game_mode = self.settings.get('mode', 'irregular')  # Get mode from settings
        self.active_sides = self._get_player_side_indices()
        self.initialize_ball_movements(self.settings.get('num_balls', 1))
        self.calculate_polygon_vertices()
        self.calculate_side_normals()
        await self.store_vertices(self.vertices)


    def initialize_ball_movements(self, num_balls):
        """Initialize the nested array structure for ball movement tracking"""
        self.previous_movements = [
        [
            {'distance': float(0.0), 'dot_product': float(0.0)}
            for _ in range(self.num_sides)
        ]
        for _ in range(num_balls)
        ]




    def update_ball_movement(self, ball_index, side_index, distance, dot_product):
        """Update movement data for a specific ball and side"""
        if ball_index >= len(self.previous_movements):
            # Expand array if needed (e.g., when new balls are added)
            additional_balls = ball_index - len(self.previous_movements) + 1
            self.previous_movements.extend([
                [
                    {'distance': float(0.0), 'dot_product': float(0.0)}
                    for _ in range(self.num_sides)
                ]
                for _ in range(additional_balls)
            ])
        
        self.previous_movements[ball_index][side_index] = {
            'distance': float(distance),
            'dot_product': float(dot_product)
        }

    def reset_ball_movement(self, ball_index):
        """Reset movement tracking for a specific ball"""
        if ball_index < len(self.previous_movements):
            self.previous_movements[ball_index] = [
                {'distance': float(0.0), 'dot_product': float(0.0)}
                for _ in range(self.num_sides)
            ]



    def get_game_type(self):
        return "polygon"


    def _get_player_side_indices(self):
        """
        Determine which sides should be player sides with improved distribution.
        For high player counts (> sides/2), first alternates players, then fills remaining clockwise.
        """
        if self.num_paddles > self.num_sides:
            raise ValueError("Number of paddles cannot exceed number of sides")
        
        player_sides = []
        
        if self.num_paddles == 2:
            # For 2 players, prefer opposite sides
            half_sides = self.num_sides // 2
            player_sides = [0, half_sides]  # Top and bottom when possible
            
        else:
            half_sides = self.num_sides // 2
            
            if self.num_paddles <= half_sides:
                # If players <= half sides, distribute evenly
                spacing = math.floor(self.num_sides / self.num_paddles)
                for i in range(self.num_paddles):
                    player_sides.append((i * spacing) % self.num_sides)
            else:
                # First place players on alternating sides
                for i in range(half_sides):
                    player_sides.append(i * 2)
                
                # Then fill remaining players clockwise in the gaps
                remaining_players = self.num_paddles - half_sides
                current_side = 1  # Start with the first gap
                
                while remaining_players > 0:
                    if current_side not in player_sides:
                        player_sides.append(current_side)
                        remaining_players -= 1
                    current_side = (current_side + 2) % self.num_sides
                    
                    # If we've gone all the way around, start filling sequential gaps
                    if current_side == 1 and remaining_players > 0:
                        current_side = 1
                        while remaining_players > 0:
                            if current_side not in player_sides:
                                player_sides.append(current_side)
                                remaining_players -= 1
                            current_side = (current_side + 1) % self.num_sides
        
        # Sort the sides for consistent ordering
        player_sides.sort()
        
        print(f"Sides: {self.num_sides}, Players: {self.num_paddles}, Distribution: {player_sides}")
        return player_sides

    def calculate_polygon_vertices(self):
        """Calculate vertices based on number of sides and player distribution"""
        if not self.active_sides:
            raise ValueError("Active sides must be determined before calculating vertices")

        vertices = []
        base_radius = 1.0
        
        if self.game_mode == 'regular':
            # Perfect regular polygon: all sides equal, evenly spaced
            angle_step = (2 * math.pi) / self.num_sides
            #start_angle = -math.pi / 2  # Start from top
            
            for i in range(self.num_sides):
                # angle = start_angle + (i * angle_step)
                angle = (i * angle_step)
                vertices.append({
                    "x": base_radius * math.cos(angle),
                    "y": base_radius * math.sin(angle)
                })
                
        else:  # irregular modes
            # Get ratios and adjustments based on specific irregular mode
            ratios, angle_adjustments = self._calculate_side_ratios()
            
            #start_angle = -math.pi / 2
            angle_step = (2 * math.pi) / self.num_sides
            
            for i in range(self.num_sides):
                # angle = start_angle + (i * angle_step) + angle_adjustments[i]
                angle = (i * angle_step) + angle_adjustments[i]
                radius = base_radius * ratios[i]
                vertices.append({
                    "x": radius * math.cos(angle),
                    "y": radius * math.sin(angle)
                })
        
        # Normalize to [-1, 1] space
        max_coord = max(max(abs(v["x"]) for v in vertices),
                       max(abs(v["y"]) for v in vertices))
        
        scale = 1.0 / max_coord
        for vertex in vertices:
            vertex["x"] *= scale
            vertex["y"] *= scale
            
        self.vertices = vertices

    def _calculate_base_deformation(self):
        """Calculate deformation based on game mode"""
        player_density = self.num_paddles / self.num_sides
        
        if self.game_mode == 'irregular':
            # Original balanced ratios
            if self.num_sides == 4:
                return 4/3 if self.num_paddles == 2 else 1.0
            else:
                if player_density <= 0.5:
                    return 1.0 + (player_density * 0.5)
                else:
                    return 1.25 - (player_density * 0.25)
                    
        elif self.game_mode == 'crazy':
            # Extreme deformation
            if self.num_sides == 4:
                return 4/3 if self.num_paddles == 2 else 1.0
            else:
                return 1.8 if player_density <= 0.5 else 1.5
                
        elif self.game_mode == 'star':
            # Alternating long and short sides
            return 2.2 if player_density <= 0.3 else 1.8
            
        return 1.0  # Default if mode not recognized

    def _calculate_side_ratios(self):
        """Calculate ratios based on game mode"""
        base_deform = self._calculate_base_deformation()
        
        if self.game_mode == 'irregular':
            return self._calculate_regular_ratios(base_deform)  # This is now our irregular mode
        elif self.game_mode == 'crazy':
            return self._calculate_crazy_ratios(base_deform)
        elif self.game_mode == 'star':
            return self._calculate_star_ratios(base_deform)
        else:
            return self._calculate_regular_ratios(base_deform)  # Default

    def _calculate_regular_ratios(self, base_deform):
        """Original balanced ratio calculation"""
        ratios = [1.0] * self.num_sides
        angle_adjustments = [0] * self.num_sides

        if self.num_sides == 4:
            if self.num_paddles == 2:
                # Special handling for rectangle
                if 0 in self.active_sides and 2 in self.active_sides:
                    ratios[0] = ratios[2] = base_deform
                    ratios[1] = ratios[3] = 1.0
                elif 1 in self.active_sides and 3 in self.active_sides:
                    ratios[0] = ratios[2] = 1.0
                    ratios[1] = ratios[3] = base_deform
            else:
                # More square-like for more players
                for i in self.active_sides:
                    ratios[i] = base_deform
        else:
            # General polygon case
            for side in self.active_sides:
                ratios[side] = base_deform
                prev_side = (side - 1) % self.num_sides
                next_side = (side + 1) % self.num_sides
                ratios[prev_side] = 1.0 + (base_deform - 1.0) * 0.5
                ratios[next_side] = 1.0 + (base_deform - 1.0) * 0.5

            # Smooth out the ratios
            smoothed_ratios = ratios.copy()
            for i in range(self.num_sides):
                prev_ratio = ratios[(i - 1) % self.num_sides]
                next_ratio = ratios[(i + 1) % self.num_sides]
                smoothed_ratios[i] = (prev_ratio + 2 * ratios[i] + next_ratio) / 4
            ratios = smoothed_ratios

        return ratios, angle_adjustments

    def _calculate_crazy_ratios(self, base_deform):
        """Extreme ratio calculation with sharp transitions"""
        ratios = [0.6] * self.num_sides  # Compressed non-player sides
        angle_adjustments = [0] * self.num_sides
        
        # Set player sides
        for side in self.active_sides:
            ratios[side] = base_deform
            if (side + 1) % self.num_sides not in self.active_sides:
                angle_adjustments[side] = random.uniform(-0.26, 0.26)
        
        return ratios, angle_adjustments

    def _calculate_star_ratios(self, base_deform):
        """Star-like shape with alternating long and short sides"""
        ratios = [0.4 if i % 2 == 0 else 1.2 for i in range(self.num_sides)]
        angle_adjustments = [0] * self.num_sides
        
        # Ensure player sides are equal
        for side in self.active_sides:
            ratios[side] = base_deform
            
        return ratios, angle_adjustments

    # 
    def calculate_side_normals(self):
        """
        Calculate normal vectors for each side of the polygon.
        Normal vectors point inward.
        All values are stored as floats.
        Uses epsilon for float comparisons.
        """
        if not self.vertices:
            raise ValueError("Vertices must be calculated before normals")

        EPSILON = 1e-10  # Small value for float comparisons
        self.side_normals = []
        
        for i in range(self.num_sides):
            # Get current side vertices
            start = self.vertices[i]
            end = self.vertices[(i + 1) % self.num_sides]
            
            # Calculate side vector (explicitly convert to float)
            side_vector_x = float(end["x"] - start["x"])
            side_vector_y = float(end["y"] - start["y"])
            
            # Calculate normal (perpendicular) vector
            # For a vector (x,y), the perpendicular vector is (-y,x) or (y,-x)
            normal_x = float(-side_vector_y)
            normal_y = float(side_vector_x)
            
            # Normalize the normal vector
            length = float(math.sqrt(normal_x * normal_x + normal_y * normal_y))
            if length > EPSILON:  # Compare with epsilon instead of 0
                normal_x = float(normal_x / length)
                normal_y = float(normal_y / length)
            else:
                # Handle degenerate case (zero-length side)
                normal_x = float(1.0)  # Default to unit vector pointing right
                normal_y = float(0.0)
                print(f"Warning: Near-zero length side detected at index {i}")
            
            # Check if normal points inward
            # Take the midpoint of the side
            mid_x = float((start["x"] + end["x"]) / 2)
            mid_y = float((start["y"] + end["y"]) / 2)
            
            # Vector from midpoint to center (0,0)
            to_center_x = float(-mid_x)
            to_center_y = float(-mid_y)
            
            # Dot product with normal
            dot_product = float(normal_x * to_center_x + normal_y * to_center_y)
            
            # If dot product is negative or very close to zero, normal points outward, so flip it
            if dot_product < EPSILON:  # Also using epsilon here for consistency
                normal_x = float(-normal_x)
                normal_y = float(-normal_y)
                dot_product = float(-dot_product)  # Update dot product after flip
            
            self.side_normals.append({
                "x": float(normal_x),
                "y": float(normal_y),
                "side_index": int(i),
                "is_player": bool(i in self.active_sides),
                "dot_product": float(dot_product)
            })
            
            # Debug print with explicit float formatting
            print(f"Side {i} normal: ({normal_x:.6f}, {normal_y:.6f})" +
                  (" (Player Side)" if i in self.active_sides else "") +
                  f" length: {length:.6f}, dot: {dot_product:.6f}")




    def _get_active_paddle_index(self, side_index, paddles):
        """Convert side_index to active paddle index"""
        active_count = 0
        for paddle in paddles:
            if paddle["active"]:
                if paddle["side_index"] == side_index:
                    return active_count
                active_count += 1
        return None



    def _normalize_vector(self, x, y):
        """Normalize a 2D vector"""
        length = math.sqrt(x * x + y * y)
        if length < 1e-10:
            return {"x": 0, "y": 0}
        return {"x": x / length, "y": y / length}

    def handle_tunneling(self, ball, current_sector, new_state):
        """
        Handle case where ball has tunneled through a side.
        
        Args:
            ball (dict): Current ball state
            current_sector (dict): Information about the current sector and collision
            new_state (dict): Current game state
            
        Returns:
            dict: Collision information or None if no valid collision
        """
        side_index = current_sector['side_index']
        
        # Calculate basic collision info using previous frame's position
        collision_info = {
            "distance": current_sector['movement']['current_distance'],
            "normal": self.side_normals[side_index],
            "projection": self._calculate_projection(ball, side_index)
        }
        
        if side_index in self.active_sides:
            # Check for paddle collision
            paddle_collision = self._calculate_paddle_collision(
                side_index,
                collision_info,
                ball,
                new_state["paddles"],
                new_state["dimensions"]
            )
            
            if paddle_collision and paddle_collision["type"] == "paddle":
                # Reset ball position to paddle surface
                self.apply_collision_resolution(ball, paddle_collision)
                return paddle_collision
            else:
                # Reset ball position to wall and return miss
                self.apply_collision_resolution(ball, {
                    "type": "miss",
                    "side_index": side_index,
                    **collision_info
                })
                return {
                    "type": "miss",
                    "side_index": side_index,
                    "active_paddle_index": self._get_active_paddle_index(side_index, new_state["paddles"]),
                    **collision_info
                }
        else:
            # Reset ball position to wall
            self.apply_collision_resolution(ball, {
                "type": "wall",
                "side_index": side_index,
                **collision_info
            })
            return {
                "type": "wall",
                "side_index": side_index,
                **collision_info
            }

    def handle_parallel(self, ball, current_sector, new_state):
        """
        Handle case where ball is moving parallel to a side.
        
        Args:
            ball (dict): Current ball state
            current_sector (dict): Information about the current sector and collision
            new_state (dict): Current game state
            
        Returns:
            dict: Collision information or None if no valid collision
        """
        side_index = current_sector['side_index']
        movement = current_sector['movement']
        
        # If ball is far from side, no collision needed
        if movement['current_distance'] > ball["size"]:
            return None
            
        collision_info = {
            "distance": movement['current_distance'],
            "normal": self.side_normals[side_index],
            "projection": self._calculate_projection(ball, side_index)
        }
        
        if side_index in self.active_sides:
            # Check for paddle collision
            paddle_collision = self._calculate_paddle_collision(
                side_index,
                collision_info,
                ball,
                new_state["paddles"],
                new_state["dimensions"]
            )
            
            if paddle_collision and paddle_collision["type"] == "paddle":
                self.apply_collision_resolution(ball, paddle_collision)
                return paddle_collision
            else:
                self.apply_collision_resolution(ball, {
                    "type": "miss",
                    "side_index": side_index,
                    **collision_info
                })
                return {
                    "type": "miss",
                    "side_index": side_index,
                    "active_paddle_index": self._get_active_paddle_index(side_index, new_state["paddles"]),
                    **collision_info
                }
        else:
            # Handle as wall collision
            self.apply_collision_resolution(ball, {
                "type": "wall",
                "side_index": side_index,
                **collision_info
            })
            return {
                "type": "wall",
                "side_index": side_index,
                **collision_info
            }

    def handle_paddle(self, ball, current_sector, new_state):
        """
        Handle potential paddle collision.
        
        Args:
            ball (dict): Current ball state
            current_sector (dict): Information about the current sector and collision
            new_state (dict): Current game state
            
        Returns:
            dict: Paddle collision information or None if no collision
        """
        side_index = current_sector['side_index']
        movement = current_sector['movement']
        
        collision_info = {
            "distance": movement['current_distance'],
            "normal": self.side_normals[side_index],
            "projection": self._calculate_projection(ball, side_index),
        }
        
        paddle_collision = self._calculate_paddle_collision(
            side_index,
            collision_info,
            ball,
            new_state["paddles"],
            new_state["dimensions"]
        )
        
        if paddle_collision and paddle_collision["type"] == "paddle":
            self.apply_collision_resolution(ball, paddle_collision)
            return paddle_collision
            
        return None

    def handle_wall(self, ball, current_sector, new_state):
        """
        Handle wall collision.
        
        Args:
            ball (dict): Current ball state
            current_sector (dict): Information about the current sector and collision
            new_state (dict): Current game state
            
        Returns:
            dict: Wall collision information or None if no collision
        """
        side_index = current_sector['side_index']
        movement = current_sector['movement']
        
        # Only process if ball is close enough to wall
        if movement['current_distance'] > ball["size"]:
            return None
            
        collision_info = {
            "distance": movement['current_distance'],
            "normal": self.side_normals[side_index],
            "projection": self._calculate_projection(ball, side_index),
        }
        
        wall_collision = {
            "type": "wall",
            "side_index": side_index,
            **collision_info
        }
        
        self.apply_collision_resolution(ball, wall_collision)
        return wall_collision

    def _calculate_relative_position(self, ball, side_index):
        """
        Calculate relative position of ball along a side.
        
        Args:
            ball (dict): Ball object with position
            side_index (int): Index of the side
            
        Returns:
            float: Relative position along the side (0 to 1)
        """
        start = self.vertices[side_index]
        end = self.vertices[(side_index + 1) % self.num_sides]
        
        # Vector from start to end of side
        side_vector_x = end["x"] - start["x"]
        side_vector_y = end["y"] - start["y"]
        
        # Vector from start to ball
        ball_vector_x = ball["x"] - start["x"]
        ball_vector_y = ball["y"] - start["y"]
        
        # Calculate dot product and side length
        dot_product = side_vector_x * ball_vector_x + side_vector_y * ball_vector_y
        side_length_squared = side_vector_x * side_vector_x + side_vector_y * side_vector_y
        
        # Return relative position clamped between 0 and 1
        return max(0.0, min(1.0, dot_product / side_length_squared))




    def _find_nearest_collision(self, ball, paddles, vertices, current_sector, current_state):
        """Find nearest collision but only check current sector"""
        if not current_sector:  # No approaching sides
            return None
            
        # Get collision info for this sector
        side_index = current_sector['side_index']
        movement = current_sector['movement']
            
        # Get basic collision info
        collision_info = {
            "distance": movement['current_distance'],
            "normal": self.side_normals[side_index],
            "projection": self._calculate_projection(ball, side_index)  # You'll need this helper method
        }
        
        # If it has an active paddle, check for paddle collision
        if side_index in self.active_sides:
            paddle_collision = self._calculate_paddle_collision(
                side_index,
                collision_info,
                ball,
                paddles,
                current_state["dimensions"]
            )
            return paddle_collision if paddle_collision else None
            
        # Otherwise, if close enough for wall collision
        elif movement['current_distance'] <= ball['size']:
            return {
                "type": "wall",
                "side_index": side_index,
                **collision_info
            }
            
        return None
    def _calculate_projection(self, ball, side_index):
        """
        Calculate the closest point (projection) of the ball onto a side of the polygon.
        
        Args:
            ball (dict): Ball object with position
            side_index (int): Index of the side to project onto
            
        Returns:
            dict: Projected point coordinates {x, y}
        """
        # Get vertices of the side
        start = self.vertices[side_index]
        end = self.vertices[(side_index + 1) % self.num_sides]
        
        # Calculate vector from start to end of side
        side_vector_x = end["x"] - start["x"]
        side_vector_y = end["y"] - start["y"]
        
        # Calculate vector from start to ball
        ball_vector_x = ball["x"] - start["x"]
        ball_vector_y = ball["y"] - start["y"]
        
        # Calculate squared length of side
        side_length_squared = side_vector_x * side_vector_x + side_vector_y * side_vector_y
        
        if side_length_squared == 0:
            return {"x": start["x"], "y": start["y"]}
        
        # Calculate dot product
        dot_product = (ball_vector_x * side_vector_x + ball_vector_y * side_vector_y)
        
        # Calculate relative position along side (clamped between 0 and 1)
        t = max(0, min(1, dot_product / side_length_squared))
        
        # Calculate projection point
        projection_x = start["x"] + t * side_vector_x
        projection_y = start["y"] + t * side_vector_y
        
        return {
            "x": float(projection_x),
            "y": float(projection_y)
        }


    def reset_ball(self, ball, ball_index, speed=0.006):
        """
        Extends parent reset_ball method by also resetting movement tracking.
        
        Args:
            ball (dict): Ball object to reset
            speed (float): Initial ball speed
        Returns:
            dict: Updated ball object
        """
        # Call parent method first
        ball = super().reset_ball(ball, speed)
        
        # Add our polygon-specific reset
        self.reset_movement_tracking()
        
        return ball

    def update_movement(self, side_index, current_distance, current_dot_product):
        """Update the movement data for a given side index."""
        self.previous_movements[side_index] = {
            'distance': float(current_distance),
            'dot_product': float(current_dot_product)
        }


    def check_paddle(self, current_distance, new_state, side_index, ball):
        """Helper function to check paddle collision and adjust distance"""
        if side_index not in self.active_sides:
            return current_distance
            
        # Calculate paddle width plus ball size for collision zone
        total_width = new_state['dimensions']['paddle_width'] + ball['size']
        return current_distance - total_width


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

    def _calculate_paddle_collision(self, side_index, collision_info, ball, paddles, dimensions):
        """
        Calculate if ball is colliding with a paddle on the given side.
        
        Args:
            side_index (int): Index of the side to check
            collision_info (dict): Basic collision information including distance and projection
            ball (dict): Ball object with position and size
            paddles (list): List of paddle objects
            dimensions (dict): Game dimensions including paddle sizes
            
        Returns:
            dict: Collision information if paddle hit, None if no collision
        """
        # Find the paddle for this side
        paddle = None
        for p in paddles:
            if p["side_index"] == side_index and p["active"]:
                paddle = p
                break
                
        if not paddle:
            return None
            
        # Calculate relative position along the side (0 to 1)
        relative_position = self._calculate_relative_position(ball, side_index)
        
        # Calculate paddle position and width in relative coordinates
        paddle_width = dimensions["paddle_width"]
        paddle_half_width = paddle_width / 2.0
        paddle_pos = paddle["position"]
        
        # Calculate distances from paddle center
        distance_from_center = abs(relative_position - paddle_pos)
        
        # Check if ball is within paddle width plus ball size
        if distance_from_center <= (paddle_half_width + ball["size"]):
            # Calculate normalized offset from paddle center (-1 to 1)
            normalized_offset = (relative_position - paddle_pos) / paddle_half_width
            normalized_offset = max(-1.0, min(1.0, normalized_offset))
            
            # Calculate if this is an edge hit
            is_edge_hit = abs(abs(normalized_offset) - 1.0) < 0.1
            
            # Calculate actual position of collision point
            start = self.vertices[side_index]
            end = self.vertices[(side_index + 1) % self.num_sides]
            
            # Interpolate position along the side
            collision_x = start["x"] + (end["x"] - start["x"]) * relative_position
            collision_y = start["y"] + (end["y"] - start["y"]) * relative_position
            
            return {
                "type": "paddle",
                "side_index": side_index,
                "distance": collision_info["distance"],
                "normal": collision_info["normal"],
                "projection": collision_info["projection"],
                "position": {"x": collision_x, "y": collision_y},  # Add calculated position
                "normalized_offset": normalized_offset,
                "is_edge_hit": is_edge_hit,
                "paddle_index": paddle.get("paddle_index", 0)
            }
            
        return None

    def _calculate_relative_position(self, ball, side_index):
        """
        Calculate relative position of ball along a side (0 to 1).
        
        Args:
            ball (dict): Ball object with position
            side_index (int): Index of the side
            
        Returns:
            float: Relative position along the side (0 = start, 1 = end)
        """
        start = self.vertices[side_index]
        end = self.vertices[(side_index + 1) % self.num_sides]
        
        # Vector from start to end of side
        side_vector_x = end["x"] - start["x"]
        side_vector_y = end["y"] - start["y"]
        
        # Vector from start to ball
        ball_vector_x = ball["x"] - start["x"]
        ball_vector_y = ball["y"] - start["y"]
        
        # Calculate dot product and side length
        dot_product = side_vector_x * ball_vector_x + side_vector_y * ball_vector_y
        side_length_squared = side_vector_x * side_vector_x + side_vector_y * side_vector_y
        
        if side_length_squared == 0:
            return 0.0
            
        # Return relative position clamped between 0 and 1
        t = dot_product / side_length_squared
        return max(0.0, min(1.0, t))


""" 


    def handle_tunneling(self, ball, current_sector, new_state):
        if current['side_index'] in self.active_sides:
            # check if paddle is at position 
            # if True
            #   reste ball to padle
            #   give back paddle type
            # else
            #   give back miss
        else
            #reset ball to wall 
            #  give back wall type


    def handle_parallel(self, ball, current_sector, new_state):
        if current['side_index'] in self.active_sides:
        #    check if paddle hit
        #    if True
        #       reset ball to paddle
        #       return paddle
        #   else       
        #       reset Ball to Wall
        #       return(missed)


    def handle_paddle()
        # check if paddle hit 
        # return collion
        # else return None
    
    def handle_wall()
        # chech if wall hit 
        # return collision wall


    async def game_logic(self, current_state):
        game_over = False
        new_state = current_state.copy()

        # Process each ball
        for ball_index, ball in new_state["balls"]:
            # Move ball
            ball["x"] += ball["velocity_x"]
            ball["y"] += ball["velocity_y"]

            # Get current sector for optimization
            current_sector = self._get_ball_sector(ball, ball_index, new_state)
            if not current_sector:
                continue
            if current_sector['type'] == 'tunneling':
                collison = self.handle_tunneling() #  implemation nedded 
            elif current_sector['movement']['distance'] <=  :# ? -> should a number befor we do not check. 
                    if current_sector['type'] == 'parallel':
                        collison = self.handle_parallel() # implemanbtion needed
                    elif current_sector['side_index'] in self.active_sides:
                        colliosn = self.handle_paddle() # implemantion needed
                    else :
                       collison = self.handle_wall() 
            else:   
                continue 


            if collision:
                if collision["type"] in ["paddle", "wall"]:
                    self.apply_collision_resolution(ball, collision)
                    new_velocities = self.apply_ball_bounce_effect(
                        ball, 
                        collision["normal"],
                        collision.get("normalized_offset", 0)
                    )
                    ball.update(new_velocities)

                    # Double-check no stuck condition
                    post_sector = self._get_ball_sector(ball)
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


    async def game_logic(self, current_state):
    """"""" 
    Main game logic loop processing ball movement and collisions.
    
    Args:
        current_state (dict): Current game state
        
    Returns:
        tuple: (new_state, game_over)
    """"""
    game_over = False
    new_state = current_state.copy()

    # Process each ball
    for ball_index, ball in enumerate(new_state["balls"]):
        # Move ball
        ball["x"] += ball["velocity_x"]
        ball["y"] += ball["velocity_y"]

        # Get current sector for optimization
        current_sector = self._get_ball_sector(ball, ball_index, new_state)
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
            if collision["type"] in ["paddle", "wall"]:
                # Apply bounce effect
                new_velocities = self.apply_ball_bounce_effect(
                    ball, 
                    collision["normal"],
                    collision.get("normalized_offset", 0)
                )
                ball.update(new_velocities)

                # Double-check no stuck condition
                post_sector = self._get_ball_sector(ball, ball_index, new_state)
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
                active_paddle_index = collision.get("active_paddle_index")
                if active_paddle_index is not None:
                    # Update scores only for active paddles
                    new_state["scores"] = [
                        score + (1 if i != active_paddle_index else 0)
                        for i, score in enumerate(new_state["scores"])
                    ]
                
                    # Reset this ball
                    self.reset_ball(ball, ball_index)
                    
                    # Check win condition
                    if self.check_winner(new_state["scores"]):
                        game_over = True

    return new_state, game_over



"""


