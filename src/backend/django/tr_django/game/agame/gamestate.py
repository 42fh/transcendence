from .AGameManager import GameStateError
import msgpack

def verify_game_state(self, state):
    """
    Verify that game state matches unified structure.
    Raises GameStateError with detailed message if validation fails.
    """
    try:
        # Verify basic structure
        required_keys = ["balls", "paddles", "scores", "dimensions", "game_type"]
        missing_keys = [key for key in required_keys if key not in state]
        if missing_keys:
            raise GameStateError(f"Missing required keys: {', '.join(missing_keys)}")
        
        # Verify game type exists and matches registered type
        if state["game_type"] not in self._game_types:
            raise GameStateError(
                f"Invalid game type '{state['game_type']}'. "
                f"Must be one of: {', '.join(self._game_types.keys())}"
            )
        
        # Verify balls array and structure
        if not isinstance(state["balls"], list):
            raise GameStateError("'balls' must be a list")
        
        ball_keys = ["x", "y", "velocity_x", "velocity_y", "size"]
        for i, ball in enumerate(state["balls"]):
            missing_ball_keys = [key for key in ball_keys if key not in ball]
            if missing_ball_keys:
                raise GameStateError(
                    f"Ball {i} missing required keys: {', '.join(missing_ball_keys)}"
                )
                
            invalid_types = [
                key for key in ball_keys 
                if not isinstance(ball[key], float)
            ]
            if invalid_types:
                raise GameStateError(
                    f"Ball {i} has invalid types for keys: {', '.join(invalid_types)}. "
                    "All values must be float."
                )
            
        # Verify paddles array and structure
        if not isinstance(state["paddles"], list):
            raise GameStateError("'paddles' must be a list")
        
        paddle_keys = ["position", "active", "side_index"]
        paddle_types = {
            "position": float,
            "active": bool,
            "side_index": int
        }
        
        for i, paddle in enumerate(state["paddles"]):
            missing_paddle_keys = [key for key in paddle_keys if key not in paddle]
            if missing_paddle_keys:
                raise GameStateError(
                    f"Paddle {i} missing required keys: {', '.join(missing_paddle_keys)}"
                )
            
            for key, expected_type in paddle_types.items():
                if not isinstance(paddle[key], expected_type):
                    raise GameStateError(
                        f"Paddle {i}: '{key}' must be {expected_type.__name__}, "
                        f"got {type(paddle[key]).__name__}"
                    )
            
            if not 0 <= paddle["position"] <= 1:
                raise GameStateError(
                    f"Paddle {i}: position must be between 0 and 1, got {paddle['position']}"
                )
            
        # Verify scores
        if not isinstance(state["scores"], list):
            raise GameStateError("'scores' must be a list")
        
        if not all(isinstance(score, int) for score in state["scores"]):
            raise GameStateError("All scores must be integers")
        
        if len(state["scores"]) != len([p for p in state["paddles"] if p["active"]]):
            raise GameStateError(
                f"Number of scores ({len(state['scores'])}) must match "
                f"number of active paddles ({len([p for p in state['paddles'] if p['active']])})"
            )
        
        # Verify dimensions
        if not isinstance(state["dimensions"], dict):
            raise GameStateError("'dimensions' must be a dictionary")
            
        dimension_keys = ["paddle_length", "paddle_width"]
        missing_dim_keys = [key for key in dimension_keys if key not in state["dimensions"]]
        if missing_dim_keys:
            raise GameStateError(
                f"Dimensions missing required keys: {', '.join(missing_dim_keys)}"
            )
            
        invalid_dims = [
            key for key in dimension_keys 
            if not isinstance(state["dimensions"][key], float)
        ]
        if invalid_dims:
            raise GameStateError(
                f"Invalid dimension types for: {', '.join(invalid_dims)}. "
                "All dimensions must be float."
            )
        
        # Try msgpack serialization
        try:
            msgpack.packb(state)
        except Exception as e:
            raise GameStateError(f"State cannot be serialized: {str(e)}")
        
        return True

    except GameStateError:
        # Re-raise GameStateError to preserve the specific error message
        raise
    except Exception as e:
        # Catch any other unexpected errors
        raise GameStateError(f"Unexpected error validating game state: {str(e)}")

