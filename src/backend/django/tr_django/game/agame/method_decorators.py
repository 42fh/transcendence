
def add_game_flow(cls):
    """
    Decorator that adds game flow management methods to a class.
    Includes methods for starting, updating, and ending games with process-safe checks.
    """
    from game_flow import start_game, update_game, end_game
    
    methods = {
        'start_game': start_game,
        'update_game': update_game,
        'end_game': end_game
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls


def add_game_logic(cls):
    """
    Decorator that adds core game logic methods to a class.
    Includes methods for ball movement, collision handling, and game mechanics.
    """
    methods = {
        'game_logic': game_logic,
        'move_ball': move_ball,
        'handle_distance_check': handle_distance_check,
        'handle_side_ball_situation': handle_side_ball_situation,
        'handle_collision_with_events': handle_collision_with_events,
        'handle_paddle_collision_with_events': handle_paddle_collision_with_events,
        'handle_wall_collision_with_events': handle_wall_collision_with_events,
        'handle_miss_collision_with_events': handle_miss_collision_with_events,
        'handle_outside_boundary': handle_outside_boundary,
        'update_scores': update_scores,
        'check_winner': check_winner
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_data_event_handling(cls):
    """
    Decorator that adds data and event handling methods to a class.
    Includes methods for tracking game events and metrics.
    """
    methods = {
        'initialize_cycle_data': initialize_cycle_data,
        'update_distance_metrics': update_distance_metrics,
        'add_game_over_event': add_game_over_event
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_redis_operations(cls):
    """
    Decorator that adds Redis-related operations to a class.
    Includes methods for connection setup and data storage/retrieval.
    """
    methods = {
        '_setup_connections': _setup_connections,
        'store_vertices': store_vertices,
        'get_vertices': get_vertices,
        'acquire_lock': acquire_lock,
        'release_lock': release_lock
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_player_management(cls):
    """
    Decorator that adds player management methods to a class.
    Includes methods for adding/removing players with process-safe operations.
    """
    methods = {
        'add_player': add_player,
        'remove_player': remove_player
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_paddle_management(cls):
    """
    Decorator that adds paddle management methods to a class.
    Includes methods for updating and retrieving paddle positions atomically.
    
    Usage:
    @add_paddle_management
    class PaddleManager:
        ...
    """
    methods = {
        'update_paddle': update_paddle,
        'get_paddle_positions': get_paddle_positions
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_initialization(cls):
    """
    Decorator that adds game initialization methods to a class.
    Includes methods for setting up new games and creating initial states.
    
    Usage:
    @add_initialization
    class GameInitializer:
        ...
    """
    methods = {
        'initialize': initialize,
        '_initialize_new_game': _initialize_new_game,
        'create_initial_state': create_initial_state
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_state_validation(cls):
    """
    Decorator that adds game state validation methods to a class.
    Includes comprehensive state structure verification.
    
    Usage:
    @add_state_validation
    class StateValidator:
        ...
    """
    methods = {
        'verify_game_state': verify_game_state
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

def add_game_physics(cls):
    """
    Decorator that adds game physics methods to a class.
    Includes ball movement, bounce effects, and combo system.
    
    Usage:
    @add_game_physics
    class PhysicsEngine:
        ...
    """
    methods = {
        'reset_ball': reset_ball,
        'apply_ball_bounce_effect': apply_ball_bounce_effect,
        'initialize_combo_system': initialize_combo_system,
        'update_hit_combo': update_hit_combo
    }
    
    for name, method in methods.items():
        setattr(cls, name, method)
    return cls

