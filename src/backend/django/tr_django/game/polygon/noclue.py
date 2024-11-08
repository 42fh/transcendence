
    def check_paddle(self, current_distance, new_state, side_index, ball):
        """Helper function to check paddle collision and adjust distance"""
        if side_index not in self.active_sides:
            return current_distance
            
        # Calculate paddle width plus ball size for collision zone
        total_width = new_state['dimensions']['paddle_width'] + ball['size']
        return current_distance - total_width

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

