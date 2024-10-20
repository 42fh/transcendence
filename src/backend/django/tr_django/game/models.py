from django.db import models
from user.models import UserProfile

# Explanation of `on_delete` Behavior:
# The `on_delete` argument is used in ForeignKey and OneToOneField relationships
# to specify what happens when the referenced object is deleted. Here are the options:
#
# - CASCADE: Deletes all related objects. For example, if a User is deleted,
#   the associated Player profile will also be deleted.
#
# - PROTECT: Prevents deletion of the referenced object if there are related objects.
#   For example, if a Player has related data, the User cannot be deleted until the Player is deleted.
#
# - SET_NULL: Sets the foreign key to NULL when the referenced object is deleted.
#   Requires `null=True` on the foreign key field.
#
# - SET_DEFAULT: Sets the foreign key to its default value when the referenced object is deleted.
#
# - SET(): Allows you to set the foreign key to a specified value when the referenced object is deleted.
#
# - DO_NOTHING: No action is taken when the referenced object is deleted, and you need to handle
#   the deletion manually, which may cause database integrity issues.
#
# These options are used to manage how related objects behave when their parent object is deleted.


class GameMode(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()

    def __str__(self):
        return self.name


class Game(models.Model):
    date = models.DateField()
    players = models.ManyToManyField(UserProfile)
    duration = models.IntegerField(blank=True, null=True)
    mode = models.ForeignKey(GameMode, on_delete=models.SET_NULL, null=True)
    # won_games = player.games_won.all() - get all games won by player
    winner = models.ForeignKey(
        UserProfile,
        related_name="games_won",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    def __str__(self):
        return f"{self.mode.name} on {self.date}"
