def add_cls_methods(cls):
    """
    Decorator that adds class methods to a class.
    Includes methods for setting up a game
    """
    from .game_setup import (
        setup_game,
        calculate_vertices,
        calculate_sides_normals,
        calculate_inner,
        calculate_player_side_indices,
        set_initial_state,
    )

    methods = {
        "setup_game": setup_game,
        "calculate_vertices": calculate_vertices,
        "calculate_sides_normals": calculate_sides_normals,
        "calculate_inner": calculate_inner,
        "calculate_player_side_indices": calculate_player_side_indices,
        "set_initial_state": set_initial_state,
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_game_flow(cls):
    """
    Decorator that adds game flow management methods to a class.
    Includes methods for starting, updating, and ending games with process-safe checks.
    """
    from .game_flow import start_game, update_game, end_game, error_exit

    methods = {
        "start_game": start_game,
        "update_game": update_game,
        "end_game": end_game,
        "error_exit": error_exit
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_game_logic(cls):
    """
    here game logic flow
    """
    from .game_logic import (
        # main
        game_logic,
        # Movement Phase
        move_ball,
        # Boundary Phase
        get_distance,
        handle_distance_check,
        handle_outside_boundary,
        get_inner_boundary,
        # Collision Candidate Phase
        # Collision Verification Phase
        verify_collision_candidate,
        get_collision_check_range,
        handle_parallel,
        # Impact Processing Phase
        collision_handler,
        collision_paddle,
        bounce_paddle,
        collision_wall,
        bounce_wall,
        apply_ball_bounce_effect,
        collision_miss,
        check_winner,
        initialize_cycle_data,
    )

    methods = {
        #  main
        "game_logic": game_logic,
        # Movement Phase
        "move_ball": move_ball,
        # Boundary Phase
        "get_distance": get_distance,
        "handle_distance_check": handle_distance_check,
        "handle_outside_boundary": handle_outside_boundary,
        "get_inner_boundary": get_inner_boundary,
        # Collision Candidate Phase
        # Collision Verification Phase
        "verify_collision_candidate": verify_collision_candidate,
        "get_collision_check_range": get_collision_check_range,
        "handle_parallel": handle_parallel,
        # Impact Processing Phase
        "collision_handler": collision_handler,
        "collision_paddle": collision_paddle,
        "bounce_paddle": bounce_paddle,
        "collision_wall": collision_wall,
        "bounce_wall": bounce_wall,
        "apply_ball_bounce_effect": apply_ball_bounce_effect,
        "collision_miss": collision_miss,
        "check_winner": check_winner,
        "initialize_cycle_data": initialize_cycle_data,
    }

    for name, method in methods.items():
        setattr(cls, name, method)

    return cls


def add_game_physics(cls):
    """
    game_physic
    """
    from .game_physic import reset_ball

    methods = {"reset_ball": reset_ball}

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_gamestate(cls):
    """
    gamestate
    """
    from .gamestate import verify_game_state

    methods = {"verify_game_state": verify_game_state}

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_initial(cls):
    """
    initial
    """
    from .initial import initialize

    methods = {
        "initialize": initialize,
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_paddle(cls):
    """
    paddle
    """
    from .paddle import update_paddle, get_paddle_positions

    methods = {
        "update_paddle": update_paddle,
        "get_paddle_positions": get_paddle_positions,
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_player(cls):
    """
    player
    """
    from .player import add_player, remove_player, _handle_normal_pregame_leave, _handle_tournament_pregame_leave, _handle_ingame_leave

    methods = {"add_player": add_player, "remove_player": remove_player, "_handle_normal_pregame_leave": _handle_normal_pregame_leave, "_handle_tournament_pregame_leave": _handle_tournament_pregame_leave, "_handle_ingame_leave" : _handle_ingame_leave}

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_redis(cls):
    """
    redis
    """
    from .redis import (
        setup_connections,
    )

    methods = {
        "setup_connections": setup_connections,
    }

    for name, method in methods.items():
        setattr(cls, name, method)
    return cls
