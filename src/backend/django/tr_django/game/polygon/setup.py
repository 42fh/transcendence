
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
    
    #  
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

    #  
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

    def calculate_inner_boundaries(self):
        vertex_distances = [ 
            self.get_distance(v)
            for v in self.vertices
            ]
        self.inner_boundary = float(min(vertex_distances))        
