from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import CustomUser
from game.models import Player, SingleGame, GameMode, PlayerGameStats
from datetime import timedelta
import uuid


class Command(BaseCommand):
    help = "Seeds the database with development and test users and their game stats"

    def handle(self, *args, **options):
        self.stdout.write("Checking existing users...")

        # Check if dev user exists
        if CustomUser.objects.filter(username="dev").exists():
            self.stdout.write(self.style.SUCCESS("Users already seeded, skipping..."))
            return

        # Create game mode if it doesn't exist
        game_mode, _ = GameMode.objects.get_or_create(
            name="Classic",
            defaults={
                "description": "Classic Pong mode",
                "player_count": 2,
                "perspective": "2D",
                "location": "remote",
                "win_condition": "points",
            },
        )

        # Create users with full profile data
        users_data = [
            {
<<<<<<< Updated upstream
                "username": "dev",
                "email": "dev@1719.anonaddy.com",
                "password": "dev",
                "first_name": "Dev",
                "last_name": "User",
                "bio": "Development user for local testing",
                "telephone_number": "+1234567890",
                "pronoun": "they/them",
                "two_factor_enabled": False,
                "visibility_online_status": "everyone",
                "visibility_user_profile": "everyone",
                "email_verified": True,
                "is_active": True,
                "avatar": "avatars/default/default.jpeg",
                "game_stats": {"wins": 5, "losses": 2},
            },
            {
=======
>>>>>>> Stashed changes
                "username": "ThePrimeagen",
                "email": "prime@1719.anonaddy.com",
                "password": "test1pass",
                "first_name": "The",
                "last_name": "Primeagen",
                "bio": "If you're not using Vim, you're not living. Also, I love Rust.",
                "telephone_number": "+1234567890",
                "pronoun": "he/him",
                "two_factor_enabled": False,
                "visibility_online_status": "everyone",
                "visibility_user_profile": "everyone",
                "email_verified": True,
                "is_active": True,
                "avatar": "avatars/default/default.jpeg",
                "game_stats": {"wins": 15, "losses": 5},
            },
            {
                "username": "LexFridman",
                "email": "lex@1719.anonaddy.com",
                "password": "test1pass",
                "first_name": "Lex",
                "last_name": "Fridman",
                "bio": "Love is the answer. Also, let's talk about consciousness and AI.",
                "telephone_number": "+1234567891",
                "pronoun": "he/him",
                "two_factor_enabled": False,
                "visibility_online_status": "everyone",
                "visibility_user_profile": "everyone",
                "email_verified": True,
                "is_active": True,
                "avatar": "avatars/default/default.jpeg",
                "game_stats": {"wins": 8, "losses": 8},
            },
            {
                "username": "ElonMusk",
                "email": "elon@1719.anonaddy.com",
                "password": "test1pass",
                "first_name": "Elon",
                "last_name": "Musk",
                "bio": "Let's make Pong multiplanetary! 🚀",
                "telephone_number": "+1234567892",
                "pronoun": "he/him",
                "two_factor_enabled": False,
                "visibility_online_status": "friends",
                "visibility_user_profile": "everyone",
                "email_verified": True,
                "is_active": True,
                "avatar": "avatars/default/default.jpeg",
                "game_stats": {"wins": 42, "losses": 0},
            },
            {
                "username": "CheGuevara",
                "email": "che@1719.anonaddy.com",
                "password": "test1pass",
                "first_name": "Ernesto",
                "last_name": "Guevara",
                "bio": "Hasta la victoria siempre! Even in Pong.",
                "telephone_number": "+5355555555",
                "pronoun": "he/him",
                "two_factor_enabled": False,
                "visibility_online_status": "everyone",
                "visibility_user_profile": "everyone",
                "email_verified": True,
                "is_active": True,
                "avatar": "avatars/default/default.jpeg",
                "game_stats": {"wins": 20, "losses": 2},
            },
            {
                "username": "BruceWayne",
                "email": "bruce@1719.anonaddy.com",
                "password": "batmanpass",
                "first_name": "Bruce",
                "last_name": "Wayne",
                "bio": "I fight crime by night and play Pong by day.",
                "telephone_number": "+1239999999",
                "pronoun": "he/him",
                "two_factor_enabled": False,
                "visibility_online_status": "everyone",
                "visibility_user_profile": "everyone",
                "email_verified": True,
                "is_active": True,
                "avatar": "avatars/default/default.jpeg",
                "game_stats": {"wins": 30, "losses": 5},
            },
            {
                "username": "TonyStark",
                "email": "tony@1719.anonaddy.com",
                "password": "ironman123",
                "first_name": "Tony",
                "last_name": "Stark",
                "bio": "I am Iron Man, and I am unbeatable at Pong.",
                "telephone_number": "+1231111111",
                "pronoun": "he/him",
                "two_factor_enabled": False,
                "visibility_online_status": "everyone",
                "visibility_user_profile": "friends",
                "email_verified": True,
                "is_active": True,
                "avatar": "avatars/default/default.jpeg",
                "game_stats": {"wins": 60, "losses": 10},
            },
            {
                "username": "HarryPotter",
                "email": "harry@1719.anonaddy.com",
                "password": "wand123",
                "first_name": "Harry",
                "last_name": "Potter",
                "bio": "The Boy Who Lived... and plays Pong.",
                "telephone_number": "+1233333333",
                "pronoun": "he/him",
                "two_factor_enabled": False,
                "visibility_online_status": "everyone",
                "visibility_user_profile": "everyone",
                "email_verified": True,
                "is_active": True,
                "avatar": "avatars/default/default.jpeg",
                "game_stats": {"wins": 17, "losses": 10},
            },
        ]

        # Create users and their game history
        for user_data in users_data:
            game_stats = user_data.pop("game_stats")
            user = CustomUser.objects.create_user(**user_data)
            player = Player.objects.get(user=user)

            # Create game history
            self._create_game_history(player, game_mode, game_stats)
            self.stdout.write(self.style.SUCCESS(f'Created user "{user.username}" with game history'))
            self.stdout.write(
                self.style.SUCCESS(f'User "{user.username}" has been successfully seeded with game stats.')
            )

    def _create_game_history(self, player, game_mode, stats):
        """Create game history for a player"""
        now = timezone.now()

        # Create wins
        for i in range(stats["wins"]):
            game = SingleGame.objects.create(
                mode=game_mode,
                status="finished",
                winner=player,
                created_at=now - timedelta(days=i),
                start_date=now - timedelta(days=i, minutes=5),
                finished_at=now - timedelta(days=i, minutes=15),
            )

            # Create stats for winner
            PlayerGameStats.objects.create(single_game=game, player=player, joined_at=now - timedelta(days=i), score=11)

            # Create stats for loser with random opponent
            PlayerGameStats.objects.create(
                single_game=game, player=self._get_random_opponent(player), joined_at=now - timedelta(days=i), score=9
            )

        # Update player stats
        player.wins = stats["wins"]
        player.losses = stats["losses"]
        player.save()

    def _get_random_opponent(self, player):
        """Get or create a random opponent"""
        opponent = Player.objects.exclude(id=player.id).order_by("?").first()
        if not opponent:
            # Create a new opponent if none exists
            user = CustomUser.objects.create_user(
                username=f"opponent_{uuid.uuid4().hex[:8]}",
                email=f"opponent_{uuid.uuid4().hex[:8]}@example.com",
                password="opponent123",
            )
            opponent = Player.objects.get(user=user)
        return opponent
