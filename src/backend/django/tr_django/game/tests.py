from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from .models import (
    SingleGame,
    GameMode,
    Player,
    PlayerGameStats,
    Tournament,
    TournamentGame,
    TournamentGameSchedule,
)
from users.models import CustomUser
from django.core.exceptions import ValidationError
from django.urls import reverse
import uuid
from unittest.mock import patch
import json
from .services.tournament_service import build_tournament_data, build_timetable_data


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
        self.user = CustomUser.objects.create_user(username="testuser1", password="12345")
        self.user_profile = CustomUser.objects.create_user(
            username="testuser2",
            password="testpass123",
        )

        # Get the automatically created Player instances
        self.player1 = Player.objects.get(user=self.user)
        self.player2 = Player.objects.get(user=self.user_profile)

        # Update display names if needed
        self.player1.display_name = "Player1"
        self.player1.save()
        self.player2.display_name = "Player2"
        self.player2.save()

        # Create a GameMode instance
        self.game_mode = GameMode.objects.create(
            name="Test mode",
            description="Test description",
            player_count=GameMode.TWO_PLAYER,
            perspective="2D",
            location="remote",
            win_condition="points",
        )

        # Create a SingleGame instance
        self.game = SingleGame.objects.create(
            mode=self.game_mode,
            status=SingleGame.DRAFT,
            winner=self.player2,
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
        self.user = CustomUser.objects.create_user(username="testuser", password="password123")
        self.player = Player.objects.get(user=self.user)  # Retrieve the associated Player instance

    def test_player_creation(self):
        """Test that a Player instance is created automatically when a CustomUser is created."""
        # Check that the player instance exists and is associated with the user
        self.assertIsNotNone(self.player)
        self.assertEqual(self.player.user, self.user)

    def test_initial_field_values(self):
        """Test that the Player instance has correct initial values for wins, losses, and display name."""
        self.assertEqual(self.player.wins, 0)
        self.assertEqual(self.player.losses, 0)
        self.assertIsNone(self.player.display_name)  # Assuming display name starts as None

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
        self.user = CustomUser.objects.create_user(username="testuser", password="password123")
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


class SingleGameTest(TestCase):
    def setUp(self):
        # Create test users and players
        self.user1 = CustomUser.objects.create_user(username="player1", email="p1@test.com", password="test123")
        self.user2 = CustomUser.objects.create_user(username="player2", email="p2@test.com", password="test123")
        # Get the automatically created Player instances
        self.player1 = Player.objects.get(user=self.user1)
        self.player2 = Player.objects.get(user=self.user2)

        # Create a basic game mode
        self.game_mode = GameMode.objects.create(
            name="Classic 1v1",
            description="Classic two-player game",
            player_count=2,
            perspective="2D",
            location="remote",
        )

        # Create a SingleGame instance in DRAFT status
        self.game = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)  # Start in DRAFT status
        # Add players to the game
        self.game.players.set([self.player1, self.player2])

    def test_game_lifecycle(self):
        """Test the complete lifecycle of a game from draft to finish"""
        # 1. Create game in draft
        game = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)
        self.assertEqual(game.status, SingleGame.DRAFT)
        self.assertIsNone(game.start_date)

        # 2. Add players
        PlayerGameStats.objects.create(single_game=game, player=self.player1)
        PlayerGameStats.objects.create(single_game=game, player=self.player2)

        # 3. Start game
        game.start_game()
        self.assertEqual(game.status, SingleGame.ACTIVE)
        self.assertIsNotNone(game.start_date)

        # 4. Finish game
        game.finish_game()
        self.assertEqual(game.status, SingleGame.FINISHED)
        self.assertIsNotNone(game.finished_at)

        # 5. Set winner
        game.set_winner(self.player1)
        self.assertEqual(game.winner, self.player1)

    def test_game_validation(self):
        """Test various validation scenarios"""
        game = SingleGame.objects.create(status=SingleGame.DRAFT)

        # Cannot start without mode
        with self.assertRaises(ValueError):
            game.start_game()

        game.mode = self.game_mode

        # Cannot start without players
        with self.assertRaises(ValueError):
            game.start_game()

        # Cannot set winner before finish
        with self.assertRaises(ValueError):
            game.set_winner(self.player1)

    def test_save_and_load_template(self):
        """Test saving game configuration as template"""
        # Create a game with specific configuration
        template_game = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)

        # Save as template
        template_name = "My Favorite Setup"
        template_game.save_as_template(template_name)

        # Create new game from template (implementation needed)
        # new_game = SingleGame.create_from_template(template_name)
        # self.assertEqual(new_game.mode, template_game.mode)
        # etc...

    def test_game_duration(self):
        """Test game duration calculation"""
        game = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)

        # Add players
        PlayerGameStats.objects.create(single_game=game, player=self.player1)
        PlayerGameStats.objects.create(single_game=game, player=self.player2)

        # Duration should be None before game starts
        self.assertIsNone(game.duration)

        # Start game
        game.start_game()
        self.assertIsNone(game.duration)  # Still None during play

        # Finish game
        game.finish_game()
        self.assertIsNotNone(game.duration)
        self.assertIsInstance(game.duration, float)

    def test_player_count_validation(self):
        """Test that games cannot be started with incorrect number of players"""
        game = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)

        # Add just one player
        PlayerGameStats.objects.create(single_game=game, player=self.player1)

        # Should not be able to start with only one player
        with self.assertRaises(ValueError):
            game.start_game()

    def test_game_status_transitions(self):
        """Test that game status transitions follow the correct flow"""
        game = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)

        # Cannot finish a draft game
        with self.assertRaises(ValueError):
            game.finish_game()

        # Cannot transition from FINISHED back to ACTIVE
        game.status = SingleGame.FINISHED
        game.save()
        with self.assertRaises(ValueError):
            game.start_game()

    def test_player_stats_creation(self):
        """Test that player statistics are properly tracked"""
        game = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)

        # Add players and start game
        stats1 = PlayerGameStats.objects.create(single_game=game, player=self.player1)
        stats2 = PlayerGameStats.objects.create(single_game=game, player=self.player2)

        # Test initial stats
        self.assertEqual(stats1.score, 0)
        self.assertEqual(stats2.score, 0)

    def test_concurrent_games(self):
        """Test that a player cannot be in multiple active games"""
        game1 = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)
        game2 = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)

        # Add player1 to both games
        PlayerGameStats.objects.create(single_game=game1, player=self.player1)
        PlayerGameStats.objects.create(single_game=game2, player=self.player1)

        # Start first game
        PlayerGameStats.objects.create(single_game=game1, player=self.player2)
        game1.start_game()

        # Should not be able to start second game with same player
        PlayerGameStats.objects.create(single_game=game2, player=self.player2)
        with self.assertRaises(ValueError):
            game2.start_game()

    def test_game_scoring(self):
        """Test score tracking and winner determination"""
        game = SingleGame.objects.create(mode=self.game_mode, status=SingleGame.DRAFT)
        stats1 = PlayerGameStats.objects.create(single_game=game, player=self.player1)
        stats2 = PlayerGameStats.objects.create(single_game=game, player=self.player2)

        game.start_game()

        # Simulate scoring
        stats1.score = 11
        stats1.save()
        stats2.score = 5
        stats2.save()

        game.finish_game()
        game.determine_winner()  # You might need to implement this method

        self.assertEqual(game.winner, self.player1)


