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
        if not current_sector:
            # Get crossed side using sign change detection
            side_index, intersection = self._get_nearest_side_index(ball)
            if side_index is None:
                return None # log , reset ball etc !!!!!   
                
            collision_info = {
                "distance": 0,
                "normal": self.side_normals[side_index],
                "projection": intersection
            }
            
            ball["x"], ball["y"] = intersection["x"], intersection["y"]
            if side_index in self.active_sides:
                
                paddle_collision = self._calculate_paddle_collision(
                    side_index,
                    collision_info,
                    ball,
                    state["paddles"],
                    state["dimensions"]
                )
                
                
                if paddle_collision and paddle_collision["type"] == "paddle":
                    normal = self.side_normals[side_index]
                    paddle_width = state["dimensions"]["paddle_width"]
                    # Move ball out by paddle width plus ball size
                    ball["x"] += normal["x"] * (paddle_width + ball["size"])
                    ball["y"] += normal["y"] * (paddle_width + ball["size"])
                    
                    return paddle_collision
                else:
                    return {
                        "type": "miss",
                        "side_index": side_index,
                        "active_paddle_index": self._get_active_paddle_index(side_index, state["paddles"]),
                        **collision_info
                    }
            else:
                return {
                    "type": "wall",
                    "side_index": side_index,
                    **collision_info
                }
        
        side_index = current_sector['side_index']
        
        # Calculate basic collision info using previous frame's position
        collision_info = {
            "distance:": current_sector['movement']['current_distance'],
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

    def _get_nearest_side_index(self, ball):
        """
        Find the side index that the ball passed through by checking sign changes
        in the distance when moving backwards along velocity vector.
        
        Args:
            ball (dict): Ball object with x,y position and velocity
            
        Returns:
            tuple: (side_index, intersection_point) or (None, None) if no intersection
        """
        # Create a test point sufficiently far back along velocity vector
        # distance = speed * time, use a large enough time to ensure we cross the polygon
        speed = math.sqrt(ball["velocity_x"]**2 + ball["velocity_y"]**2)
        if speed < 1e-10:  # Check for stationary ball
            return None, None
            
        # Use 2x the polygon size to ensure we cross it
        time_back = 2.0 / speed
        
        test_point = {
            "x": ball["x"] - ball["velocity_x"] * time_back,
            "y": ball["y"] - ball["velocity_y"] * time_back,
            "size": ball["size"]
        }
        
        # For each side, check if the line from test_point to ball crosses it
        crossings = []
        for side_index in range(self.num_sides):
            # Calculate distances from both points to the side
            normal = self.side_normals[side_index]
            start = self.vertices[side_index]
            
            # Distance from current ball position to side
            current_dist = ((ball["x"] - start["x"]) * normal["x"] + 
                           (ball["y"] - start["y"]) * normal["y"])
                           
            # Distance from test point to side
            test_dist = ((test_point["x"] - start["x"]) * normal["x"] + 
                        (test_point["y"] - start["y"]) * normal["y"])
            
            # If signs are different, we crossed this side
            if current_dist * test_dist <= 0:  # Less than or equal includes touching the side
                # Calculate relative position along the side
                relative_pos = self._calculate_relative_position(ball, side_index)
                
                # Only count if intersection is within the side segment
                if 0 <= relative_pos <= 1:
                    # Calculate intersection point
                    # Use linear interpolation between test point and ball position
                    t = current_dist / (current_dist - test_dist)  # interpolation factor
                    intersection = {
                        "x": ball["x"] + t * (test_point["x"] - ball["x"]),
                        "y": ball["y"] + t * (test_point["y"] - ball["y"])
                    }
                    
                    crossings.append({
                        'side_index': side_index,
                        'distance': abs(current_dist),
                        'intersection': intersection
                    })
        
        # If we found crossings, return the nearest one
        if crossings:
            closest = min(crossings, key=lambda x: x['distance'])
            return closest['side_index'], closest['intersection']
            
        return None, None
