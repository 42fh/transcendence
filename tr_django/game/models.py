from django.db import models
from django.contrib.auth.models import User

# CASCADE	Delete all related objects.
# PROTECT	Prevent deletion of the referenced object if it has related objects.
# SET_NULL	Set the foreign key to NULL when the referenced object is deleted.
# SET_DEFAULT	Set the foreign key to its default value when the referenced object is deleted.
# SET()	Set the foreign key to a specified value when the referenced object is deleted.
# DO_NOTHING	Do nothing when the referenced object is deleted (manual handling required).

class Player(models.Model):
    # OneToOneField - one user has one player profile, CASCADE - if user is deleted, delete player
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    # Have to use pillow for images
    # player_picture = models.ImageField(upload_to='player_pics/', null=True, blank=True)
    # ManyToManyField - user can have many games
    games = models.ManyToManyField('Game', blank=True)
    friends = models.ManyToManyField('Player', blank=True)
    
    def __str__(self):
        return self.user.username

class GameMode(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return self.name

class Game(models.Model):
    date = models.DateField()
    players = models.ManyToManyField(Player, blank=True, null=True)
    duration = models.IntegerField(blank=True, null=True)
    mode = models.ForeignKey(GameMode, on_delete=models.SET_NULL, null=True)
    # won_games = player.games_won.all() - get all games won by player
    winner = models.ForeignKey(Player, related_name='games_won', null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.mode.name + ' ' + str(self.date)

