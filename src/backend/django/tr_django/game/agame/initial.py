import asyncio
import msgpack
import redis.asyncio as redis
import random
import math


async def initialize(self, create_new=False):
    """Initialize game resources"""
    try:
        await self.setup_connections()
        self.num_sides = self.settings["sides"]
        self.num_paddles = self.settings["num_players"]
        self.game_mode = self.settings.get("mode")  # Get mode from settings
        self.game_shape = self.settings.get("shape")  # Get mode from settings
        self.score_mode = self.settings.get("score")
        self.active_sides = self.settings.get("players_sides")
        self.vertices = self.settings.get("vertices")
        self.scale = self.settings.get("scale")
        self.side_normals = self.settings.get("normals")        
        self.inner_boundary = self.settings.get("inner_boundary") 
        self.previous_movements  = self.settings.get("ballmovements")
        
    except Exception as e:
        print(f"Error in initialize: {e}")
        raise


        
