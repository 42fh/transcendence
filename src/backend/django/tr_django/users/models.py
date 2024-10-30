from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """
    The ExtendedUser model extends Django's AbstractUser with additional fields for the user app.
    """

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    telephone_number = models.CharField(max_length=20, null=True, blank=True)
    pronoun = models.CharField(max_length=20, null=True, blank=True)

    STATUS_OFFLINE = "offline"
    STATUS_ONLINE = "online"
    STATUS_BUSY = "busy"
    STATUS_AWAY = "away"

    ONLINE_STATUS_CHOICES = [
        (status, status.capitalize())
        for status in [STATUS_OFFLINE, STATUS_ONLINE, STATUS_BUSY, STATUS_AWAY]
    ]
    online_status = models.CharField(
        max_length=10, choices=ONLINE_STATUS_CHOICES, default=STATUS_OFFLINE
    )

    default_status = models.CharField(
        max_length=10,
        choices=[STATUS_OFFLINE, STATUS_AWAY],
        default=STATUS_OFFLINE,
    )

    VISIBILITY_NONE = "none"
    VISIBILITY_FRIENDS = "friends"
    VISIBILITY_EVERYONE = "everyone"
    VISIBILITY_CUSTOM = "custom"

    VISIBILITY_CHOICES = [
        (visibility, visibility.capitalize())
        for visibility in [
            VISIBILITY_NONE,
            VISIBILITY_FRIENDS,
            VISIBILITY_EVERYONE,
            VISIBILITY_CUSTOM,
        ]
    ]
    visibility = models.CharField(
        max_length=10, choices=VISIBILITY_CHOICES, default=VISIBILITY_FRIENDS
    )

    custom_visibility_group = models.ForeignKey(
        "VisibilityGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users_with_custom_visibility",
    )

    friends = models.ManyToManyField("self", blank=True, related_name="friends_of")
    blocked_users = models.ManyToManyField(
        "self", blank=True, related_name="blocked_by"
    )

    def is_friend_with(self, user) -> bool:
        return self.friends.filter(id=user.id).exists()

    def is_blocked_by(self, user) -> bool:
        return self.blocked_users.filter(id=user.id).exists()

    def __str__(self):
        return self.username
