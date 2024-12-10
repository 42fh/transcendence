import random
from typing import List, Dict, Optional, Any, Tuple
import math
import logging

logger = logging.getLogger(__name__)


@classmethod
def calculate_inner(cls, settings: Dict[str, Any]) -> dict:
    """Calculate inner boundary using true perpendicular distances for any polygon"""

    vertices = settings.get("vertices")
    num_sides = settings.get("sides")
    side_normals = settings.get("normals")
    if not vertices or not side_normals:
        raise ValueError(
            "Vertices and normals must be calculated before inner boundary"
        )

    # Calculate perpendicular distances from center to each side
    min_distance = float("inf")

    for i in range(num_sides):
        # Get start vertex of the side and its normal
        vertex = vertices[i]
        normal = side_normals[i]

        # Calculate perpendicular distance using the dot product
        # Distance = dot product of any point on the line (vertex) with the normal
        distance = abs(vertex["x"] * normal["x"] + vertex["y"] * normal["y"])

        # logger.debug(f"Side {i} perpendicular distance: {distance}")
        min_distance = min(min_distance, distance)

    inner_boundary = float(min_distance)
    # logger.info(f"Final inner boundary: {inner_boundary}")

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
    num_sides = settings.get("sides")
    player_sides = settings.get("players_sides")

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
            logger.warning(f"Warning: Near-zero length side detected at index {i}")

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

    return {"normals": side_normals}


#
@classmethod
def calculate_vertices(cls, settings: Dict[str, Any]) -> dict:
    """Calculate vertices based on number of sides and player distribution"""

    active_sides = settings.get("players_sides")
    game_mode = settings.get("mode")
    num_sides = settings.get("sides")
    num_paddles = settings.get("num_players")
    game_shape = settings.get("shape")

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
        height = width * (9 / 16)

        # Create rectangle vertices in clockwise order starting from top-left
        vertices = [
            {"x": -width / 2, "y": height / 2},  # Top-left
            {"x": width / 2, "y": height / 2},  # Top-right
            {"x": width / 2, "y": -height / 2},  # Bottom-right
            {"x": -width / 2, "y": -height / 2},  # Bottom-left
        ]

    elif game_mode == "irregular":  # irregular modes
        # Get ratios and adjustments based on specific irregular mode
        base_deform = calculate_base_deformation(num_sides, num_paddles, game_shape)
        ratios, angle_adjustments = calculate_side_ratios(
            num_sides, game_shape, active_sides, base_deform
        )

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
    return {"vertices": vertices, "scale": scale}


@classmethod
def initialize_ball_movements(cls, settings: Dict[str, Any]) -> dict:
    """Initialize the nested array structure for ball movement tracking"""
    num_balls = settings.get("num_balls")
    num_sides = settings.get("sides")
    previous_movements = [
        {
            "sides": [
                {
                    "distance": float(0.0),
                    "signed_distance": float(0.0),
                    "dot_product": float(0.0),
                }
                for _ in range(num_sides)
            ],
            "in_deadzone": True,  # Start in deadzone since balls spawn at center
            "last_position": {"x": float(0.0), "y": float(0.0)},
        }
        for _ in range(num_balls)
    ]
    return {"ballmovements": previous_movements}


def calculate_base_deformation(
    num_sides: int, num_paddles: int, game_shape: str
) -> float:
    """Calculate deformation based on game mode"""
    player_density = num_paddles / num_sides

    if game_shape == "irregular":
        if num_sides == 4:
            return 4 / 3 if num_paddles == 2 else 1.0
        return (
            1.0 + (player_density * 0.5)
            if player_density <= 0.5
            else 1.25 - (player_density * 0.25)
        )

    if game_shape == "crazy":
        if num_sides == 4:
            return 4 / 3 if num_paddles == 2 else 1.0
        return 1.8 if player_density <= 0.5 else 1.5

    if game_shape == "star":
        return 2.2 if player_density <= 0.3 else 1.8

    return 1.0


def calculate_side_ratios(
    num_sides: int, game_shape: str, active_sides: List[int], base_deform: float
) -> Tuple[List[float], List[float]]:
    """Calculate ratios based on game mode"""
    if game_shape == "crazy":
        return _calculate_crazy_ratios(num_sides, active_sides, base_deform)
    if game_shape == "star":
        return _calculate_star_ratios(num_sides, active_sides, base_deform)
    return _calculate_regular_ratios(num_sides, active_sides, base_deform)


def _calculate_regular_ratios(
    num_sides: int, active_sides: List[int], base_deform: float
) -> Tuple[List[float], List[float]]:
    """Original balanced ratio calculation"""
    ratios = [1.0] * num_sides
    angle_adjustments = [0] * num_sides

    if num_sides == 4:
        if len(active_sides) == 2:
            if 0 in active_sides and 2 in active_sides:
                ratios[0] = ratios[2] = base_deform
                ratios[1] = ratios[3] = 1.0
            elif 1 in active_sides and 3 in active_sides:
                ratios[0] = ratios[2] = 1.0
                ratios[1] = ratios[3] = base_deform
        else:
            for i in active_sides:
                ratios[i] = base_deform
    else:
        for side in active_sides:
            ratios[side] = base_deform
            prev_side = (side - 1) % num_sides
            next_side = (side + 1) % num_sides
            ratios[prev_side] = 1.0 + (base_deform - 1.0) * 0.5
            ratios[next_side] = 1.0 + (base_deform - 1.0) * 0.5

        smoothed_ratios = ratios.copy()
        for i in range(num_sides):
            prev_ratio = ratios[(i - 1) % num_sides]
            next_ratio = ratios[(i + 1) % num_sides]
            smoothed_ratios[i] = (prev_ratio + 2 * ratios[i] + next_ratio) / 4
        ratios = smoothed_ratios

    return ratios, angle_adjustments


def _calculate_crazy_ratios(
    num_sides: int, active_sides: List[int], base_deform: float
) -> Tuple[List[float], List[float]]:
    """Extreme ratio calculation with sharp transitions"""
    ratios = [0.6] * num_sides
    angle_adjustments = [0] * num_sides

    for side in active_sides:
        ratios[side] = base_deform
        if (side + 1) % num_sides not in active_sides:
            angle_adjustments[side] = random.uniform(-0.26, 0.26)

    return ratios, angle_adjustments


def _calculate_star_ratios(
    num_sides: int, active_sides: List[int], base_deform: float
) -> Tuple[List[float], List[float]]:
    """Star-like shape with alternating long and short sides"""
    ratios = [0.4 if i % 2 == 0 else 1.2 for i in range(num_sides)]
    angle_adjustments = [0] * num_sides

    for side in active_sides:
        ratios[side] = base_deform

    return ratios, angle_adjustments