class TournamentTest(TestCase):
    def setUp(self):
        # Create a user for testing
        self.user = CustomUser.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        # Get the automatically created player instead of creating a new one
        self.player = Player.objects.get(user=self.user)
        # Update display name if needed
        self.player.display_name = "TestPlayer"
        self.player.save()

        # Set up common dates for tournaments
        self.now = timezone.now()
        self.tomorrow = self.now + timedelta(days=1)
        self.day_after = self.now + timedelta(days=2)

    def test_create_tournament(self):
        """Test basic tournament creation"""
        tournament = Tournament.objects.create(
            name="Test Tournament",
            description="A test tournament",
            start_registration=self.now,
            end_registration=self.tomorrow,
            start_date=self.day_after,
            type=Tournament.TYPE_SINGLE_ELIMINATION,
            creator=self.player,
            min_participants=2,
            max_participants=8,
        )

        self.assertEqual(tournament.name, "Test Tournament")
        self.assertEqual(tournament.type, Tournament.TYPE_SINGLE_ELIMINATION)
        self.assertEqual(tournament.creator, self.player)

    def test_tournament_dates_validation(self):
        """Test that tournament dates are properly validated"""
        # Create a tournament with invalid dates
        tournament = Tournament.objects.create(
            name="Invalid Tournament",
            type=Tournament.TYPE_SINGLE_ELIMINATION,
            start_registration=self.tomorrow,  # Later date
            end_registration=self.now,  # Earlier date
            start_date=self.day_after,
            start_mode=Tournament.START_MODE_FIXED,
            creator=self.player,
            min_participants=2,
            max_participants=8,
        )

        # The validation should happen when we call full_clean()
        with self.assertRaises(ValidationError):
            tournament.full_clean()

    def test_tournament_participants(self):
        """Test adding and removing participants"""
        tournament = Tournament.objects.create(
            name="Test Tournament",
            start_registration=self.now,
            end_registration=self.tomorrow,
            start_date=self.day_after,
            type=Tournament.TYPE_SINGLE_ELIMINATION,
            creator=self.player,
            min_participants=2,
            max_participants=4,
        )

        # Create a new user and get its automatically created player
        user2 = CustomUser.objects.create_user(username="testuser2", email="test2@example.com", password="testpass123")
        player2 = Player.objects.get(user=user2)
        player2.display_name = "TestPlayer2"
        player2.save()

        # Add participants
        tournament.participants.add(self.player, player2)
        self.assertEqual(tournament.participants.count(), 2)
        self.assertIn(self.player, tournament.participants.all())
        self.assertIn(player2, tournament.participants.all())


class TournamentCreationTest(TestCase):
    def setUp(self):
        # Create a user and get its automatically created player
        self.user = CustomUser.objects.create_user(
            username=f"testuser_{uuid.uuid4()}",
            email="test@example.com",
            password="testpass123",
        )
        # Instead of creating a new player, get the existing one
        self.player = Player.objects.get(user=self.user)
        # Optionally update the display name if needed
        self.player.display_name = "TestPlayer"
        self.player.save()

        # Set up common dates for tournaments
        self.now = timezone.now()
        self.tomorrow = self.now + timedelta(days=1)
        self.day_after = self.now + timedelta(days=2)

    def test_create_public_tournament_fixed_start(self):
        """Test creation of a public tournament with fixed start time"""
        tournament = Tournament.objects.create(
            name="Weekend Tournament",
            description="A fun weekend tournament",
            type=Tournament.TYPE_SINGLE_ELIMINATION,
            creator=self.player,
            start_mode=Tournament.START_MODE_FIXED,
            start_registration=self.now,
            end_registration=self.tomorrow,
            start_date=self.day_after,
            is_public=True,
            min_participants=4,
            max_participants=8,
        )

        # Verify basic tournament setup
        self.assertEqual(tournament.name, "Weekend Tournament")
        self.assertEqual(tournament.type, Tournament.TYPE_SINGLE_ELIMINATION)
        self.assertEqual(tournament.creator, self.player)
        self.assertTrue(tournament.is_public)

        # Verify timing setup
        self.assertEqual(tournament.start_mode, Tournament.START_MODE_FIXED)
        self.assertEqual(tournament.start_date, self.day_after)

        # Verify initial state
        self.assertEqual(tournament.participants.count(), 0)
        self.assertFalse(tournament.can_start())

    def test_create_private_tournament_auto_start(self):
        """Test creation of a private tournament with auto start"""
        # Create a user and get its automatically created player
        allowed_user = CustomUser.objects.create_user(
            username="allowed_user",
            email="allowed@example.com",
            password="testpass123",
        )
        # Instead of creating a new player, get the existing one
        allowed_player = Player.objects.get(user=allowed_user)
        # Optionally update the display name if needed
        allowed_player.display_name = "AllowedPlayer"
        allowed_player.save()

        tournament = Tournament.objects.create(
            # Basic info
            name="Private Tournament",
            description="Invitation only tournament",
            type=Tournament.TYPE_ROUND_ROBIN,
            creator=self.player,
            # Timing
            start_mode=Tournament.START_MODE_AUTO,
            start_registration=self.now,
            end_registration=self.tomorrow,
            auto_start_delay=timedelta(minutes=10),
            # Participant settings
            is_public=False,
            min_participants=2,
            max_participants=4,
        )

        # Add allowed players
        tournament.allowed_players.add(allowed_player)

        # Verify basic tournament setup
        self.assertEqual(tournament.name, "Private Tournament")
        self.assertEqual(tournament.type, Tournament.TYPE_ROUND_ROBIN)
        self.assertFalse(tournament.is_public)

        # Verify timing setup
        self.assertEqual(tournament.start_mode, Tournament.START_MODE_AUTO)
        self.assertEqual(tournament.auto_start_delay, timedelta(minutes=10))

        # Verify access control
        self.assertEqual(tournament.allowed_players.count(), 1)
        self.assertIn(allowed_player, tournament.allowed_players.all())

    def test_invalid_tournament_creation(self):
        """Test validation of tournament creation parameters"""
        # Test invalid dates (registration end before start)
        with self.assertRaises(ValidationError):
            Tournament.objects.create(
                name="Invalid Tournament",
                type=Tournament.TYPE_SINGLE_ELIMINATION,
                start_registration=self.tomorrow,  # Invalid: starts after end
                end_registration=self.now,
                start_date=self.day_after,
                start_mode=Tournament.START_MODE_FIXED,
                creator=self.player,
            ).clean()

        # Test fixed mode without start date
        with self.assertRaises(ValidationError):
            Tournament.objects.create(
                name="Invalid Tournament",
                type=Tournament.TYPE_SINGLE_ELIMINATION,
                start_registration=self.now,
                end_registration=self.tomorrow,
                start_mode=Tournament.START_MODE_FIXED,  # Invalid: no start_date
                creator=self.player,
            ).clean()

    def test_direct_elimination_tournament_structure(self):
        """Test that a direct elimination tournament with 8 players is structured correctly"""
        tournament = Tournament.objects.create(
            name="Test Direct Elimination",
            type=Tournament.TYPE_SINGLE_ELIMINATION,
            start_mode=Tournament.START_MODE_FIXED,
            start_registration=timezone.now() - timedelta(days=1),
            end_registration=timezone.now() - timedelta(hours=1),
            start_date=timezone.now(),
            min_participants=8,
            max_participants=8,
            is_public=True,
            creator=self.player,
        )

        # Create and register 8 players
        players = []
        for i in range(8):
            user = CustomUser.objects.create_user(
                username=f"player{i}",
                email=f"player{i}@example.com",
                password="testpass123",
            )
            player = Player.objects.get(user=user)
            players.append(player)
            tournament.participants.add(player)

        # Create all tournament games and schedules
        # Quarter-finals (Round 1)
        quarter_finals = []
        for i in range(0, 8, 2):
            game = TournamentGame.objects.create(game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION)
            PlayerGameStats.objects.create(tournament_game=game, player=players[i])
            PlayerGameStats.objects.create(tournament_game=game, player=players[i + 1])
            TournamentGameSchedule.objects.create(
                tournament=tournament,
                game=game,
                round_number=1,
                match_number=i // 2 + 1,
            )
            quarter_finals.append(game)

        # Semi-finals (Round 2)
        semi_finals = []
        for i in range(0, 4, 2):
            game = TournamentGame.objects.create(
                game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
                source_game1=quarter_finals[i],
                source_game2=quarter_finals[i + 1],
            )
            TournamentGameSchedule.objects.create(
                tournament=tournament,
                game=game,
                round_number=2,
                match_number=i // 2 + 1,
            )
            semi_finals.append(game)

        # Finals (Round 3)
        finals = TournamentGame.objects.create(
            game_type=TournamentGame.GAME_TYPE_DIRECT_ELIMINATION,
            source_game1=semi_finals[0],
            source_game2=semi_finals[1],
        )
        TournamentGameSchedule.objects.create(
            tournament=tournament,
            game=finals,
            round_number=3,
            match_number=1,
        )

        # Verify tournament structure
        # 1. Check total number of games
        self.assertEqual(
            TournamentGameSchedule.objects.filter(tournament=tournament).count(),
            7,  # 4 quarter-finals + 2 semi-finals + 1 final
        )

        # 2. Verify round progression
        for round_num in range(1, 4):
            games_in_round = TournamentGameSchedule.objects.filter(tournament=tournament, round_number=round_num)
            expected_games = 2 ** (3 - round_num)  # 4 games in round 1, 2 in round 2, 1 in round 3
            self.assertEqual(games_in_round.count(), expected_games)

        # 3. Verify game relationships
        # Check semi-finals
        for semi_final in semi_finals:
            self.assertIsNotNone(semi_final.source_game1)
            self.assertIsNotNone(semi_final.source_game2)
            self.assertEqual(
                TournamentGameSchedule.objects.get(game=semi_final.source_game1).round_number,
                1,
            )
            self.assertEqual(
                TournamentGameSchedule.objects.get(game=semi_final.source_game2).round_number,
                1,
            )

        # Check finals
        self.assertIsNotNone(finals.source_game1)
        self.assertIsNotNone(finals.source_game2)
        self.assertEqual(
            TournamentGameSchedule.objects.get(game=finals.source_game1).round_number,
            2,
        )
        self.assertEqual(
            TournamentGameSchedule.objects.get(game=finals.source_game2).round_number,
            2,
        )

        # 4. Verify that we can traverse the entire bracket
        def verify_game_tree(game):
            """Recursively verify game relationships"""
            if not game:
                return True
            if game.source_game1:
                self.assertLess(
                    TournamentGameSchedule.objects.get(game=game.source_game1).round_number,
                    TournamentGameSchedule.objects.get(game=game).round_number,
                )
                verify_game_tree(game.source_game1)
            if game.source_game2:
                self.assertLess(
                    TournamentGameSchedule.objects.get(game=game.source_game2).round_number,
                    TournamentGameSchedule.objects.get(game=game).round_number,
                )
                verify_game_tree(game.source_game2)

        verify_game_tree(finals)


