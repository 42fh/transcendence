from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import CustomUser
from .models import Player


@receiver(post_save, sender=CustomUser)
def create_player_profile(sender, instance, created, **kwargs):
    """Create a Player instance for every new CustomUser"""
    if created:
        Player.objects.create(
            user=instance,
            # display_name will be None by default, and get_display_name will return username
        )
