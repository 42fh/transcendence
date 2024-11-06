from abc import ABC, abstractmethod
import json
import asyncio
import msgpack
import redis.asyncio as redis
import math
import random
from channels.layers import get_channel_layer

class GameStateError(Exception):
    """Custom exception for game state validation errors"""
    pass


class AGameManager(ABC):

    _game_types = {}

    def __init__(self, game_id):
        self.game_id = game_id
        self.redis_conn = None
        self.channel_layer = None
        
        # Redis keys
        self.state_key = f"game_state:{game_id}"
        self.players_key = f"game_players:{game_id}"
        self.running_key = f"game_running:{game_id}"
        self.settings_key = f"game_settings:{game_id}"
        self.paddles_key = f"game_paddles:{game_id}"
        self.lock_key = f"game_lock:{game_id}"
        self.type_key = f"game_type:{game_id}"
        self.vertices_key = f"game_vertices:{game_id}"  # New key for vertices

    @classmethod
    def register_game_type(cls, game_type_name):
        """Decorator to register game types"""
        def decorator(subclass):
            cls._game_types[game_type_name] = subclass
            return subclass
        return decorator

    @classmethod
    def get_game_class(cls, game_type: str):
        """Get the class for a specific game type"""
        if game_type not in cls._game_types:
            raise ValueError(f"Unknown game type: {game_type}")
        return cls._game_types[game_type]

     
    @classmethod
    async def get_instance(cls, game_id, game_type=None, settings=None):
        """Process-safe get_instance with game type and settings support"""
        try:
            redis_conn =await redis.Redis.from_url( 'redis://redis:6379/1', decode_responses=True)  # Use string decoding for type retrieval
            
            # Try to get existing game type from Redis
            stored_type = await redis_conn.get(f"game_type:{game_id}")


            # If no stored type and no provided type, raise error
            if not stored_type and not game_type:
                raise ValueError("Game type must be provided for new games")
            
            # Use provided type for new games, otherwise use stored type
            final_game_type = game_type if not stored_type else stored_type
            
            # Get the appropriate game class
            final_game_type = str(final_game_type)            
            game_class = cls.get_game_class(final_game_type)
            # Create instance
            instance = game_class(game_id)
            exists = await redis_conn.exists(f"game_state:{game_id}")
            if exists:
                # Load existing settings from Redis
                redis_bin = await redis.Redis.from_url( 'redis://redis:6379/1', decode_responses=False)
                stored_settings = await redis_bin.get(f"game_settings:{game_id}")
                stored_vertices = await redis_bin.get(f"game_vertices:{game_id}")
                await redis_bin.close()
                if stored_settings:
                    game_settings = msgpack.unpackb(stored_settings)
                    instance.settings = game_settings
                else:
                    raise ValueError("Existing game found but no settings available")
                if stored_vertices:
                    instance.vertices = msgpack.unpackb(stored_vertices)
            else:
                # New game - prepare and store settings first
                if not settings:
                    # Use default settings if none provided
                    settings = {
                        'num_players': 2,
                        'num_balls': 1,
                        'min_players': 2,
                        'sides': 4 if final_game_type == "polygon" else None,
                        'paddle_length': 0.3,
                        'paddle_width': 0.2,
                        'ball_size': 0.1,
                        'initial_ball_speed': 0.006,
                        'mode': 'regular'
                    }
                    print("set default game settings.") # debug
                
                # Store settings in Redis before initialization
                redis_bin = await redis.Redis.from_url( 'redis://redis:6379/1', decode_responses=False)
                await redis_bin.set(
                    f"game_settings:{game_id}",
                    msgpack.packb(settings)
                )
                await redis_bin.close()
                # Store game type if this is a new game
                await redis_conn.set(f"game_type:{game_id}", game_type)
                
                # Store settings in instance
                instance.settings = settings
            
            # Now initialize with settings in place
            await instance.initialize(create_new=not exists)
            
            
            await redis_conn.close()
            return instance
            
        except Exception as e:
            print(f"Error in get_instance: {e}")
            raise

    async def store_vertices(self, vertices):
        """Store vertices in Redis"""
        if self.redis_conn:
            try:
                await self.redis_conn.set(
                    self.vertices_key,
                    msgpack.packb(vertices)
                )
                return True
            except Exception as e:
                print(f"Error storing vertices: {e}")
                return False
        return False

    async def get_vertices(self):
        """Retrieve vertices from Redis"""
        if self.redis_conn:
            try:
                vertices_data = await self.redis_conn.get(self.vertices_key)
                if vertices_data:
                    return msgpack.unpackb(vertices_data)
            except Exception as e:
                print(f"Error retrieving vertices: {e}")
        return None


    async def _setup_connections(self):
        """Set up Redis and channel layer connections"""
        self.redis_conn = redis.Redis.from_url('redis://redis:6379/1',decode_responses=False )
        self.channel_layer = get_channel_layer()




    async def initialize(self, create_new=False):
        """Initialize game resources"""
        try:
            await self._setup_connections()
            await self.apply_game_settings() # with this line each instance has the values from states in the instance. 
            if create_new:
               await self._initialize_new_game()
        except Exception as e:
            print(f"Error in initialize: {e}")
            raise

    async def _initialize_new_game(self):
        """Initialize a new game with settings"""
        try:
            # Verify settings exist
            if not hasattr(self, 'settings'):
                raise ValueError("Settings must be set before initialization")
            
            # Create and store initial game state
            initial_state = self.create_initial_state()
            await self.redis_conn.set(
                self.state_key,
                msgpack.packb(initial_state)
            )
            
            # Set game as not running
            await self.redis_conn.set(self.running_key, b"0")
            
            # Setup paddle positions
            paddle_positions = {
                str(i): msgpack.packb({"position": 0.5})
                for i in range(self.settings['num_players'])
            }
            await self.redis_conn.hset(self.paddles_key, mapping=paddle_positions)
            
        except Exception as e:
            print(f"Error initializing new game: {e}")
            raise

    def create_initial_state(self):
        """Create initial game state based on settings"""
        try:
            # Initialize ball(s) with random direction
            balls = []
            num_balls = self.settings.get('num_balls', 1)
            ball_size = self.settings.get('ball_size', 0.1)
            initial_speed = self.settings.get('initial_ball_speed', 0.006)
            
            for _ in range(num_balls):
                angle = random.uniform(0, 2 * math.pi)
                balls.append({
                    "x": float(0),
                    "y": float(0),
                    "velocity_x": float(initial_speed * math.cos(angle)),
                    "velocity_y": float(initial_speed * math.sin(angle)),
                    "size": float(ball_size)
                })

            # Initialize paddles based on game type
            paddles = []
            if self.get_game_type() == "polygon":
                spacing = math.floor(self.num_sides / self.num_paddles)
                active_paddle_count = 0
                
                for side_index in range(self.num_sides):
                    is_active = False
                    for i in range(min(self.num_paddles, self.num_sides)):
                        if side_index == (i * spacing) % self.num_sides:
                            is_active = True
                            active_paddle_count += 1
                            break
                    
                    paddles.append({
                        "position": float(0.5),
                        "active": is_active,
                        "side_index": side_index
                    })
                score_count = active_paddle_count
                
            elif self.get_game_type() == "circular":
                for i in range(self.num_players):
                    paddles.append({
                        "position": float(0.5),
                        "active": True,
                        "side_index": i
                    })
                score_count = self.num_players

            state = {
                "balls": balls,
                "paddles": paddles,
                "scores": [int(0)] * score_count,
                "dimensions": {
                    "paddle_length": float(self.settings.get('paddle_length', 0.3)),
                    "paddle_width": float(self.settings.get('paddle_width', 0.2))
                },
                "game_type": self.get_game_type()
            }
            
            return state

        except Exception as e:
            print(f"Error in create_initial_state: {e}")
            # Return minimal valid state as fallback
            return {
                "balls": [{
                    "x": float(0),
                    "y": float(0),
                    "velocity_x": float(0),
                    "velocity_y": float(0),
                    "size": float(0.05)
                }],
                "paddles": [{
                    "position": float(0.5),
                    "active": True,
                    "side_index": 0
                }],
                "scores": [0],
                "dimensions": {
                    "paddle_length": float(0.3),
                    "paddle_width": float(0.2)
                },
                "game_type": self.get_game_type()
            }



    async def acquire_lock(self, timeout=1.0):
        """Acquire distributed lock"""
        return await self.redis_conn.set(
            self.lock_key,
            b"1",
            nx=True,
            ex=int(timeout)
        )

    async def release_lock(self):
        """Release distributed lock"""
        await self.redis_conn.delete(self.lock_key)

    async def update_paddle(self, player_index, position):
        """Update paddle position atomically"""
        try:
            position = float(max(0, min(1, position)))
            try:
                packed_data = msgpack.packb({"position": position})
                await self.redis_conn.hset(
                    self.paddles_key,
                    str(player_index),
                    packed_data
                )
                return True
            except msgpack.PackException as e:
                print(f"Error packing paddle data: {e}")
                return False
        except Exception as e:
            print(f"Error updating paddle: {e}")
            return False



    async def get_paddle_positions(self):
        """Get all paddle positions atomically"""
        try:
            positions = await self.redis_conn.hgetall(self.paddles_key)
            return {
                int(idx): msgpack.unpackb(pos_data)["position"]
                for idx, pos_data in positions.items()
            }
        except Exception as e:
            print(f"Error getting paddle positions: {e}")
            return {}

    async def add_player(self, player_id):
        """Add player with process-safe checks"""
        try:
            settings = msgpack.unpackb(await self.redis_conn.get(self.settings_key))
            max_players = settings.get('num_players', 2)
            
            # Check if player exists
            if await self.redis_conn.sismember(self.players_key, str(player_id)):
                player_data = await self.get_player_data(player_id)
                return player_data if player_data else False
            
            # Check if game is full
            current_count = await self.redis_conn.scard(self.players_key)
            if current_count >= max_players:
                return False
            
            # Add player atomically
            if await self.redis_conn.sadd(self.players_key, str(player_id)):
                # Initialize player data
                player_data = {
                    'index': current_count,
                    'position': 0.5,
                    'settings': settings.get('player_settings', {})
                }
                return player_data
                
            return False
            
        except Exception as e:
            print(f"Error adding player: {e}")
            return False

    async def remove_player(self, player_id):
        """Remove player with process-safe cleanup"""
        try:
            if await self.redis_conn.srem(self.players_key, str(player_id)):
                remaining = await self.redis_conn.scard(self.players_key)
                
                settings = msgpack.unpackb(await self.redis_conn.get(self.settings_key))
                min_players = settings.get('min_players', 2)
                
                if remaining < min_players:
                    await self.end_game()
                elif remaining == 0:
                    # Clean up game
                    await self.redis_conn.delete(
                        self.state_key,
                        self.players_key,
                        self.running_key,
                        self.settings_key,
                        self.paddles_key,
                        self.lock_key
                    )
                return True
            return False
            
        except Exception as e:
            print(f"Error removing player: {e}")
            return False


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

    async def update_game(self):
        """Process-safe game update with enhanced error handling"""
        if not await self.acquire_lock():
            return False

        try:
            # Get current state with error handling
            try:
                state_data = await self.redis_conn.get(self.state_key)
                current_state = msgpack.unpackb(state_data) if state_data else None
            except msgpack.UnpackException as e:
                print(f"Error unpacking game state: {e}")
                await self.channel_layer.group_send(
                    f"game_{self.game_id}",
                    {
                        "type": "error",
                        "error": "Game state corruption detected",
                        "details": str(e)
                    }
                )
                return False
                
            if not current_state:
                await self.channel_layer.group_send(
                    f"game_{self.game_id}",
                    {
                        "type": "error",
                        "error": "Game state not found",
                    }
                )
                return False
            
            # Verify state before proceeding
            try:
                self.verify_game_state(current_state)
            except GameStateError as e:
                print(f"Game state validation error: {e}")
                await self.channel_layer.group_send(
                    f"game_{self.game_id}",
                    {
                        "type": "error",
                        "error": "Invalid game state detected",
                        "details": str(e)
                    }
                )
                return False

            # Update paddle positions in state
            paddle_positions = await self.get_paddle_positions()
            active_paddle_count = 0
            for paddle in current_state['paddles']:
                if paddle['active']:
                    paddle['position'] = paddle_positions.get(active_paddle_count, 0.5)
                    active_paddle_count += 1 
            # Run game logic
            new_state, game_over = await self.game_logic(current_state)
            
            # Verify new state
            try:
                self.verify_game_state(new_state)
            except GameStateError as e:
                print(f"New game state validation error: {e}")
                await self.channel_layer.group_send(
                    f"game_{self.game_id}",
                    {
                        "type": "error",
                        "error": "Game logic produced invalid state",
                        "details": str(e)
                    }
                )
                return False
            
            # Save new state
            try:
                packed_state = msgpack.packb(new_state)
                await self.redis_conn.set(self.state_key, packed_state)
            except Exception as e:
                print(f"Error saving game state: {e}")
                await self.channel_layer.group_send(
                    f"game_{self.game_id}",
                    {
                        "type": "error",
                        "error": "Failed to save game state",
                        "details": str(e)
                    }
                )
                return False
            
            # Broadcast update
            winner = self.check_winner(new_state['scores']) if game_over else None
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "game_finished" if game_over else "game_state",
                    "game_state": new_state,
                    "winner": winner
                }
            )
            
            return game_over
            
        except Exception as e:
            print(f"Error in update_game: {e}")
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "error",
                    "error": "Game update failed",
                    "details": str(e)
                }
            )
            return False
            
        finally:
            await self.release_lock()
    
    async def start_game(self):
        """Start game with process-safe checks"""
        settings = msgpack.unpackb(await self.redis_conn.get(self.settings_key))
        min_players = settings.get('min_players', 2)
        
        while True:
            player_count = await self.redis_conn.scard(self.players_key)
            if player_count >= min_players:
                break
            print(f"Waiting for players... ({player_count}/{min_players})")
            await asyncio.sleep(1)
        
        await self.redis_conn.set(self.running_key, b"1")
        
        while await self.redis_conn.get(self.running_key) == b"1":
            game_over = await self.update_game()
            if game_over:
                await self.end_game() # can be sync not async !
                break
            await asyncio.sleep(0.016)  # ~60 FPS

    async def end_game(self):
        """End game with process-safe cleanup"""
        try:
            await self.redis_conn.set(self.running_key, b"0")
            
            # Keep game state briefly for end-game display
            for key in [self.state_key, self.players_key, self.settings_key, 
                       self.paddles_key, self.running_key,self.settings_key, self.lock_key, self.type_key]:
                # await self.redis_conn.expire(key, 300)  # 5 minute expiry
                await self.redis_conn.expire(key, 1)  # 1 sec expiry
            
            print(f"Game {self.game_id} has ended.")
            
        except Exception as e:
            print(f"Error ending game: {e}")
    
    def check_winner(self, scores, win_threshold=11):
        max_score = max(scores)
        if max_score >= win_threshold:
            # Find all players with max score
            return [i for i, score in enumerate(scores) if score == max_score]
        return []

    def reset_ball(self, ball, speed=0.006):
        """
        Reset ball to center with random direction
        Args:
            ball (dict): Ball object to reset
            speed (float): Initial ball speed
        Returns:
            dict: Updated ball object
        """
        angle = random.uniform(0, 2 * math.pi)
        ball.update({
            "x": float(0),
            "y": float(0),
            "velocity_x": float(speed * math.cos(angle)),
            "velocity_y": float(speed * math.sin(angle))
        })
        return ball


    
    def apply_ball_bounce_effect(self, ball, normal, offset=0, speed_multiplier=1.05):
        """
        Apply bounce effect to ball including reflection and speed increase
        Args:
            ball (dict): Ball object
            normal (dict): Normal vector of collision
            offset (float): Normalized offset from center (-1 to 1)
            speed_multiplier (float): Speed increase factor
        Returns:
            dict: Updated ball velocities
        """
        # Calculate reflection
        dot_product = (ball["velocity_x"] * normal["x"] + 
                      ball["velocity_y"] * normal["y"])
        
        reflected_x = ball["velocity_x"] - 2 * dot_product * normal["x"]
        reflected_y = ball["velocity_y"] - 2 * dot_product * normal["y"]
        
        # Apply angle modification based on offset
        angle_mod = offset * math.pi * 0.25
        cos_mod = math.cos(angle_mod)
        sin_mod = math.sin(angle_mod)
        
        final_x = reflected_x * cos_mod - reflected_y * sin_mod
        final_y = reflected_x * sin_mod + reflected_y * cos_mod
        
        # Apply speed increase
        current_speed = math.sqrt(ball["velocity_x"]**2 + ball["velocity_y"]**2)
        new_speed = current_speed * speed_multiplier
        # Limit speed to 80% of ball size to prevent tunneling
        MAX_SPEED = ball["size"] * 0.8
        if new_speed > MAX_SPEED:
            scale = MAX_SPEED / new_speed
            final_x *= scale
            final_y *= scale       
 
        return {
            "velocity_x": (final_x),
            "velocity_y": (final_y)
        }

    def update_scores(self, current_scores, failed_player_index):
        """
        Update scores when a player fails to hit the ball
        Args:
            current_scores (list): Current scores
            failed_player_index (int): Index of player who missed
        Returns:
            list: Updated scores
        """
        return [
            score + (1 if i != failed_player_index else 0)
            for i, score in enumerate(current_scores)
            ]

    @property
    async def running(self):
        """Check if game is running"""
        try:
            running = await self.redis_conn.get(self.running_key)
            return running == b"1"
        except Exception as e:
            print(f"Error checking running state: {e}")
            return False



    @abstractmethod
    async def game_logic(self, current_state): pass

    @abstractmethod
    def get_game_type(self): pass

    @abstractmethod 
    async  def apply_game_settings(self): pass
