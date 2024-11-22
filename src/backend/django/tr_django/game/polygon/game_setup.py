
from typing import List, Dict, Optional 
import math


@classmethos
def calculate_vertices(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: calculate_vertices!")

    raise NotImplementedError("Subclasses must implement this: sides_normals!")

@classmethos
def calculate_inner_boundaries(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: inner_boundaries!")




@classmethos
def calculate_sides_normals(cls, settings: Dict[str, Any]) -> dict:
    """
    Calculate normal vectors for each side of the polygon.
    Normal vectors point inward.
    All values are stored as floats.
    Uses epsilon for float comparisons.
    """
    vertices = settings.get("vertices")  
    num_sides =  settings.get("vertices") 
    player_sides =  settings.get("player_sides") 

    if not vertices:
        raise ValueError("Vertices must be calculated before normals")

    EPSILON = 1e-10  # Small value for float comparisons
    side_normals = []

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

        self.side_normals.append(
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


#
def calculate_polygon_vertices(self):
    """Calculate vertices based on number of sides and player distribution"""
    if not self.active_sides:
        raise ValueError("Active sides must be determined before calculating vertices")

    vertices = []
    base_radius = 1.0

    if self.game_mode == "regular":
        print("regular")
        # Perfect regular polygon: all sides equal, evenly spaced
        angle_step = (2 * math.pi) / self.num_sides
        # start_angle = -math.pi / 2  # Start from top

        for i in range(self.num_sides):
            # angle = start_angle + (i * angle_step)
            angle = i * angle_step
            vertices.append(
                {"x": base_radius * math.cos(angle), "y": base_radius * math.sin(angle)}
            )
    elif self.game_mode == "classic":
        print("classic")
        width = 1.0  # Base width
        height = width * (9/16)  # Height based on 16:9 ratio
    
        # Create rectangle vertices in clockwise order starting from top-left
        vertices = [
            {"x": -width/2, "y": height/2},   # Top-left
            {"x": width/2, "y": height/2},    # Top-right
            {"x": width/2, "y": -height/2},   # Bottom-right
            {"x": -width/2, "y": -height/2}   # Bottom-left
    ]     


    else:  # irregular modes
        print("irregular")
        # Get ratios and adjustments based on specific irregular mode
        ratios, angle_adjustments = self._calculate_side_ratios()

        # start_angle = -math.pi / 2
        angle_step = (2 * math.pi) / self.num_sides

        for i in range(self.num_sides):
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

    self.scale = 1.0 / max_coord
    for vertex in vertices:
        vertex["x"] *= self.scale
        vertex["y"] *= self.scale
    print("scale: ", self.scale)
    self.vertices = vertices


#
def get_player_side_indices(self):
