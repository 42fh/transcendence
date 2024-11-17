import math


def calculate_relative_position(self, ball, side_index):
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


def get_nearest_side_index(self, ball):
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
    speed = math.sqrt(ball["velocity_x"] ** 2 + ball["velocity_y"] ** 2)
    if speed < 1e-10:  # Check for stationary ball
        return None, None

    # Use 2x the polygon size to ensure we cross it
    time_back = 2.0 / speed

    test_point = {
        "x": ball["x"] - ball["velocity_x"] * time_back,
        "y": ball["y"] - ball["velocity_y"] * time_back,
        "size": ball["size"],
    }

    # For each side, check if the line from test_point to ball crosses it
    crossings = []
    for side_index in range(self.num_sides):
        # Calculate distances from both points to the side
        normal = self.side_normals[side_index]
        start = self.vertices[side_index]

        # Distance from current ball position to side
        current_dist = (ball["x"] - start["x"]) * normal["x"] + (
            ball["y"] - start["y"]
        ) * normal["y"]

        # Distance from test point to side
        test_dist = (test_point["x"] - start["x"]) * normal["x"] + (
            test_point["y"] - start["y"]
        ) * normal["y"]

        # If signs are different, we crossed this side
        if (
            current_dist * test_dist <= 0
        ):  # Less than or equal includes touching the side
            # Calculate relative position along the side
            relative_pos = self.calculate_relative_position(ball, side_index)

            # Only count if intersection is within the side segment
            if 0 <= relative_pos <= 1:
                # Calculate intersection point
                # Use linear interpolation between test point and ball position
                t = current_dist / (current_dist - test_dist)  # interpolation factor
                intersection = {
                    "x": ball["x"] + t * (test_point["x"] - ball["x"]),
                    "y": ball["y"] + t * (test_point["y"] - ball["y"]),
                }

                crossings.append(
                    {
                        "side_index": side_index,
                        "distance": abs(current_dist),
                        "intersection": intersection,
                    }
                )

    # If we found crossings, return the nearest one
    if crossings:
        closest = min(crossings, key=lambda x: x["distance"])
        return closest["side_index"], closest["intersection"]

    return None, None
