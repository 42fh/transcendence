from django.db import models

# the game state, scores, start/end time, players involved, and the game status.
#class Match

# name, score, connection (if handling multiplayer over a network)...
#class Player

# paddle's position, speed, dimensions...
class Paddle(models.Model):
    #position_x = models.FloatField(default=0.0)  needed ?
    position_y = models.FloatField(default=0.0)
    height = models.FloatField(default=100.0)
    width = models.FloatField(default=10.0)

#  position, velocity, size
#class Ball

#what collided (paddle or wall), the position and time of the collision,  maybe  logic to calculate the new direction of the ball.
#class Collision

