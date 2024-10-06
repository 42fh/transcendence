import json

from channels.generic.websocket import WebsocketConsumer
import sometext.globalvar
from sometext.globalvar import game_state
import random

class echoConsumer(WebsocketConsumer):
    def connect(self):
        sometext.globalvar.init_games()
        sometext.globalvar.add_game()
        # sometext.globalvar.wiggle_ball() # async function that just keeps running
        self.accept()

    def disconnect(self, second_arg):
        print(self.__str__())

    def receive(self, text_data):
        if (text_data == "ping"):
            self.send(text_data=str(sometext.globalvar.game_array[0]))
            return

        obj = json.loads(text_data)
        print(obj)

        if (sometext.globalvar.game_array[0].left_ready and 
            sometext.globalvar.game_array[0].right_ready and 
            (sometext.globalvar.game_array[0].game_running == False) ):
            print("=== GAME START ===")
            # sometext.globalvar.update_game()
            sometext.globalvar.game_array[0].game_running = True

        # Randomly move ball
        # sometext.globalvar.game_array[0].ball_x += (0.05 * random.random() - 0.025)
        # sometext.globalvar.game_array[0].ball_y += (0.05 * random.random() - 0.025)
        
        if (obj['direction'] == "left"):
            sometext.globalvar.game_array[0].left_ready = True
            if obj['key'] == 'j':
                sometext.globalvar.game_array[0].left_paddle += 0.1
            elif obj['key'] == 'k':
                sometext.globalvar.game_array[0].left_paddle -= 0.1
            else:
                print("Error: ", obj)
        elif (obj['direction'] == "right"):
            sometext.globalvar.game_array[0].right_ready = True
            if obj['key'] == 'j':
                sometext.globalvar.game_array[0].right_paddle += 0.1
            elif obj['key'] == 'k':
                sometext.globalvar.game_array[0].right_paddle -= 0.1
            else:
                print("Error: ", obj)
        else:
            print("Error! obj = ", obj)
        self.send(text_data=str(sometext.globalvar.game_array[0]))
