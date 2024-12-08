from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
from django.utils import timezone
from channels.layers import get_channel_layer
import logging

# Import models
from game.models import Tournament, Player
from ..gamecoordinator.GameCoordinator import GameCoordinator
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)


class TournamentNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tournament_id = self.scope["url_route"]["kwargs"]["tournament_id"]
        self.group_name = f"tournament_{self.tournament_id}"
        self.player_id = self.scope["user"].id
        # Check if user is authenticated
        if not self.scope["user"].is_authenticated:
            await self.close(code=4001)  # Custom code: Not authenticated
            return

        # Check if user is enrolled in tournament
        if not await self.validate_enrollment():
            await self.close(code=4003)  # Custom code: Not enrolled in tournament
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        from ..tournamentmanager.TournamentManager import TournamentManager

        # Check for pending start after connection is established
        async with await GameCoordinator.get_redis(
            TournamentManager.REDIS_URL
        ) as redis_conn:
            if await redis_conn.exists(
                f"tournament_pending_start:{self.tournament_id}"
            ):
                tournament = await sync_to_async(Tournament.objects.get)(
                    pk=self.tournament_id
                )
                await sync_to_async(TournamentManager.start_matchmaking)(tournament)
                await redis_conn.delete(
                    f"tournament_pending_start:{self.tournament_id}"
                )

    @database_sync_to_async
    def validate_enrollment(self):
        return Tournament.objects.filter(
            id=self.tournament_id, participants=self.scope["user"].player
        ).exists()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def player_left(self, event):
        message = event["message"]
        if (
            message["type"] == "force_disconnect"
            and self.player_id == message["player_id"]
        ):
            logger.info(f"Hey I player {self.player_id} left the game")
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.close(4008)

    async def tournament_notification(self, event):
        print("fdg")
        if (
            "player_id" not in event["message"]
            or str(self.player_id) == event["message"]["player_id"]
        ):
            print("almooooost")
            await self.send(text_data=json.dumps(event["message"]))


class TournamentNotifier:
    NOTIFICATION_TYPES = {
        "PLAYER_JOINED": "player_joined",
        "PLAYER_LEFT": "player_left",
        "GAME_READY": "game_ready",
        "WAITING_OPPONENT": "waiting_opponent",
        "GAME_NEEDS_PLAYERS": "game_needs_players",
        "SPECTATE_AVAILABLE": "spectate_available",
    }

    def __init__(self, tournament_id):
        self.tournament_id = tournament_id
        self.channel_layer = get_channel_layer()
        self.group_name = f"tournament_{tournament_id}"

    async def player_joined(self, username):
        await self.notify(
            {"type": self.NOTIFICATION_TYPES["PLAYER_JOINED"], "username": username}
        )

    async def waiting_for_opponent(self, game_id, message):
        await self.notify(
            {
                "type": self.NOTIFICATION_TYPES["WAITING_OPPONENT"],
                "game_id": game_id,
                "message": message,
                "player_id": player_id,
            }
        )

    async def game_ready(self, game_id, ws_url, player_id):
        await self.notify(
            {
                "type": self.NOTIFICATION_TYPES["GAME_READY"],
                "game_id": game_id,
                "ws_url": ws_url,
                "player_id": (player_id),
            }
        )

    async def game_needs_players(self, game_id):
        await self.notify(
            {"type": self.NOTIFICATION_TYPES["GAME_NEEDS_PLAYERS"], "game_id": game_id}
        )

    async def player_left(self, username):
        await self.notify(
            {"type": self.NOTIFICATION_TYPES["PLAYER_LEFT"], "username": username}
        )

    async def spectate_available(self, game_id, ws_url):
        await self.notify(
            {
                "type": self.NOTIFICATION_TYPES["SPECTATE_AVAILABLE"],
                "game_id": game_id,
                "ws_url": ws_url,
            }
        )

    async def notify(self, message):
        message["timestamp"] = timezone.now().isoformat()
        print("ssdfdxi: ", message)

        await self.channel_layer.group_send(
            self.group_name, {"type": "tournament.notification", "message": message}
        )
