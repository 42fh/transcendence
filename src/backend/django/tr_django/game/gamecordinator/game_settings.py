# settings
settings =
    {
    # Game Settsngs from the user
    "settings_fields": 
    {
        "type": "str"  # Game type -> polygon or circular -> will choose with subclass will be used

        # 
        "num_players": "int",  # Number of players -> 1 - 12, default 2, 
        "num_balls": "int",  # Number of balls -> default 1
        "min_players": "int",  # Minimum players required -> default num_players
        "sides": "int",  # Number of sides in polygon/sectors in circle -> default num_player || if sides < num_players ? sides = num_players


        
        # all value between 0-1, this number can be scaled by scale
        "paddle_length": "float",  # lenght of the paddle value is to be seen in relation to its corresponding rectangular side / circle sector
        "paddle_width": "float",  # paddle width value is to be seen in relation to the radius of the “outer_boundary” 
        "ball_size": "float",  # ball size value is to be seen in relation to the radius of the “outer_boundary” 
        "initial_ball_speed": "float",  # Initial ball speed value is to be seen in relation to the radius of the “outer_boundary” 

        # score mode
        "scoreMode": "str",  # Scoring mode (first 11 (numplayer > 1), timed, survival)


        # presettings choise
        "mode": "str",  # Game mode (regular, classic, circular, irregular) to select specific settings,                                                                                                    

        # you can do everything mode irregular
        "shape": "str",  # Shape of field (regular, irregular, star, crazyi, [classic])
    },
    # Game settings CCordinator
    "set_backend": 
    {
        # set from backend
        "gameId": "int",  # Game ID generated from GameCordinator
        "playerId": "int",  # Player ID form Users
        "pongType": "str",  # Type of polygon (regular, irregular) for optimization
    },
    # Game settings caclulated from backend 
    "calculate_backend":
    {
        # Game Physics Constants
        "physics_constants": 
        {
            "outer_boundary": "float",  # Outer game boundary,  default 1.0
            "inner_boundary": "float",  # Inner game boundary (calculated)
            "scale": "float",  # the scaling we need to normalize the calculated vertices again, default 1.0
            "combo_timeout": "float"  # Time window for combos (1.5 seconds)
        },
        
    }
    



default = DEFAULT_POLYGON

client_settings = json.load(data)
default.update(client_settings)




#presettings
#-----------------------
# default regular/polygon
# ChainMap
# mutable_settings
------------------------







------------------------

# game_state









# Game State Configuration Fields
game_state_fields = {
    # Core Game State (from game state validation)
    "required_state_keys": {
        "balls": "list",  # List of ball objects
        "paddles": "list",  # List of paddle objects
        "scores": "list",  # List of player scores
        "dimensions": "dict",  # Game dimension settings
        "game_type": "str",  # Type of game (polygon, circular, etc.)
    },
    
    # Ball Object Structure
    "ball_fields": {
        "x": "float",  # X position
        "y": "float",  # Y position
        "velocity_x": "float",  # X velocity
        "velocity_y": "float",  # Y velocity
        "size": "float"  # Ball size
    },
    
    # Paddle Object Structure
    "paddle_fields": {
        "position": "float",  # Position along side (0-1)
        "active": "bool",  # Whether paddle is active
        "side_index": "int"  # Index of the side the paddle is on
    },
    
    # Dimensions Structure
    "dimension_fields": {
        "paddle_length": "float",  # Length of paddle
        "paddle_width": "float"  # Width of paddle
    },
    
    
    # Player Values
    "player_values": {
        "move_cooldown": "float",  # Cooldown between moves
        "move_speed": "float",  # Base move speed
        "move_speed_boost": "float",  # Speed boost multiplier
        "reverse_controls": "bool",  # Control reversal flag
        "paddle_size": "float"  # Paddle size
    },
    





# other data in AGameManager / PolygonPong / CircularPong

    # Movement Tracking
    "movement_tracking": {
        "sides": {
            "distance": "float",  # Distance from boundary
            "signed_distance": "float",  # Signed distance (positive = outside)
            "dot_product": "float",  # Radial velocity component
            "angle": "float"  # Angular position within sector
        },
        "in_deadzone": "bool",  # Whether in center deadzone
        "last_position": {
            "x": "float",
            "y": "float"
        },
        "last_angle": "float",  # Last angular position
        "last_radial_distance": "float"  # Last distance from center
    },
    
    # Redis Keys
    "redis_keys": {
        "state_key": "str",  # Game state
        "players_key": "str",  # Player list
        "running_key": "str",  # Game running status
        "settings_key": "str",  # Game settings
        "paddles_key": "str",  # Paddle positions
        "lock_key": "str",  # Game lock
        "type_key": "str",  # Game type
        "vertices_key": "str"  # Game vertices
    },
    
    
    # Cycle Data (for event tracking)
    "cycle_data": {
        "events": "list",  # List of game events
        "highest_distance": "float",  # Highest distance reached
        "state_updates": "dict",  # State update history
        "collision_data": "list"  # Collision event data
    }
}


# Pre-Game Calculation Fields
pre_game_calculations = {
    # Polygon/Shape Calculations
    "shape_calculations": {
        "vertices": {
            # Regular Mode
            "regular": {
                "angle_step": "float",  # 2 * math.pi / num_sides
                "vertex_coordinates": {
                    "x": "float",  # base_radius * math.cos(angle)
                    "y": "float",  # base_radius * math.sin(angle)
                }
            },
            # Classic Mode (Rectangle)
            "classic": {
                "width": "float",  # 1.0 (base width)
                "height": "float",  # width * (9/16) (16:9 ratio)
                "vertices": [
                    {"x": "float", "y": "float"},  # Top-left
                    {"x": "float", "y": "float"},  # Top-right
                    {"x": "float", "y": "float"},  # Bottom-right
                    {"x": "float", "y": "float"}   # Bottom-left
                ]
            },
            # Irregular/Crazy Modes
            "irregular": {
                "base_deformation": "float",  # Calculated based on player density
                "ratios": "list[float]",  # Side length ratios
                "angle_adjustments": "list[float]"  # Angle modifications
            }
        },

        # Deformation Calculations
        "deformation": {
            "player_density": "float",  # num_paddles / num_sides
            "base_deformation_values": {
                "regular": "float",  # 1.0
                "irregular": {
                    "four_sides_two_players": "float",  # 4/3
                    "low_density": "float",  # 1.0 + (player_density * 0.5)
                    "high_density": "float"  # 1.25 - (player_density * 0.25)
                },
                "crazy": {
                    "low_density": "float",  # 1.8
                    "high_density": "float"  # 1.5
                },
                "star": {
                    "low_density": "float",  # 2.2
                    "high_density": "float"  # 1.8
                }
            }
        },

        # Scale Calculations
        "scale": {
            "max_coordinate": "float",  # max(abs(vertices coordinates))
            "final_scale": "float"  # 1.0 / max_coordinate
        }
    },

    # Player Distribution
    "player_distribution": {
        "two_players": {
            "regular": {
                "positions": "list[int]"  # [0, num_sides//2]
            },
            "classic": {
                "positions": "list[int]"  # [1, 3] (vertical sides)
            }
        },
        "multiple_players": {
            "even_distribution": {
                "spacing": "int",  # math.floor(num_sides / num_paddles)
                "positions": "list[int]"  # [(i * spacing) % num_sides]
            },
            "high_density": {
                "alternating": "list[int]",  # First half on even indices
                "remaining": "list[int]"  # Fill gaps clockwise
            }
        }
    },

    # Boundary Calculations
    "boundaries": {
        "outer_boundary": "float",  # 1.0 (normalized)
        "inner_boundary": {
            "base": "float",  # Minimum perpendicular distance from center to sides
            "buffer": "float",  # 0.8 (adjustment factor)
            "final": "float"  # (inner_boundary - paddle_width - ball_size) * buffer
        }
    },

    # Normal Vectors
    "normal_vectors": {
        "per_side": {
            "side_vector": {
                "x": "float",  # end.x - start.x
                "y": "float"  # end.y - start.y
            },
            "normal": {
                "x": "float",  # -side_vector.y (perpendicular)
                "y": "float",  # side_vector.x (perpendicular)
                "length": "float",  # sqrt(x^2 + y^2)
                "dot_product": "float"  # Dot product with center vector
            },
            "is_player": "bool",  # Whether side has paddle
            "epsilon": "float"  # 1e-10 (float comparison threshold)
        }
    },

    # Initial Ball Setup
    "ball_initialization": {
        "position": {
            "x": "float",  # 0 (center)
            "y": "float"  # 0 (center)
        },
        "velocity": {
            "angle": "float",  # random.uniform(0, 2 * math.pi)
            "speed": "float",  # settings.initial_ball_speed
            "components": {
                "x": "float",  # speed * math.cos(angle)
                "y": "float"  # speed * math.sin(angle)
            }
        },
        "size": "float"  # From settings
    },

    # Movement Tracking Initialization
    "movement_tracking": {
        "per_ball": {
            "sides": [{
                "distance": "float",  # 0.0
                "signed_distance": "float",  # 0.0
                "dot_product": "float",  # 0.0
                "angle": "float"  # 0.0
            }],
            "in_deadzone": "bool",  # True initially
            "last_position": {
                "x": "float",  # 0.0
                "y": "float"  # 0.0
            }
        }
    }
}
