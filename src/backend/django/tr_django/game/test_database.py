from .models import Game, GameMode, UserProfile
from django.contrib.auth.models import User
from django.test import TestCase

# Native Django tests
# - automatically creates a temporary database 
# - provides a test client that allows to simulate GET, POST, and other requests
# - has fixtures like pytest 
# python manage.py test - to test

class GameAppTests(TestCase):
    def test_game_related_models(self):
        user = User.objects.create_user(username='testuser', password='12345')

        user_profile = UserProfile.objects.create(
            user=user, bio="Test bio", location="Test location", level=1
        )

        game_mode = GameMode.objects.create(
            name="Test mode", description="Test description"
        )

        game = Game.objects.create(
            date="2024-10-07", mode=game_mode, winner=user_profile
        )
        game.players.add(user_profile)

        self.assertEqual(game.date, "2024-10-07")
        self.assertEqual(game.mode, game_mode)
        self.assertEqual(game.winner, user_profile)
        self.assertEqual(game.players.first(), user_profile)