class TournamentAPITest(TestCase):
    fixtures = ["tournaments.json"]  # Load predefined tournaments

    def setUp(self):
        self.client = self.client_class()

    def test_get_tournaments_count(self):
        """
        Test that all tournaments from the fixture are loaded
        and returned correctly by the /tournaments/ endpoint.
        """
        response = self.client.get(reverse("tournaments"))  # Use reverse for URL resolution
        self.assertEqual(response.status_code, 200)

        # Parse response data
        data = response.json()
        self.assertIn("tournaments", data)
        self.assertEqual(len(data["tournaments"]), 4)  # Ensure all 4 tournaments are returned

    def test_tournament_data_format(self):
        """
        Test that tournament data matches the expected frontend format.
        """
        response = self.client.get(reverse("tournaments"))
        data = response.json()["tournaments"]

        # Retrieve the first tournament from the database
        tournament = Tournament.objects.get(pk=1)  # Assumes pk=1 is the first tournament in the fixture
        first_tournament = data[0]

        # Validate fields dynamically
        self.assertEqual(first_tournament["name"], tournament.name)
        self.assertEqual(first_tournament["type"], tournament.type.replace("_", " "))
        self.assertEqual(first_tournament["startingDate"], tournament.start_date.isoformat())
        self.assertEqual(first_tournament["closingRegistrationDate"], tournament.end_registration.isoformat())
        self.assertEqual(first_tournament["isTimetableAvailable"], bool(tournament.games.exists()))
        self.assertIsNone(first_tournament["timetable"])

    def test_get_single_tournament(self):
        """
        Test the `GET /tournament/<id>/` endpoint to ensure it returns the correct tournament.
        """
        response = self.client.get(reverse("tournament", args=[1]))
        self.assertEqual(response.status_code, 200)

        # Parse response data
        data = response.json()
        self.assertEqual(data["id"], 1)
        self.assertEqual(data["name"], "WIMBLEDON")
        self.assertEqual(data["description"], "Lorem ipsum dolor sit amet, consectetur adipiscing elit")
        self.assertEqual(data["start_registration"], "2024-07-01T00:00:00+00:00")
        self.assertEqual(data["end_registration"], "2024-07-19T23:59:00+00:00")
        self.assertEqual(data["type"], "single_elimination")
        self.assertEqual(data["start_mode"], "fixed")
        self.assertEqual(data["participants"], [])

    def test_get_single_tournament_not_found(self):
        """
        Test the `GET /tournament/<id>/` endpoint for a non-existent tournament.
        """
        response = self.client.get(reverse("tournament", args=[999]))
        self.assertEqual(response.status_code, 404)

        # Since we expect a JSON response, we should check the content type
        self.assertEqual(response["Content-Type"], "application/json")

        # Now parse the JSON response
        data = response.json()
        self.assertIn("error", data)

    def test_empty_tournaments(self):
        """
        Test the /tournaments/ endpoint when no tournaments exist.
        """
        # Clear all tournaments from the database
        Tournament.objects.all().delete()

        response = self.client.get(reverse("tournaments"))
        self.assertEqual(response.status_code, 200)

        # Ensure no tournaments are returned
        data = response.json()
        self.assertEqual(data["tournaments"], [])

    def test_tournament_response_format(self):
        """Test that single tournament endpoint returns data in the expected format"""
        response = self.client.get(reverse("tournament", args=[1]))
        self.assertEqual(response.status_code, 200)
        data = response.json()

        required_fields = [
            "id",
            "name",
            "description",
            "start_registration",
            "end_registration",
            "type",
            "start_mode",
            "participants",
        ]

        for field in required_fields:
            self.assertIn(field, data)

    def test_create_tournament(self):
        """Test creating a new tournament via POST /tournaments/"""
        # Create test data
        tournament_data = {
            "name": "New Tournament",
            "description": "Test tournament creation",
            "start_registration": (timezone.now() + timedelta(days=1)).isoformat(),
            "end_registration": (timezone.now() + timedelta(days=7)).isoformat(),
            "start_date": (timezone.now() + timedelta(days=14)).isoformat(),
            "type": Tournament.TYPE_SINGLE_ELIMINATION,
            "start_mode": Tournament.START_MODE_FIXED,
            "min_participants": 2,
            "max_participants": 8,
        }

        # Send POST request
        response = self.client.post(
            reverse("tournaments"), data=json.dumps(tournament_data), content_type="application/json"
        )

        # Check response
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("id", data)

        # Verify tournament was created
        tournament = Tournament.objects.get(pk=data["id"])
        self.assertEqual(tournament.name, tournament_data["name"])
        self.assertEqual(tournament.description, tournament_data["description"])


