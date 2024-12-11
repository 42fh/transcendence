from django.core.management.base import BaseCommand
from chat.models import ChatRoom, Message
from users.models import CustomUser
from game.models import Player
from django.utils import timezone


class Command(BaseCommand):
    help = "Seeds the database with conversations (chatrooms and messages) between the 'dev' user and other users"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Seeding conversations between 'dev' user and specified users..."))
        dev_user = CustomUser.objects.get(username="dev")

        # Seed with all other users
        # other_players = Player.objects.exclude(user=dev_user)
        # Specify the users to seed conversations with:
        other_players = Player.objects.filter(user__username__in=["ThePrimeagen", "CheGuevara"])

        #TODO:probably now user id has to be sent here
        for player in other_players:
            room, created = ChatRoom.objects.create_room(dev_user, player.user)

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"Created chatroom between {dev_user.username} and {player.user.username}")
                )
            else:
                self.stdout.write(f"Chatroom already exists between {dev_user.username} and {player.user.username}")

            self._seed_messages(room, dev_user, player.user)

    def _seed_messages(self, room, user1, user2):
        """Seed messages between two users in the given chatroom."""
        now = timezone.now()
        messages = [
            {"sender": user1, "content": "Hello, how's it going?"},
            {"sender": user2, "content": "I'm good! How about you?"},
            {"sender": user1, "content": "Doing great, just testing chat seeding."},
            {"sender": user2, "content": "Nice! I see this works well."},
            {"sender": user1, "content": "Yes, it's working perfectly!"},
        ]

        for message_data in messages:
            message = Message.objects.create(room=room, sender=message_data["sender"], content=message_data["content"])
            # self.stdout.write(f"Created message from {message.sender.username}: {message.content}")

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {len(messages)} messages between {user1.username} and {user2.username}")
        )
