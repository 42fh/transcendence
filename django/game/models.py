# Contains database tables
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    # OneToOneField - one user has one profile, CASCADE - if user is deleted, delete profile
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    # ManyToManyField - user can have many games
    games = models.ManyToManyField('Game', blank=True)
    friends = models.ManyToManyField('Profile', blank=True)
    
    def __str__(self):
        return self.user.username

class Game(models.Model):
    date = models.DateField()
    players = models.ManyToManyField(Profile, blank=True)
    duration = models.IntegerField()
    mode = models.ForeignKey(GameMode)
    # won_games = profile.games_won.all() - get all games won by profile
    winner = models.ForeignKey(Profile, related_name='games_won', null=True, blank=True)

    def __str__(self):
        return self.mode.name + ' ' + str(self.date)

class GameMode(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return self.name