class TournamentEnrollmentTest(TestCase):
    @classmethod
    def setUpClass(cls):
        # Start patching before any tests run
        cls.patcher = patch("game.signals.create_player_profile")
        cls.patcher.start()
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        # Stop patching after all tests complete
        cls.patcher.stop()
        super().tearDownClass()

    def setUp(self):
        """Set up test data without relying on fixtures"""
        self.client = self.client_class()

        # Create a test user and get its automatically created Player
        self.user = CustomUser.objects.create_user(username="testuser", password="testpass123")
        self.client.login(username="testuser", password="testpass123")  # Add this line to login the test user

        # Get the automatically created Player instance instead of creating a new one
        self.player = Player.objects.get(user=self.user)
        # Update display name if needed
        self.player.display_name = "TestPlayer"
        self.player.save()

        # Create a test tournament
        self.tournament = Tournament.objects.create(
            name="Test Tournament",
            description="Test tournament for enrollment",
            start_registration=timezone.now(),
            end_registration=timezone.now() + timedelta(days=7),
            start_date=timezone.now() + timedelta(days=14),
            type=Tournament.TYPE_SINGLE_ELIMINATION,
            start_mode=Tournament.START_MODE_FIXED,
            is_public=True,
            min_participants=2,
            max_participants=8,
            creator=self.player,
        )

    def test_enrollment_success(self):
        """Test successful enrollment in tournament"""
        response = self.client.post(reverse("tournament_enrollment", kwargs={"tournament_id": self.tournament.id}))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.tournament.participants.filter(user__username=self.user.username).exists())

    def test_enrollment_duplicate(self):
        """Test enrolling when already enrolled"""
        # First enrollment
        self.client.post(reverse("tournament_enrollment", kwargs={"tournament_id": self.tournament.id}))
        # Try to enroll again
        response = self.client.post(reverse("tournament_enrollment", kwargs={"tournament_id": self.tournament.id}))
        self.assertEqual(response.status_code, 400)

    def test_leave_success(self):
        """Test successfully leaving tournament"""
        # First enroll
        self.tournament.participants.add(self.player)
        # Then leave
        response = self.client.delete(reverse("tournament_enrollment", kwargs={"tournament_id": self.tournament.id}))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(self.tournament.participants.filter(user__username=self.user.username).exists())

    def test_leave_not_enrolled(self):
        """Test leaving when not enrolled"""
        response = self.client.delete(reverse("tournament_enrollment", kwargs={"tournament_id": self.tournament.id}))
        self.assertEqual(response.status_code, 400)

    def test_invalid_tournament(self):
        """Test enrollment with invalid tournament ID"""
        response = self.client.post(reverse("tournament_enrollment", kwargs={"tournament_id": 9999}))
        self.assertEqual(response.status_code, 404)


