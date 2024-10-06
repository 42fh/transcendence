import time
import asyncio
import random

class game_state():
    left_paddle = 0.0
    right_paddle = 0.0
    ball_x = 0.5
    ball_y = 0.5
    v_x = 0.01
    v_y = 0.02
    creation_time = 0.0
    left_ready = False
    right_ready = False
    game_running = False

    def __str__(self):
        return (str(self.left_paddle) + ', ' 
            + str(self.right_paddle) + ', ' 
            + str(self.ball_x) + ', ' 
            + str(self.ball_y) + ', ' 
            + str(self.creation_time))

def init_games():
    global game_array
    game_array = []

def add_game():
    game = game_state()
    game.creation_time = time.time()
    # global game_array
    game_array.append(game)

def createVar():
    global glob_int
    glob_int = 100


async def wiggle_ball():
    while True:
        # print("wiggle: going to sleep")
        await asyncio.sleep(3)
        # print("wiggle: waking up and changnig ball_x")
        game_array[0].ball_x += (0.1 * random.random() - 0.05)

async def update_game():
    while True:
        await asyncio.sleep(0.1)

        if (0 <= game_array[0].ball_x + game_array[0].v_x <= 1.0 and 
            0 <= game_array[0].ball_y + game_array[0].v_y <= 1.0):
            game_array[0].ball_x +=  game_array[0].v_x
            game_array[0].ball_y +=  game_array[0].v_y
        elif (0 <= game_array[0].ball_x + game_array[0].v_x <= 1.0 and
            not(0 <= game_array[0].ball_y + game_array[0].v_y <= 1.0)):
            game_array[0].ball_y + game_array[0].v_y
            if (game_array[0].ball_y < 0):
                game_array[0].ball_y += 1.0
            else:
                game_array[0].ball_y += -1.0
        elif (game_array[0].ball_x + game_array[0].v_x > 1.0 and
            abs(game_array[0].right_paddle - game_array[0].ball_y) < 0.1):
            game_array[0].v_x *= -1.0
        elif (game_array[0].ball_x + game_array[0].v_x < 0.0 and
            abs(game_array[0].left_paddle - game_array[0].ball_y) < 0.1):
            game_array[0].v_x *= -1.0
        else:
            print(game_array[0])
            game_array[0] = game_state()

        # if movement is collison free move

        # if collision is with top or bottom wall reflect

        # if collision is with left or right and corresponding paddle is presend, refelct

        # otherwise there is an error or no paddle: reset all vars
