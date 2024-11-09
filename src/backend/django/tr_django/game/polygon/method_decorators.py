def add_collision_handlers(cls):
    """
    Decorator that adds methods for handling different types of collisions.
    Includes paddle, wall, tunneling, and parallel collision handlers.
    """
    from handle_collision import (
        handle_paddle,
        handle_wall,
        _get_active_paddle_index,
        handle_tunneling,
        handle_parallel
    )
    
    methods = {
        'handle_paddle': handle_paddle,
        'handle_wall': handle_wall,
        '_get_active_paddle_index': _get_active_paddle_index,
        'handle_tunneling': handle_tunneling,
        'handle_parallel': handle_parallel
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_movement_tracking(cls):
    """
    Decorator that adds ball movement tracking functionality.
    Includes initialization and updating of movement data.
    """
    from collisions_helpers import (
        initialize_ball_movements,
        update_ball_movement,
        reset_ball_movement
    )
    
    methods = {
        'initialize_ball_movements': initialize_ball_movements,
        'update_ball_movement': update_ball_movement,
        'reset_ball_movement': reset_ball_movement
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_polygon_setup(cls):
    """
    Decorator that adds polygon geometry setup methods to a class.
    Includes vertex and normal calculation for polygon construction.
    """
    from setup import (
        calculate_side_normals,
        calculate_polygon_vertices,
        _get_player_side_indices
    )
    
    methods = {
        'calculate_side_normals': calculate_side_normals,
        'calculate_polygon_vertices': calculate_polygon_vertices,
        '_get_player_side_indices': _get_player_side_indices
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_ratio_calculations(cls):
    """
    Decorator that adds ratio calculation methods for polygon deformation.
    Includes methods for different game modes (regular, irregular, crazy, star).
    """
    from ratios import (
        _calculate_base_deformation,
        _calculate_side_ratios,
        _calculate_regular_ratios,
        _calculate_crazy_ratios,
        _calculate_star_ratios
    )
    
    methods = {
        '_calculate_base_deformation': _calculate_base_deformation,
        '_calculate_side_ratios': _calculate_side_ratios,
        '_calculate_regular_ratios': _calculate_regular_ratios,
        '_calculate_crazy_ratios': _calculate_crazy_ratios,
        '_calculate_star_ratios': _calculate_star_ratios
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_collision_detection(cls):
    """
    Decorator that adds collision detection methods for paddle and wall collisions.
    Includes methods for calculating relative positions and finding nearest collisions.
    """
    from paddle_or_wall import (
        _calculate_relative_position,
        _calculate_paddle_collision,
        _find_nearest_collision
    )
    
    methods = {
        '_calculate_relative_position': _calculate_relative_position,
        '_calculate_paddle_collision': _calculate_paddle_collision,
        '_find_nearest_collision': _find_nearest_collision
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_helper_methods(cls):
    """
    Decorator that adds various helper methods for polygon game mechanics.
    Includes vector normalization, paddle checking, and ball reset extensions.
    """
    from notused import _normalize_vector
    from noclue import (
        check_paddle,
        reset_ball,
        _calculate_projection
    )
    
    methods = {
        '_normalize_vector': _normalize_vector,
        'check_paddle': check_paddle,
        'reset_ball': reset_ball,
        '_calculate_projection': _calculate_projection
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls
