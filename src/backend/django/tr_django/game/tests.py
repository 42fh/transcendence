from django.test import TestCase
from django.utils import timezone
from .models import SingleGame, GameMode, Player
from users.models import CustomUser
import time


class GameModeTestCase(TestCase):
    def setUp(self):
        # Set up a GameMode instance for testing
        self.mode = GameMode.objects.create(
            name="Arcade", description="Fast-paced game mode with power-ups."
        )

    def test_creation(self):
        """Test that a GameMode instance is created correctly."""
        self.assertEqual(self.mode.name, "Arcade")
        self.assertEqual(self.mode.description, "Fast-paced game mode with power-ups.")

    def test_string_representation(self):
        """Test the string representation of GameMode."""
        self.assertEqual(str(self.mode), "Arcade")

    def test_update(self):
        """Test that a GameMode instance can be updated."""
        self.mode.name = "Classic"
        self.mode.description = "Traditional game mode without power-ups."
        self.mode.save()

        # Refresh from database to confirm update
        updated_mode = GameMode.objects.get(id=self.mode.id)
        self.assertEqual(updated_mode.name, "Classic")
        self.assertEqual(
            updated_mode.description, "Traditional game mode without power-ups."
        )

    def test_deletion(self):
        """Test that a GameMode instance can be deleted."""
        mode_id = self.mode.id
        self.mode.delete()

        # Check that the mode no longer exists in the database
        with self.assertRaises(GameMode.DoesNotExist):
            GameMode.objects.get(id=mode_id)


class LegacyGameAppTestsRefactored(TestCase):
    def setUp(self):
        # Create users for testing
        self.user = CustomUser.objects.create_user(
            username="testuser1", password="12345"
        )
        self.user_profile = CustomUser.objects.create_user(
            username="testuser2",
            password="testpass123",
        )

        # Create Player profiles linked to each CustomUser
        self.player1 = Player.objects.create(user=self.user, display_name="Player1")
        self.player2 = Player.objects.create(
            user=self.user_profile, display_name="Player2"
        )

        # Create a GameMode instance
        self.game_mode = GameMode.objects.create(
            name="Test mode", description="Test description"
        )

        # Create a SingleGame instance with a date and mode
        self.game = SingleGame.objects.create(
            date=timezone.now(),
            mode=self.game_mode,
            winner=self.player2,  # Set an initial winner
        )
        # Add players to the game
        self.game.players.set([self.player1, self.player2])

    def test_game_attributes(self):
        """Verify that game attributes are set correctly."""
        self.assertEqual(self.game.mode, self.game_mode)
        self.assertEqual(self.game.winner, self.player2)

    def test_game_players(self):
        """Verify players are correctly associated with the game."""
        players = self.game.players.all()
        self.assertEqual(players.count(), 2)
        self.assertIn(self.player1, players)
        self.assertIn(self.player2, players)


from django.test import TestCase
from users.models import CustomUser
from game.models import Player


class PlayerModelTest(TestCase):
    def setUp(self):
        # Create a CustomUser instance, which should automatically create a Player instance
        self.user = CustomUser.objects.create_user(
            username="testuser", password="password123"
        )
        self.player = Player.objects.get(
            user=self.user
        )  # Retrieve the associated Player instance

    def test_player_creation(self):
        """Test that a Player instance is created automatically when a CustomUser is created."""
        # Check that the player instance exists and is associated with the user
        self.assertIsNotNone(self.player)
        self.assertEqual(self.player.user, self.user)

    def test_initial_field_values(self):
        """Test that the Player instance has correct initial values for wins, losses, and display name."""
        self.assertEqual(self.player.wins, 0)
        self.assertEqual(self.player.losses, 0)
        self.assertIsNone(
            self.player.display_name
        )  # Assuming display name starts as None

    def test_update_wins_losses_display_name(self):
        """Test updating the wins, losses, and display name fields."""
        # Update wins, losses, and display_name
        self.player.wins = 5
        self.player.losses = 2
        self.player.display_name = "Champion123"
        self.player.save()

        # Retrieve the updated player and check values
        updated_player = Player.objects.get(user=self.user)
        self.assertEqual(updated_player.wins, 5)
        self.assertEqual(updated_player.losses, 2)
        self.assertEqual(updated_player.display_name, "Champion123")

    def test_delete_player(self):
        """Test that the Player instance can be deleted without affecting the associated CustomUser."""
        self.player.delete()
        # Check that player instance no longer exists
        with self.assertRaises(Player.DoesNotExist):
            Player.objects.get(user=self.user)
        # Ensure the CustomUser still exists
        self.assertTrue(CustomUser.objects.filter(username="testuser").exists())
