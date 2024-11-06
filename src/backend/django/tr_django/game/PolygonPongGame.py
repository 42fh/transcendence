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
        self.vertices = None  # Will store calculated vertices
        self.side_lengths = None  # Will store lengths of each side
        self.active_sides = None  # Will store which sides have paddles
        self.game_mode = 'regular'  # Default mode
        self.sectors = None  # For optimized collision detection

    async def apply_game_settings(self):
        """Apply game-specific values from settings"""
        self.num_sides = self.settings['sides']
        self.num_paddles = self.settings['num_players']
        self.game_mode = self.settings.get('mode', 'star')  # Get mode from settings
        self.active_sides = self._get_player_side_indices()
        self.calculate_polygon_vertices()
        self._initialize_sectors()  # Initialize sectors after vertices are calculated
        
        await self.store_vertices(self.vertices)


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
            start_angle = -math.pi / 2  # Start from top
            
            for i in range(self.num_sides):
                angle = start_angle + (i * angle_step)
                vertices.append({
                    "x": base_radius * math.cos(angle),
                    "y": base_radius * math.sin(angle)
                })
                
        else:  # irregular modes
            # Get ratios and adjustments based on specific irregular mode
            ratios, angle_adjustments = self._calculate_side_ratios()
            
            start_angle = -math.pi / 2
            angle_step = (2 * math.pi) / self.num_sides
            
            for i in range(self.num_sides):
                angle = start_angle + (i * angle_step) + angle_adjustments[i]
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
        self._calculate_side_lengths()

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

    def _calculate_side_lengths(self):
        """Calculate length of each side"""
        self.side_lengths = []
        for i in range(self.num_sides):
            start = self.vertices[i]
            end = self.vertices[(i + 1) % self.num_sides]
            length = math.sqrt(
                (end["x"] - start["x"])**2 + 
                (end["y"] - start["y"])**2
            )
            self.side_lengths.append(length)
            print(f"Side {i}: Length = {length:.3f}" + 
                  (" (Player Side)" if i in self.active_sides else ""))

    def _initialize_sectors(self):
        """Initialize sector data for optimized collision detection"""
        self.sectors = []
        for i in range(self.num_sides):
            start = self.vertices[i]
            end = self.vertices[(i + 1) % self.num_sides]
            center = {"x": 0, "y": 0}  # Polygon center
            
            self.sectors.append({
                "index": i,
                "start": start,
                "end": end,
                "center": center,
                "is_player": i in self.active_sides,
                "length": self.side_lengths[i],
                # Cache normalized vectors for sector checks
                "to_start": self._normalize_vector(
                    start["x"] - center["x"],
                    start["y"] - center["y"]
                ),
                "to_end": self._normalize_vector(
                    end["x"] - center["x"],
                    end["y"] - center["y"]
                )
            })

    def _calculate_distance_to_side(self, point, side_index):
        """
        Calculate the distance from a point to a polygon side and related info.
        
        Args:
            point (dict): Point with x, y coordinates
            side_index (int): Index of the side to check
            
        Returns:
            dict: Distance info including distance, position along side,
                 projection point, and normal vector
        """
        if not self.vertices:
            raise ValueError("Vertices not initialized")
        
        start = self.vertices[side_index]
        end = self.vertices[(side_index + 1) % self.num_sides]
        
        # Vector from start to end of side
        side_vector_x = end["x"] - start["x"]
        side_vector_y = end["y"] - start["y"]
        
        # Vector from start to point
        point_vector_x = point["x"] - start["x"]
        point_vector_y = point["y"] - start["y"]
        
        # Calculate squared length of side
        side_length_sq = side_vector_x**2 + side_vector_y**2
        
        # Calculate normalized position along the side (t parameter)
        if side_length_sq < 1e-10:  # Protect against degenerate sides
            t = 0
        else:
            t = max(0, min(1, (point_vector_x * side_vector_x + point_vector_y * side_vector_y) / side_length_sq))
        
        # Calculate projection point
        projection_x = start["x"] + t * side_vector_x
        projection_y = start["y"] + t * side_vector_y
        
        # Calculate vector from projection to point
        to_point_x = point["x"] - projection_x
        to_point_y = point["y"] - projection_y
        
        # Calculate distance
        distance = math.sqrt(to_point_x**2 + to_point_y**2)
        
        # Calculate normal vector
        def get_normal(dx, dy, dist):
            if dist < 1e-10:
                # If distance is effectively zero, use perpendicular to side
                side_length = math.sqrt(side_length_sq)
                if side_length < 1e-10:
                    return {"x": 1, "y": 0}  # Arbitrary normal for degenerate side
                return {
                    "x": -side_vector_y / side_length,
                    "y": side_vector_x / side_length
                }
            return {
                "x": dx / dist,
                "y": dy / dist
            }
        
        normal = get_normal(to_point_x, to_point_y, distance)
        
        # Ensure normal points inward for collision handling
        # Use cross product to determine if we need to flip the normal
        cross_product = (side_vector_x * normal["y"] - side_vector_y * normal["x"])
        if cross_product < 0:
            normal["x"] = -normal["x"]
            normal["y"] = -normal["y"]
        
        return {
            "distance": float(distance),
            "position": float(t),
            "projection": {
                "x": float(projection_x),
                "y": float(projection_y)
            },
            "normal": normal
        }

    def _calculate_paddle_collision(self, side_index, collision_info, ball, paddles, dimensions):
        """
        Calculate paddle collision including edge hits and offset effects.
        
        Args:
            side_index (int): Index of the side to check
            collision_info (dict): Basic collision information from _calculate_distance_to_side
            ball (dict): Ball object with position and size
            paddles (list): List of all paddles
            dimensions (dict): Contains paddle dimensions (paddle_length, paddle_width)
            
        Returns:
            dict: Complete collision information including paddle-specific data
        """
        if not self.vertices or not self.side_lengths:
            raise ValueError("Vertices or side lengths not initialized")
        
        paddle = next((p for p in paddles if p["side_index"] == side_index), None)
        if not paddle or not paddle["active"]:
            return None
            
        start = self.vertices[side_index]
        end = self.vertices[(side_index + 1) % self.num_sides]
        side_length = self.side_lengths[side_index]
        
        # Calculate paddle dimensions using passed dimensions parameter
        paddle_length = side_length * dimensions["paddle_length"]
        paddle_width = dimensions["paddle_width"]
        half_paddle_length = paddle_length / 2
        
        # Calculate paddle center position
        paddle_center_t = paddle["position"]
        paddle_center_x = start["x"] + paddle_center_t * (end["x"] - start["x"])
        paddle_center_y = start["y"] + paddle_center_t * (end["y"] - start["y"])
        
        # Extend collision zone by ball size
        extended_width = paddle_width + ball["size"]
        
        # Calculate relative position along paddle
        relative_pos = collision_info["position"] - paddle_center_t
        normalized_offset = relative_pos * side_length / half_paddle_length
        
        # Check if within paddle bounds
        is_within_length = abs(relative_pos * side_length) <= half_paddle_length
        is_within_width = collision_info["distance"] <= extended_width
        
        # Get active paddle index for scoring
        active_paddle_index = self._get_active_paddle_index(side_index, paddles)
        
        if is_within_length and is_within_width:
            return {
                "type": "paddle",
                "side_index": side_index,
                "active_paddle_index": active_paddle_index,
                "normalized_offset": float(normalized_offset),
                "distance": float(collision_info["distance"]),
                "position": float(collision_info["position"]),
                "projection": collision_info["projection"],
                "normal": collision_info["normal"],
                "is_edge_hit": abs(normalized_offset) > 0.9
            }
        else:
            return {
                "type": "miss",
                "side_index": side_index,
                "active_paddle_index": active_paddle_index,
                "distance": float(collision_info["distance"]),
                "position": float(collision_info["position"]),
                "projection": collision_info["projection"],
                "normal": collision_info["normal"]
            }

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

    def _get_ball_sector(self, ball):
        """Determine which sector the ball is in using dot products"""
        if not self.sectors:
            self._initialize_sectors()
            
        ball_vector = self._normalize_vector(ball["x"], ball["y"])
        
        for sector in self.sectors:
            # Check if ball_vector is between sector boundaries using dot product
            dot1 = (ball_vector["x"] * sector["to_start"]["x"] + 
                   ball_vector["y"] * sector["to_start"]["y"])
            dot2 = (ball_vector["x"] * sector["to_end"]["x"] + 
                   ball_vector["y"] * sector["to_end"]["y"])
            
            # Cross product to determine if ball is on correct side
            cross = (sector["to_end"]["x"] * sector["to_start"]["y"] - 
                    sector["to_end"]["y"] * sector["to_start"]["x"])
            
            if cross > 0:
                if dot1 >= 0 and dot2 <= 0:
                    return sector["index"]
            else:
                if dot1 <= 0 and dot2 >= 0:
                    return sector["index"]
                    
        # Fallback - find closest side
        return self._find_closest_side(ball)

    def _find_closest_side(self, ball):
        """Fallback method to find closest side if sector check fails"""
        min_distance = float('inf')
        closest_side = 0
        
        for i in range(self.num_sides):
            distance = self._calculate_distance_to_side(ball, i)
            if distance["distance"] < min_distance:
                min_distance = distance["distance"]
                closest_side = i
                
        return closest_side

    async def game_logic(self, current_state):
        """Updated game logic using sector-based collision detection"""
        game_over = False
        new_state = current_state.copy()

        for ball in new_state["balls"]:
            # Move ball
            ball["x"] += ball["velocity_x"]
            ball["y"] += ball["velocity_y"]
            
            # Get current sector
            current_sector = self._get_ball_sector(ball)
            
            # Only check collision with current sector
            collision = self._check_sector_collision(
                ball, 
                current_sector, 
                new_state["paddles"],
                new_state["dimensions"]  # Pass dimensions to collision check
            )
            
            if collision:
                if collision["type"] in ["paddle", "wall"]:
                    self._apply_collision_resolution(ball, collision)
                    new_velocities = self.apply_ball_bounce_effect(
                        ball, 
                        collision["normal"],
                        collision.get("normalized_offset", 0)
                    )
                    ball.update(new_velocities)
                    
                    # Double-check no stuck condition
                    post_collision = self._check_sector_collision(
                        ball, 
                        self._get_ball_sector(ball), 
                        new_state["paddles"],
                        new_state["dimensions"]  # Pass dimensions here too
                    )
                    if post_collision and post_collision["distance"] < ball["size"]:
                        self._apply_collision_resolution(ball, post_collision)
                        
                elif collision["type"] == "miss":
                    # Handle scoring
                    active_paddle_index = collision.get("active_paddle_index")
                    if active_paddle_index is not None:
                        new_state["scores"] = self.update_scores(
                            new_state["scores"], 
                            active_paddle_index
                        )
                        self.reset_ball(ball)
                        
                        if self.check_winner(new_state["scores"]):
                            game_over = True

        return new_state, game_over

    def _check_sector_collision(self, ball, sector_index, paddles, dimensions):
        """
        Check collision only for the current sector
        
        Args:
            ball (dict): Ball object with position and size
            sector_index (int): Index of the sector to check
            paddles (list): List of all paddles
            dimensions (dict): Contains paddle dimensions
        """
        collision_info = self._calculate_distance_to_side(ball, sector_index)
        paddle = next((p for p in paddles if p["side_index"] == sector_index), None)
        
        if paddle and paddle["active"]:
            return self._calculate_paddle_collision(sector_index, collision_info, ball, paddles, dimensions)
        elif collision_info["distance"] <= ball["size"]:
            return {
                "type": "wall",
                "side_index": sector_index,
                **collision_info
            }
            
        return None

    def _apply_collision_resolution(self, ball, collision):
        """Resolve collision by adjusting ball position"""
        BUFFER = 0.001
        
        if collision["type"] in ["paddle", "wall"]:
            penetration = ball["size"] - collision["distance"]
            
            if penetration > 0:
                normal = collision["normal"]
                ball["x"] += normal["x"] * (penetration + BUFFER)
                ball["y"] += normal["y"] * (penetration + BUFFER)
