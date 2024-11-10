

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


    def get_inner_boundary(self, state, ball):
        if self._inner_boundary is None:
            self.calculate_inner_boundaries()
        return max(0, self.inner_boundary - state['dimensions']['paddle_width'] - ball['size'])


    def reset_ball(self, ball, speed=0.006):
        """
        Reset ball to center with random direction
        Args:
            ball (dict): Ball object to reset
            speed (float): Initial ball speed
        Returns:
            dict: Updated ball object
        """
        angle = random.uniform(0, 2 * math.pi)
        ball.update({
            "x": float(0),
            "y": float(0),
            "velocity_x": float(speed * math.cos(angle)),
            "velocity_y": float(speed * math.sin(angle))
        })
        return ball

    def apply_ball_bounce_effect(self, ball, normal, offset=0, speed_multiplier=1.08):
        """
        Apply enhanced bounce effect with no speed limit for maximum chaos
        Args:
            ball (dict): Ball object
            normal (dict): Normal vector of collision
            offset (float): Normalized offset from center (-1 to 1)
            speed_multiplier (float): Speed increase factor (increased from default)
        Returns:
            dict: Updated ball velocities
        """
        # Calculate base reflection
        dot_product = (ball["velocity_x"] * normal["x"] + 
                      ball["velocity_y"] * normal["y"])
        
        reflected_x = ball["velocity_x"] - 2 * dot_product * normal["x"]
        reflected_y = ball["velocity_y"] - 2 * dot_product * normal["y"]
        
        # Calculate current speed
        current_speed = math.sqrt(ball["velocity_x"]**2 + ball["velocity_y"]**2)
        
        # Enhanced angle modification based on hit location
        # More extreme angle changes near the edges
        edge_factor = abs(offset) ** 0.5  # More aggressive non-linear scaling
        angle_mod = offset * math.pi * 0.4 * (1 + edge_factor)
        
        # Add speed-based randomness - more chaos at higher speeds
        speed_randomness = min(0.2, current_speed * 0.01)  # Caps random effect
        random_angle = random.uniform(-speed_randomness, speed_randomness) * (1 - abs(offset))
        angle_mod += random_angle
        
        # Apply rotation
        cos_mod = math.cos(angle_mod)
        sin_mod = math.sin(angle_mod)
        
        final_x = reflected_x * cos_mod - reflected_y * sin_mod
        final_y = reflected_x * sin_mod + reflected_y * cos_mod
        
        # Dynamic speed modification with combo system
        edge_boost = 1.0 + (abs(offset) * 0.2)  # Edges now give speed boost
        combo_multiplier = 1.0 + (self.hit_combo * 0.08)  # Stronger combo effect
        
        # Speed boost based on current velocity
        velocity_boost = 1.0 + (math.log(current_speed + 1) * 0.1)
        
        # Calculate new speed with all modifiers
        new_speed = (current_speed * 
                     speed_multiplier * 
                     edge_boost * 
                     combo_multiplier * 
                     velocity_boost)
        
        # Add a minimum speed to prevent very slow balls
        MIN_SPEED = 0.004
        if new_speed < MIN_SPEED:
            new_speed = MIN_SPEED
        
        # Normalize and apply final speed
        speed_scale = new_speed / math.sqrt(final_x**2 + final_y**2)
        final_x *= speed_scale
        final_y *= speed_scale
        
        # Add increasing curve effect based on speed
        curve_intensity = min(0.001, current_speed * 0.0001)
        curve_factor = offset * curve_intensity
        final_x += curve_factor * normal["y"]
        final_y -= curve_factor * normal["x"]
        
        return {
            "velocity_x": float(final_x),
            "velocity_y": float(final_y)
        }



    def initialize_combo_system(self):
        """Initialize enhanced combo tracking system"""
        self.hit_combo = 0
        self.last_hit_time = 0
        self.combo_timeout = 1.5  # Longer combo window for more speed potential
        self.max_combo_hits = float('inf')  # No combo limit!

    def update_hit_combo(self, current_time, ball):
            pass
        # Could trigger special effects or announcements here

