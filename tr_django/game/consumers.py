import json
import time
import random
from dataclasses import asdict


from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

from game import game_state

# dummy function
def random_game_state(scale):
    game_state = {
        "paddle_left" : random.random() * scale,
        "paddle_right": random.random() * scale,
        "ball_x":       random.random() * scale,
        "ball_y":       random.random() * scale,
    }
    return game_state

def vary_game_state(game_state, scale):
    try: 
        game_state['paddle_left']  += (random.random() - 0.5) * scale     
        game_state['paddle_right'] += (random.random() - 0.5) * scale    
        game_state['ball_x'] += (random.random() - 0.5) * scale     
        game_state['ball_y'] += (random.random() - 0.5) * scale         
        return game_state
    except:
        return None
    
def add_noise(gs, amount):
    gs.ball[0] += (random.random() - 0.5) * amount
    return gs

class EchoConsumer(WebsocketConsumer):
    def connect(self):
        self.unique_game_id = self.scope["url_route"]["kwargs"]["unique_game_id"]
        print("self.unique_game_id ", self.unique_game_id)
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        # message = text_data_json["message"]
        print("json received: ", text_data_json)
        time_stamp = str(time.time())

        gs = None
        try:
            gs = cache.get(self.unique_game_id)
        except:
            self.send(text_data="Error: failed to get state from redis")
            self.close()

        print("gs is\n", str(gs))
        # game_state = vary_game_state(game_state, 30)
        # game_state = add_noise(game_state, 0.1)

        try:
            cache.set(self.unique_game_id, gs)
        except:
            self.send(text_data="Error: failed to set state to redis")
            self.close()

        message = {
            "message": "backend greets: 1729343754.7230139",
            "game_state": asdict(gs)
        }
        json_message = json.dumps(message)

        self.send(text_data=json_message)