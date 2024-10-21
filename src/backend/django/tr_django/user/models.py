from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    # About User model: https://docs.djangoproject.com/en/5.1/ref/contrib/auth/#user-model
    # OneToOneField - one user has one player profile
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    level = models.IntegerField(default=1)
    player_picture = models.ImageField(upload_to="player_pics/", null=True, blank=True)

    friends = models.ManyToManyField("self", symmetrical=True, blank=True)
    friend_requests_sent = models.ManyToManyField(
        "self", symmetrical=False, related_name="friend_requests_received"
    )

    def add_friend(self, user_profile):
        if user_profile == self:
            raise ValueError("You cannot add yourself as a friend.")
        if not self.friends.filter(pk=user_profile.pk).exists():
            self.friends.add(user_profile)

    def send_friend_request(self, friend):
        if self == friend:
            raise ValueError("A user cannot send a friend request to themselves.")
        self.friend_requests_sent.add(friend)
        friend.friend_requests_received.add(self)

    def accept_friend_request(self, friend):
        if friend not in self.friend_requests_received.all():
            raise ValueError("No friend request from this user.")
        self.friends.add(friend)
        self.friend_requests_received.remove(friend)
        friend.friend_requests_sent.remove(self)

    def __str__(self):
        return self.user.username
