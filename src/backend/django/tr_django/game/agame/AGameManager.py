import json
import asyncio
import msgpack
import redis.asyncio as redis
import math
import time
import random
from channels.layers import get_channel_layer
from .method_decorators import *


class GameStateError(Exception):
    """Custom exception for game state validation errors"""

    pass


@add_redis
@add_player
@add_paddle
@add_initial
@add_gamestate  # Validation layer (most specific)
@add_event_flow  # Event system
@add_game_physics  # Physics engine
@add_game_logic  # Core game rules
@add_game_flow  # Game state management
@add_cls_methods
class AGameManager:

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

        # game physic
        self.outer_boundary = float(1.0)
        self.inner_boundary = None
        self.scale =float(1.0)        


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
            redis_conn = await redis.Redis.from_url(
                "redis://redis:6379/1", decode_responses=True
            )  # Use string decoding for type retrieval

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
                redis_bin = await redis.Redis.from_url(
                    "redis://redis:6379/1", decode_responses=False
                )
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
                        "num_players": 2,
                        "num_balls": 1,
                        "min_players": 2,
                        "sides": 4,
                        "paddle_length": 0.3,
                        "paddle_width": 0.2,
                        "ball_size": 0.1,
                        "initial_ball_speed": 0.006,
                        "mode": "regular",
                    }
                    print("set default game settings.")  # debug

                # Store settings in Redis before initialization
                redis_bin = await redis.Redis.from_url(
                    "redis://redis:6379/1", decode_responses=False
                )
                await redis_bin.set(f"game_settings:{game_id}", msgpack.packb(settings))
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

    @property
    async def running(self):
        """Check if game is running"""
        try:
            running = await self.redis_conn.get(self.running_key)
            return running == b"1"
        except Exception as e:
            print(f"Error checking running state: {e}")
            return False







    async  def apply_game_settings(self):
        """Method to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement this method")

    def get_game_type(self):
        """Method to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement this method")

    # game_logic

    # Setup
    def calculate_inner_boundaries(self):
        """Method to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement this method")

    # Movement Phase
    # no method in Baseclass

    # Boundary Phase
    # no method in Baseclass

    # Collision Candidate Phase
    def  find_collision_candidate(ball, ball_index, new_state, distance_from_center):
        """Method to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement this method")
    # Collision Verification Phase

    def handle_tunneling(self, ball, sector_info, state):
        """Method to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement this method")

    def handle_paddle(self, ball, current_sector, state):
        """Method to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement this method")
#
    def handle_wall(self, ball, current_sector, state):
        """Method to be implemented by subclasses"""
        raise NotImplementedError("Subclasses must implement this method")
