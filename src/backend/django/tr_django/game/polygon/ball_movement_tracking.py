#
# def initialize_ball_movements(self, num_balls):
#     """Initialize the nested array structure for ball movement tracking"""
#     self.previous_movements = [
#     [
#         {'distance': float(0.0), 'dot_product': float(0.0)}
#         for _ in range(self.num_sides)
#     ]
#     for _ in range(num_balls)
#     ]
#
#
# def update_ball_movement(self, ball_index, side_index, distance, dot_product):
#     """Update movement data for a specific ball and side"""
#     if ball_index >= len(self.previous_movements):
#         # Expand array if needed (e.g., when new balls are added)
#         additional_balls = ball_index - len(self.previous_movements) + 1
#         self.previous_movements.extend([
#             [
#                 {'distance': float(0.0), 'dot_product': float(0.0)}
#                 for _ in range(self.num_sides)
#             ]
#             for _ in range(additional_balls)
#         ])
#
#     self.previous_movements[ball_index][side_index] = {
#         'distance': float(distance),
#         'dot_product': float(dot_product)
#     }
#
# def reset_ball_movement(self, ball_index):
#     """Reset movement tracking for a specific ball"""
#     if ball_index < len(self.previous_movements):
#         self.previous_movements[ball_index] = [
#             {'distance': float(0.0), 'dot_product': float(0.0)}
#             for _ in range(self.num_sides)
#         ]
#


def initialize_ball_movements(self, num_balls):
    """Initialize the nested array structure for ball movement tracking"""
    self.previous_movements = [
        {
            "sides": [
                {
                    "distance": float(0.0),
                    "signed_distance": float(0.0),
                    "dot_product": float(0.0),
                }
                for _ in range(self.num_sides)
            ],
            "in_deadzone": True,  # Start in deadzone since balls spawn at center
            "last_position": {"x": float(0.0), "y": float(0.0)},
        }
        for _ in range(num_balls)
    ]


def reset_ball_movement(self, ball_index):
    """Reset movement tracking for a specific ball"""
    if ball_index < len(self.previous_movements):
        self.previous_movements[ball_index] = {
            "sides": [
                {
                    "distance": float(0.0),
                    "signed_distance": float(0.0),
                    "dot_product": float(0.0),
                }
                for _ in range(self.num_sides)
            ],
            "in_deadzone": True,  # Reset into deadzone since ball resets to center
        }


def update_ball_movement(
    self, ball_index, side_index, distance, dot_product, signed_distance
):
    """Update movement data for a specific ball and side"""
    if ball_index >= len(self.previous_movements):
        # Expand array if needed
        additional_balls = ball_index - len(self.previous_movements) + 1
        self.previous_movements.extend(
            [
                {
                    "sides": [
                        {
                            "distance": float(0.0),
                            "signed_distance": float(0.0),
                            "dot_product": float(0.0),
                        }
                        for _ in range(self.num_sides)
                    ],
                    "in_deadzone": True,  # New balls start in deadzone
                }
                for _ in range(additional_balls)
            ]
        )

    self.previous_movements[ball_index]["sides"][side_index] = {
        "distance": float(distance),
        "dot_product": float(dot_product),
        "signed_distance": float(signed_distance),
    }
