import json
import time
import random

from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

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
    game_state["paddle_left"]  += (random.random() - 0.5) * scale     
    game_state['paddle_right'] += (random.random() - 0.5) * scale    
    game_state["ball_x"] += (random.random() - 0.5) * scale     
    game_state["ball_y"] += (random.random() - 0.5) * scale         
    return game_state

class EchoConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        print("message received: ", message)
        time_stamp = str(time.time())

        game_state = None
        redis_error = ""
        try:
            game_state = cache.get_or_set("game_state", random_game_state(300))
        except:
            redis_error = "redis is not available: "
        
        game_state = vary_game_state(game_state, 30)
        try:
            cache.set("game_state", game_state)
        except:
            pass

        self.send(text_data=json.dumps({
            "message": ("backend greets: " + redis_error + time_stamp),
            "game_state" : game_state,
        }))