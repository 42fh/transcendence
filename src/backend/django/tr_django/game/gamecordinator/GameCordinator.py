import redis.asyncio as redis
import msgpack
import time
from typing import List, Dict, Optional, ....
import os

os.getenv('REDIS_URL', 'redis://redis:6379/1')



class Game:
   
        # game health keys
        self.recordet_key =  f"game_recordet:{game_id}" # bool default False 
        self.created_key = f"game_creation:{game_id}" # timestemp
        self.waiting_key = f"game_waiting:{game_id}" # bool default False
        self.running_key = f"game_running:{game_id}" # bool default False 
        self.finished_key = f"game_finished:{game_id}" # bool default False 
        
        # setting keys        
        self.state_key = f"game_state:{game_id}"
        self.paddles_key = f"game_paddles:{game_id}"
        self.vertices_key = f"game_vertices:{game_id}"  # New key for vertices

        # game_logic 
        self.players_key = f"game_players:{game_id}"
        self.booked_players_key = f"game_booked_players:{game_id}" 
 
        # key only for game      
        self.lock_key = f"game_lock:{game_id}"
        self.type_key = f"game_type:{game_id}"
        
            

class GameCordinator:
    """ creates new games and manages all waiting and running games """
    
    def __init__(self):
        
        # redis
        self.redis_conn = None # set by initialize
        # each redis dervice its own index self.redis_url = os.getenv('REDIS_URL', 'redis://redis:6379') + "/2" 
        self.redis_url = "redis://redis:6379" + "/2"        
        
        # logic
        self.waiting_games_timeout = 300 # 5 min timeout only for waiting games tournament game stay open till the tournament close it. 

        # games_key 
        self.all_games_key = f"all_games" # Game creation timestamp
        self.waiting_tournament_games_key  = f"waiting_tournament_games" # tournament games has fixed players not pubblic 
        self.waiting_games_key = "waiting_games" 
        self.running_games_key = "running_games"
        self.running_tournament_games_key  = "running_tournament_game"  
        self.finished_games_key = "finised_games" 
        self.finished_tournament_games_key = "finished_tournament_games"
        self.recordet_games_key = "recordet_games"
        
        # performance logging
        self.total_users_key = "total_users" 
        self.total_spectators_key = "total_spectators"
        self.total_players_key = "total_players"

  

    # API from client
    def create_new_game(self, settings:dict): -> int:game_id  
    

    # view     
    def get_waiting_games(self):

    def get_running_games(self):

    

    def get_detail_from_game(self, game_id:int):
    
    # from AGameManager with signals
    def join_game(self, game_id:int, player_id):

    def leave_game(self, game_id:int, player_id):
    


     
