import json
import asyncio
import msgpack
import redis.asyncio as redis
import math
import time
import random
from channels.layers import get_channel_layer
from .method_decorators import *
from ..gamecordinator.GameCordinator import GameCordinator as GC      

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
    async def get_instance(cls, game_id, game_type):
        """ """
        try:
            if not game_type:
                raise ValueError("Game type must be provided for new games")
            
            # Create instance
            game_class = cls.get_game_class(game_type)
            instance = game_class(game_id)
            
            # get settings
            async with await GC.get_redis_binary(GC.REDIS_GAME_URL) as redis_game:
                raw_settings = redis_game.get(f"game_settings:{game_id}")
                if raw_settings:
                    game_settings = msgpack.unpackb(raw_settings)
                    instance.settings = game_settings
                else:
                    raise ValueError("Existing game found but no settings available")
        
            # Now initialize with settings in place
            await instance.initialize()

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
