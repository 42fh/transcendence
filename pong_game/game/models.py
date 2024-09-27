from django.db import models

class Game(models.Model):
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
# Create your models here.
