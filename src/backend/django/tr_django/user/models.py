from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    # About User model: https://docs.djangoproject.com/en/5.1/ref/contrib/auth/#user-model
    # OneToOneField - one user has one player profile
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    level = models.IntegerField(default=1)
    player_picture = models.ImageField(upload_to='player_pics/', null=True, blank=True)
    friends = models.ManyToManyField('self', blank=True, symmetrical=True)

    def __str__(self):
        return self.user.username

    def add_friend(self, friend):
        if self == friend:
            raise ValueError("A user cannot add themselves as a friend.")
        self.friends.add(friend)
        