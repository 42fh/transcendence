from ..agame.AGameManager import AGameManager
import math
import random
import msgpack
import time


from method_decorators import ( 
    add_abstract_implementations, 
    add_overwriten_methods,
    add_setup,
    add_collision_verification_phase,
    add_collision_candidate_phase,
    add_ball_movement_tracking
    ) 



@add_ball_movement_tracking     # Tracks ball movement data
@add_collision_candidate_phase
@add_collision_verification_phase
@add_setup
@add_overwriten_methods      
@add_abstract_implementations
@AGameManager.register_game_type("polygon")
class PolygonPongGame(AGameManager):
    def __init__(self, game_id):
        super().__init__(game_id)
        self.num_sides = 4  # Default number of sides
        self.num_paddles = 2  # Default number of paddles
        self.vertices = None  # Will store calculated vertices
        self.active_sides = None  # Will store which sides have paddles
        self.side_normals = None  # Will store normal vectors for each side
        self.previous_movements = []   # Will be initialized after num_sides is set from settings
        self.game_mode = 'regular'  # Default mode
        # Initialize combo system
        self.hit_combo = 0
        self.last_hit_time = 0
        self.combo_timeout = 1.5  # seconds
        self.highest_recorded_speed = 0




    async def apply_game_settings(self):
        """Apply game-specific values from settings"""
        self.num_sides = self.settings['sides']
        self.num_paddles = self.settings['num_players']
        self.game_mode = self.settings.get('mode', 'regular')  # Get mode from settings
        self.active_sides = self.get_player_side_indices()
        self.initialize_ball_movements(self.settings.get('num_balls', 1))
        self.calculate_polygon_vertices()
        self.calculate_side_normals()
        await self.store_vertices(self.vertices)


    def get_game_type(self):
        return "polygon"

    




