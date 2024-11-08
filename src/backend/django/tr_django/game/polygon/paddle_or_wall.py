
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
