from django.db import models

class Game(models.Model):
	Player1_score = models.IntegerField(default=0)
	Player2_score = models.IntegerField(default=0)