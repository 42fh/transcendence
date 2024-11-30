def add_abstract_implementations(cls):
    """
    Implements all required abstract methods from AGameManager based on game logic flow
    """
    from .abstract_implementations import (
        # Setup
        calculate_inner_boundaries,
        # Movement Phase
        # Boundary Phase
        # Collision Candidate Phase
        find_collision_candidate,
        # Collision Verification Phase
        handle_tunneling,
        handle_paddle,
        handle_wall,
        # Impact Processing Phase
    )

    methods = {
        #  Setup
        "calculate_inner_boundaries": calculate_inner_boundaries,
        # Movement Phase
        # Boundary Phase
        # Collision Candidate Phase
        "find_collision_candidate": find_collision_candidate,
        # Collision Verification Phase
        "handle_tunneling": handle_tunneling,
        "handle_paddle": handle_paddle,
        "handle_wall": handle_wall,
        # Impact Processing Phase
    }

    for name, method in methods.items():
        setattr(cls, name, method)

    return cls


def add_cls_methods(cls):
    
    from .game_setup import calculate_vertices, calculate_sides_normals, calculate_inner, initialize_ball_movements

    methods = {
        "calculate_vertices": calculate_vertices,
        "calculate_sides_normals": calculate_sides_normals,
        "calculate_inner" : calculate_inner,
        "initialize_ball_movements": initialize_ball_movements
    }

    for name, method in methods.items():
        setattr(cls, name, method)

    return cls



def add_overwriten_methods(cls):
    """
    here are the methods which get overwriten
    """
    # from .overwriten_methods import (
    # reset_ball

    # )

    methods = {
        #'reset_ball': reset_ball
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_setup(cls):
    """
    here are the methods, we need extra for setup
    """
    from .setup import (
        calculate_side_normals,
        calculate_polygon_vertices,
        get_player_side_indices,
    )
    from .ratios import (
        _calculate_base_deformation,
        _calculate_regular_ratios,
        _calculate_crazy_ratios,
        _calculate_star_ratios,
        _calculate_side_ratios,
    )

    methods = {
        "calculate_side_normals": calculate_side_normals,
        "calculate_polygon_vertices": calculate_polygon_vertices,
        "get_player_side_indices": get_player_side_indices,
        "_calculate_regular_ratios": _calculate_regular_ratios,
        "_calculate_crazy_ratios": _calculate_crazy_ratios,
        "_calculate_star_ratios": _calculate_star_ratios,
        "_calculate_base_deformation": _calculate_base_deformation,
        "_calculate_side_ratios": _calculate_side_ratios,
    }

    for name, method in methods.items():
        setattr(cls, name, method)

    return cls


def add_collision_verification_phase(cls):
    """
    here are the methods, we need extra for collision_verification_phase
    """
    from .collision_verification_phase import (
        get_nearest_side_index,
        calculate_relative_position,
    )

    methods = {
        "get_nearest_side_index": get_nearest_side_index,
        "calculate_relative_position": calculate_relative_position,
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_collision_candidate_phase(cls):
    """
    here are the methods, we need extra for collision_candidate_phase
    """
    from .collision_candidate_phase import (
        check_ball_movement_relative_to_side,
        check_paddle,
    )

    methods = {
        "check_ball_movement_relative_to_side": check_ball_movement_relative_to_side,
        "check_paddle": check_paddle,
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_ball_movement_tracking(cls):
    """
    here are the methods, we need extra for ball_movement_tracking
    """
    from .ball_movement_tracking import (
        self_initialize_ball_movements,
        update_ball_movement,
        reset_ball_movement,
    )

    methods = {
        "self_initialize_ball_movements": self_initialize_ball_movements,
        "update_ball_movement": update_ball_movement,
        "reset_ball_movement": reset_ball_movement,
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls
