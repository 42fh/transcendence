from django.test import TestCase
from django.utils import timezone
from .models import SingleGame, GameMode, Player
from users.models import CustomUser
from django.core.exceptions import ValidationError


class GameModeTestCase(TestCase):
    def setUp(self):
        """Set up basic game modes for testing"""
        self.classic_mode = GameMode.objects.create(
            name="Classic",
            description="Traditional 2D Pong",
            player_count=GameMode.TWO_PLAYER,
            ball_speed=1.0,
            paddle_size=1.0,
            number_of_balls=1,
            ball_size=1.0,
            perspective="2D",
            location="remote",
            power_ups_enabled="none",
            win_condition="points",
            winning_score=11,
            time_limit_seconds=60,
            allow_both_conditions=False,
        )

    def test_basic_crud_operations(self):
        """Test Create, Read, Update, Delete operations"""
        # Create (already done in setUp)
        self.assertEqual(GameMode.objects.count(), 1)

        # Read
        mode = GameMode.objects.get(name="Classic")
        self.assertEqual(mode.description, "Traditional 2D Pong")

        # Update
        mode.ball_speed = 1.5
        mode.save()
        updated_mode = GameMode.objects.get(name="Classic")
        self.assertEqual(float(updated_mode.ball_speed), 1.5)

        # Delete
        mode.delete()
        self.assertEqual(GameMode.objects.count(), 0)

    def test_player_count_validation(self):
        """Test player count validation rules"""
        # Test valid multiplayer
        valid_multiplayer = GameMode(
            name="Multi",
            description="Multiplayer mode",
            player_count=GameMode.MULTIPLAYER,
            exact_player_count=4,
            perspective="2D",
            location="remote",
            win_condition="points",
        )
        valid_multiplayer.full_clean()  # Should not raise

        # Test invalid multiplayer (no exact count)
        invalid_multiplayer = GameMode(
            name="Invalid Multi",
            description="Invalid multiplayer mode",
            player_count=GameMode.MULTIPLAYER,
            perspective="2D",
            location="remote",
            win_condition="points",
        )
        with self.assertRaises(ValidationError):
            invalid_multiplayer.full_clean()

        # Test two-player with exact count (should fail)
        invalid_two_player = GameMode(
            name="Invalid Two Player",
            description="Two player with exact count",
            player_count=GameMode.TWO_PLAYER,
            exact_player_count=2,
            perspective="2D",
            location="remote",
            win_condition="points",
        )
        with self.assertRaises(ValidationError):
            invalid_two_player.full_clean()

    def test_win_conditions(self):
        """Test different win condition configurations"""
        # Points only
        points_mode = GameMode.objects.create(
            name="Points Mode",
            description="Win by points",
            player_count=GameMode.TWO_PLAYER,
            perspective="2D",
            location="remote",
            win_condition="points",
            winning_score=21,
            time_limit_seconds=60,
            allow_both_conditions=False,
        )
        self.assertIn("Winning Score: 21", points_mode.describe_mode())

        # Time only
        time_mode = GameMode.objects.create(
            name="Time Mode",
            description="Win by time",
            player_count=GameMode.TWO_PLAYER,
            perspective="2D",
            location="remote",
            win_condition="time",
            winning_score=11,
            time_limit_seconds=300,
            allow_both_conditions=False,
        )
        self.assertIn("Time Limit: 300 seconds", time_mode.describe_mode())

        # Both conditions
        both_mode = GameMode.objects.create(
            name="Both Mode",
            description="Win by either condition",
            player_count=GameMode.TWO_PLAYER,
            perspective="2D",
            location="remote",
            win_condition="points",
            winning_score=15,
            time_limit_seconds=180,
            allow_both_conditions=True,
        )
        description = both_mode.describe_mode()
        self.assertIn("Winning Score: 15", description)
        self.assertIn("Time Limit: 180 seconds", description)
        self.assertIn("either condition", description.lower())

    def test_power_ups(self):
        """Test power-ups configurations"""
        mode_with_all = GameMode.objects.create(
            name="Power Mode",
            description="All power-ups",
            player_count=GameMode.TWO_PLAYER,
            perspective="2D",
            location="remote",
            power_ups_enabled="all",
            win_condition="points",
        )
        self.assertIn("Power-ups: All Power-Ups", mode_with_all.describe_mode())

    def test_game_config(self):
        """Test game configuration output"""
        config = self.classic_mode.get_game_config()

        self.assertEqual(config["ball_speed"], 1.0)
        self.assertEqual(config["paddle_size"], 1.0)
        self.assertEqual(config["number_of_balls"], 1)
        self.assertEqual(config["perspective"], "2D")
        self.assertEqual(config["power_ups"], "none")
        self.assertEqual(config["win_condition"]["type"], "points")
        self.assertEqual(config["win_condition"]["points"], 11)
        self.assertFalse(config["win_condition"]["allow_both"])

    def test_perspective_and_location_combinations(self):
        """Test different perspective and location combinations"""
        # 2D Local
        GameMode.objects.create(
            name="2D Local",
            description="2D Local game",
            player_count=GameMode.TWO_PLAYER,
            perspective="2D",
            location="local",
            win_condition="points",
        )

        # 3D Remote
        GameMode.objects.create(
            name="3D Remote",
            description="3D Remote game",
            player_count=GameMode.TWO_PLAYER,
            perspective="3D",
            location="remote",
            win_condition="points",
        )

        modes_2d = GameMode.objects.filter(perspective="2D").count()
        modes_3d = GameMode.objects.filter(perspective="3D").count()
        modes_local = GameMode.objects.filter(location="local").count()
        modes_remote = GameMode.objects.filter(location="remote").count()

        self.assertEqual(modes_2d, 2)  # Including classic mode from setUp
        self.assertEqual(modes_3d, 1)
        self.assertEqual(modes_local, 1)
        self.assertEqual(modes_remote, 2)  # Including classic mode from setUp

    def test_description_format(self):
        """Test the format and content of the mode description"""
        description = self.classic_mode.describe_mode()

        # Check all sections are present
        required_sections = [
            "Classic:",
            "Perspective: 2D",
            "Player Count: Two Player",
            "Location: Remote",
            "Ball Speed: 1.0",
            "Paddle Size: 1.0",
            "Ball Size: 1.0",
            "Number of Balls: 1",
            "Power-ups: None",
            "Win Condition: Play to Points",
            "Winning Score: 11",
        ]

        for section in required_sections:
            self.assertIn(section, description)


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


class PlayerStatsTest(TestCase):
    def setUp(self):
        # Create a CustomUser and associated Player instance
        self.user = CustomUser.objects.create_user(
            username="testuser", password="password123"
        )
        self.player = Player.objects.get(user=self.user)

    def test_update_stats_wins(self):
        """Test that the update_stats method correctly increments wins when a player wins a game."""
        # Increment wins twice
        self.player.update_stats(won=True)
        self.player.update_stats(won=True)

        self.assertEqual(self.player.wins, 2)
        self.assertEqual(self.player.losses, 0)

    def test_update_stats_losses(self):
        """Test that the update_stats method correctly increments losses when a player loses a game."""
        # Increment losses twice
        self.player.update_stats(won=False)
        self.player.update_stats(won=False)

        self.assertEqual(self.player.wins, 0)
        self.assertEqual(self.player.losses, 2)

    def test_win_ratio_calculation(self):
        """Test that the win_ratio method returns the correct ratio."""
        # Case with no games (0 wins and 0 losses)
        self.assertEqual(self.player.win_ratio(), 0)

        # Add wins and losses and test ratio
        self.player.update_stats(won=True)  # 1 win
        self.player.update_stats(won=True)  # 2 wins
        self.player.update_stats(won=False)  # 1 loss
        self.assertAlmostEqual(self.player.win_ratio(), 2 / 3)

    def test_win_ratio_all_losses(self):
        """Test that win_ratio is 0 if player has only losses."""
        # Add losses
        self.player.update_stats(won=False)
        self.player.update_stats(won=False)

        self.assertEqual(self.player.win_ratio(), 0)

    def test_win_ratio_all_wins(self):
        """Test that win_ratio is 1 if player has only wins."""
        # Add wins
        self.player.update_stats(won=True)
        self.player.update_stats(won=True)

        self.assertEqual(self.player.win_ratio(), 1)
