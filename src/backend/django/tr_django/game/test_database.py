from .models import Game, GameMode, Player
from django.contrib.auth.models import User
from django.test import TestCase

# Native Django tests
# - automatically creates a temporary database
# - provides a test client that allows to simulate GET, POST, and other requests
# - has fixtures like pytest
# python manage.py test - to test


class DatabaseModelsTest(TestCase):
    def test_database(self):
        user = User.objects.create_user(username="testuser", password="12345")
        player = Player.objects.create(
            user=user, bio="Test bio", location="Test location", level=1
        )
        self.assertEqual(player.user.username, "testuser")
        self.assertEqual(player.bio, "Test bio")
        self.assertEqual(player.location, "Test location")
        self.assertEqual(player.level, 1)

        game_mode = GameMode.objects.create(
            name="Test mode", description="Test description"
        )
        self.assertEqual(game_mode.name, "Test mode")
        self.assertEqual(game_mode.description, "Test description")

        game = Game.objects.create(date="2024-10-07", mode=game_mode, winner=player)
        game.players.add(player)
        self.assertEqual(game.date, "2024-10-07")
        self.assertEqual(game.mode, game_mode)
        self.assertEqual(game.winner, player)
        self.assertEqual(game.players.first(), player)

        player.games.add(game)
        self.assertEqual(player.games.first(), game)
