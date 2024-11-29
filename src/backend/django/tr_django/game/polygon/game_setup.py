
from typing import List, Dict, Optional, Any 
import math


@classmethod
def calculate_inner(cls, settings: Dict[str, Any]) -> dict:
    """Calculate inner boundary using true perpendicular distances for any polygon"""
    
    vertices = settings.get("vertices")  
    num_sides =  settings.get("sides") 
    side_normals = settings.get("normals")
    if not vertices or not side_normals:
        raise ValueError("Vertices and normals must be calculated before inner boundary")

    # Calculate perpendicular distances from center to each side
    min_distance = float('inf')
    
    for i in range(num_sides):
        # Get start vertex of the side and its normal
        vertex = vertices[i]
        normal = side_normals[i]
        
        # Calculate perpendicular distance using the dot product
        # Distance = dot product of any point on the line (vertex) with the normal
        distance = abs(vertex["x"] * normal["x"] + vertex["y"] * normal["y"])
        
        print(f"Side {i} perpendicular distance: {distance}")
        min_distance = min(min_distance, distance)
    
    inner_boundary = float(min_distance)
    print(f"Final inner boundary: {inner_boundary}")
    
    return {"inner_boundary": inner_boundary}



@classmethod
def calculate_sides_normals(cls, settings: Dict[str, Any]) -> dict:
    """
    Calculate normal vectors for each side of the polygon.
    Normal vectors point inward.
    All values are stored as floats.
    Uses epsilon for float comparisons.
    """
    vertices = settings.get("vertices")  
    num_sides =  settings.get("sides") 
    player_sides =  settings.get("players_sides") 

    if not vertices:
        raise ValueError("Vertices must be calculated before normals")

    EPSILON = 1e-10  # Small value for float comparisons
    side_normals = []

    for i in range(num_sides):
        # Get current side vertices
        start = vertices[i]
        end = vertices[(i + 1) % num_sides]

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

        side_normals.append(
            {
                "x": float(normal_x),
                "y": float(normal_y),
                "side_index": int(i),
                "is_player": bool(i in player_sides),
                "dot_product": float(dot_product),
            }
        )

        # Debug print with explicit float formatting
        print(
            f"Side {i} normal: ({normal_x:.6f}, {normal_y:.6f})"
            + (" (Player Side)" if i in player_sides else "")
            + f" length: {length:.6f}, dot: {dot_product:.6f}"
        )
    return {"normals": side_normals}

#
@classmethod
def calculate_vertices(cls, settings: Dict[str, Any]) -> dict:
    """Calculate vertices based on number of sides and player distribution"""

    active_sides = settings.get("players_sides")
    game_mode = settings.get("mode")
    num_sides = settings.get("sides")
    
    if not active_sides:
        raise ValueError("Active sides must be determined before calculating vertices")

    vertices = []
    base_radius = 1.0

    if game_mode == "regular":
        # Perfect regular polygon: all sides equal, evenly spaced
        angle_step = (2 * math.pi) / num_sides

        for i in range(num_sides):
            angle = i * angle_step
            vertices.append(
                {"x": base_radius * math.cos(angle), "y": base_radius * math.sin(angle)}
            )
    elif game_mode == "classic":
        width = 1.0 
        height = width * (9/16) 
    
        # Create rectangle vertices in clockwise order starting from top-left
        vertices = [
            {"x": -width/2, "y": height/2},   # Top-left
            {"x": width/2, "y": height/2},    # Top-right
            {"x": width/2, "y": -height/2},   # Bottom-right
            {"x": -width/2, "y": -height/2}   # Bottom-left
    ]     


    elif game_mode ==  "irregular":  # irregular modes
        # Get ratios and adjustments based on specific irregular mode
        ratios, angle_adjustments = cls.calculate_side_ratios()

        # start_angle = -math.pi / 2
        angle_step = (2 * math.pi) / num_sides

        for i in range(num_sides):
            # angle = start_angle + (i * angle_step) + angle_adjustments[i]
            angle = (i * angle_step) + angle_adjustments[i]
            radius = base_radius * ratios[i]
            vertices.append(
                {"x": radius * math.cos(angle), "y": radius * math.sin(angle)}
            )

    # Normalize to [-1, 1] space
    max_coord = max(
        max(abs(v["x"]) for v in vertices), max(abs(v["y"]) for v in vertices)
    )

    scale = 1.0 / max_coord
    for vertex in vertices:
        vertex["x"] *= scale
        vertex["y"] *= scale
    return {"vertices" : vertices, "scale" : scale}  






# calculate_side_ratios
import random


def calculate_base_deformation(self):
    """Calculate deformation based on game mode"""
    player_density = self.num_paddles / self.num_sides

    if self.game_shape == "irregular":
        # Original balanced ratios
        if self.num_sides == 4:
            return 4 / 3 if self.num_paddles == 2 else 1.0
        else:
            if player_density <= 0.5:
                return 1.0 + (player_density * 0.5)
            else:
                return 1.25 - (player_density * 0.25)

    elif self.game_shape == "crazy":
        # Extreme deformation
        if self.num_sides == 4:
            return 4 / 3 if self.num_paddles == 2 else 1.0
        else:
            return 1.8 if player_density <= 0.5 else 1.5

    elif self.game_shape == "star":
        # Alternating long and short sides
        return 2.2 if player_density <= 0.3 else 1.8

    return 1.0  # Default if mode not recognized


def calculate_side_ratios(self):
    """Calculate ratios based on game mode"""
    base_deform = self._calculate_base_deformation()

    if self.game_shape == "irregular":
        return self._calculate_regular_ratios(
            base_deform
        )  # This is now our irregular mode
    elif self.game_shape == "crazy":
        return self._calculate_crazy_ratios(base_deform)
    elif self.game_shape == "star":
        return self._calculate_star_ratios(base_deform)
    else:
        return self._calculate_regular_ratios(base_deform)  # Default


def calculate_regular_ratios(self, base_deform):
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