class TournamentServiceTest(TestCase):
    fixtures = ["tournaments.json"]

    def setUp(self):
        self.tournament = Tournament.objects.get(pk=4)  # Get tournament with games from fixture

    def test_build_tournament_data_structure(self):
        """Test that tournament data is built correctly"""
        data = build_tournament_data(self.tournament)

        # Test basic tournament fields
        self.assertEqual(data["name"], self.tournament.name)
        self.assertEqual(data["description"], self.tournament.description)
        self.assertEqual(data["type"], self.tournament.type.replace("_", " "))
        self.assertEqual(
            data["startingDate"], self.tournament.start_date.isoformat() if self.tournament.start_date else None
        )
        self.assertEqual(data["closingRegistrationDate"], self.tournament.end_registration.isoformat())

        # Test participants
        self.assertEqual(
            data["participants"], list(self.tournament.participants.values_list("display_name", flat=True))
        )

        # Test timetable availability
        self.assertTrue(data["isTimetableAvailable"])
        self.assertIsNotNone(data["timetable"])

    def test_build_timetable_structure(self):
        """Test that timetable data is built correctly"""
        timetable = build_timetable_data(self.tournament)

        # Test rounds structure
        self.assertIn("rounds", timetable)
        self.assertTrue(isinstance(timetable["rounds"], list))

        # Test first round structure
        first_round = timetable["rounds"][0]
        self.assertEqual(first_round["round"], 1)
        self.assertTrue(isinstance(first_round["games"], list))

        # Test game structure in first round
        first_game = first_round["games"][0]
        self.assertIn("uuid", first_game)
        self.assertIn("date", first_game)
        self.assertIn("player1", first_game)
        self.assertIn("player2", first_game)
        self.assertIn("nextGameUuid", first_game)
        self.assertIn("sourceGames", first_game)
        self.assertIn("winner", first_game)

    def test_tournament_without_games(self):
        """Test building data for tournament without games"""
        # Create a tournament without games
        tournament = Tournament.objects.create(
            name="Empty Tournament",
            description="No games yet",
            type=Tournament.TYPE_SINGLE_ELIMINATION,
            start_registration=timezone.now(),
            end_registration=timezone.now() + timedelta(days=1),
            start_mode=Tournament.START_MODE_AUTO,
            creator=Player.objects.first(),
        )

        data = build_tournament_data(tournament)
        self.assertFalse(data["isTimetableAvailable"])
        self.assertIsNone(data["timetable"])

