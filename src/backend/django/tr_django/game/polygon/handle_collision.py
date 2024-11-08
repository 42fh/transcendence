

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

    def _get_active_paddle_index(self, side_index, paddles):
        """Convert side_index to active paddle index"""
        active_count = 0
        for paddle in paddles:
            if paddle["active"]:
                if paddle["side_index"] == side_index:
                    return active_count
                active_count += 1
        return None


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