from django.test import TestCase, Client
from django.urls import reverse
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from django.urls import re_path
from users.models import CustomUser
from game.models import Player
from game.consumers import PongConsumer
from game.routing import websocket_urlpatterns
import json
import pytest

@pytest.mark.asyncio
class GameConnectionIntegrationTest(TestCase):
    """
    Integration test for game creation and connection flow.
    Tests user creation, game creation, and WebSocket connection.
    """
    
    def setUp(self):
        """
        Regular synchronous setup - runs before each test method.
        Creates test users and their associated Player profiles will be automatically
        created through the signal handler in game/signals.py
        """
        # Create test users - Player instances will be created automatically via signals
        self.user1 = CustomUser.objects.create_user(
            username="testplayer1",
            password="testpass123"
        )
        self.user2 = CustomUser.objects.create_user(
            username="testplayer2",
            password="testpass123"
        )
        
        # Get the automatically created Player instances
        # These were created by the post_save signal in game/signals.py
        self.player1 = Player.objects.get(user=self.user1)
        self.player2 = Player.objects.get(user=self.user2)
        
        # Update display names if needed
        self.player1.display_name = "TestPlayer1"
        self.player1.save()
        self.player2.display_name = "TestPlayer2"
        self.player2.save()
        
        # Set up the HTTP test client
        self.client = Client()
        
        # Set up the WebSocket application
        self.application = URLRouter(websocket_urlpatterns)

    async def test_game_creation_and_connection(self):
        """Test the complete flow from game creation through WebSocket connection"""
        print("Starting game creation and connection test")
        
        # Step 1: Login user1 who will create the game
        login_success = self.client.login(username="testplayer1", password="testpass123")
        self.assertTrue(login_success, "Failed to log in test user")
        
        # Step 2: Create a new game
        game_settings = {
            "mode": "regular",
            "type": "polygon",
            "num_players": 2,
            "num_balls": 1,
            "sides": 4
        }
        
        print("Creating new game...")
        response = self.client.post(
            reverse('create_new_game'),
            data=json.dumps(game_settings),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200, f"Game creation failed with response: {response.content}")
        game_data = response.json()
        self.assertTrue('ws_url' in game_data, "WebSocket URL not found in response")
        
        # Extract game ID from WebSocket URL
        game_id = game_data['ws_url'].split('/')[-2]
        print(f"Game created with ID: {game_id}")
        
        # Step 3: Connect user1 to the game via WebSocket
        communicator1 = WebsocketCommunicator(
            self.application,
            f"/ws/game/{game_id}/?type=polygon"
        )
        communicator1.scope["user"] = self.user1
        print("Connecting first user...")
        connected1, _ = await communicator1.connect()
        self.assertTrue(connected1, "First user failed to connect")
        
        try:
            # Step 4: Verify initial game state message
            print("Waiting for initial game state...")
            response1 = await communicator1.receive_json_from()
            self.assertEqual(response1["type"], "initial_state", "Didn't receive initial state")
            self.assertTrue("game_state" in response1, "Game state missing from response")
            
            # Step 5: Connect user2 to the game
            print("Connecting second user...")
            communicator2 = WebsocketCommunicator(
                self.application,
                f"/ws/game/{game_id}/?type=polygon"
            )
            communicator2.scope["user"] = self.user2
            connected2, _ = await communicator2.connect()
            self.assertTrue(connected2, "Second user failed to connect")
            
            try:
                # Step 6: Verify user2 receives initial state
                response2 = await communicator2.receive_json_from()
                self.assertEqual(response2["type"], "initial_state", "Second user didn't receive initial state")
                
                # Step 7: Test paddle movement
                print("Testing paddle movement...")
                await communicator1.send_json_to({
                    "action": "move_paddle",
                    "direction": "left",
                    "user_id": str(self.user1.id)
                })
                
                # Both players should receive game state update
                state_update1 = await communicator1.receive_json_from()
                state_update2 = await communicator2.receive_json_from()
                
                self.assertEqual(state_update1["type"], "game_state", "First user didn't receive state update")
                self.assertEqual(state_update2["type"], "game_state", "Second user didn't receive state update")
                
            finally:
                print("Disconnecting second user...")
                await communicator2.disconnect()
        finally:
            print("Disconnecting first user...")
            await communicator1.disconnect()

    def tearDown(self):
        """Clean up after each test"""
        print("Cleaning up test data...")
        CustomUser.objects.all().delete()  # This will cascade delete Player instances
        super().tearDown()
