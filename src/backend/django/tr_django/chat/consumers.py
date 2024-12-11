import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from chat.models import ChatRoom, Message, BlockedUser
from users.models import CustomUser
from django.db import models

logger = logging.getLogger("chat")


class ChatConsumer(AsyncWebsocketConsumer):
    connected_users = {}
    print("00000000000000000000000000000000")

    async def connect(self):
        try:
            self.room_name = self.scope["url_route"]["kwargs"].get("room_name")
            if not self.room_name:
                print("Room name is missing")
                await self.close()
                return

            self.room_group_name = f"chat_{self.room_name}"

            if self.scope["user"].is_anonymous:
                print("Anonymous user connection rejected")
                await self.close()
                return

            self.username = self.scope["user"].username
            print(f"User {self.username} connecting to room {self.room_name}")

            try:
                self.chat_room = await self.get_or_create_chat_room()
                if not self.chat_room:
                    print("Failed to create or get chat room")
                    await self.close()
                    return
            except ObjectDoesNotExist as e:
                print(f"User not found error: {str(e)}")
                await self.close()
                return
            except Exception as e:
                print(f"Chat room error: {str(e)}")
                await self.close()
                return

            if self.room_group_name not in self.connected_users:
                self.connected_users[self.room_group_name] = set()
            self.connected_users[self.room_group_name].add(self.username)

            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()

            await self.send(
                text_data=json.dumps(
                    {
                        "type": "connection_established",
                        "message": "Connected successfully",
                        "room": self.room_name,
                    }
                )
            )

            print("calling send_message_history")
            await self.send_message_history()

        except Exception as e:
            print(f"Connection error: {str(e)}")
            await self.close()
            return

    @database_sync_to_async
    def get_message_history(self, limit=50):
        messages = (
            Message.objects.filter(room=self.chat_room)
            .select_related("sender")
            .order_by("-timestamp")[:limit]
            .values("content", "sender__username", "timestamp")
        )

        messages = list(messages)
        messages.reverse()

        return [
            {
                "type": "chat_message",
                "message": msg["content"],
                "username": msg["sender__username"],
                "timestamp": msg["timestamp"].isoformat(),
            }
            for msg in messages
        ]

    async def send_message_history(self):
        """Fetch and send message history to the newly connected client."""
        try:
            messages = await self.get_message_history()
            print(f"Sending message history: {messages}")
            if messages:
                await self.send(
                    text_data=json.dumps(
                        {
                            "type": "message_history",
                            "messages": messages,
                        }
                    )
                )
            else:
                print("No messages found in history")
        except Exception as e:
            print(f"Error sending message history: {str(e)}")
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "message": "Failed to load message history",
                    }
                )
            )

    @database_sync_to_async
    def get_or_create_chat_room(self):
        try:
            print("111111111111111111111111111", self.room_name)
            # Sort usernames to ensure consistent room_id regardless of order
            user_id = sorted(self.room_name.split("_"))
            print("user_ids: ", user_id, user_id[0], user_id[1])
            if len(user_id) != 2:
                raise ValueError("Invalid room name format")

            user1 = CustomUser.objects.get(id=user_id[0])
            user2 = CustomUser.objects.get(id=user_id[1])
            # user1 = CustomUser.objects.get(id=user_ids[0])
            # user2 = CustomUser.objects.get(id=user_ids[1])
            
            print("-----------------before chat-room", user1)
            chat_room, created = ChatRoom.objects.create_room(user1, user2)
            print("-----------------after chat-room", user2)

            if chat_room:
                chat_room.last_message_at = timezone.now()
                chat_room.save(update_fields=["last_message_at"])

            print(f"Chat room {'created' if created else 'retrieved'}: {chat_room}")
            return chat_room

        except CustomUser.DoesNotExist as e:
            raise ObjectDoesNotExist(f"User not found: {str(e)}")
        except Exception as e:
            print(f"Error in get_or_create_chat_room: {str(e)}")
            raise

    async def disconnect(self, close_code):
        try:
            print(f"User {self.username} disconnected from room {self.room_name}")
            if hasattr(self, "room_group_name"):
                if self.room_group_name in self.connected_users:
                    self.connected_users[self.room_group_name].discard(self.username)
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        except Exception as e:
            print(f"Disconnect error: {str(e)}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json["message"]

            # Get the other user in the chat
            other_user = self.chat_room.user2 if self.chat_room.user1 == self.scope["user"] else self.chat_room.user1

            if not message:
                await self.send(text_data=json.dumps({"type": "error", "message": "Empty messages are not allowed"}))
                return

            # Check if either user has blocked the other
            if await self.is_blocked(self.scope["user"], other_user):
                await self.send(
                    text_data=json.dumps({"type": "error", "message": "Cannot send message: User is blocked"})
                )
                return

            timestamp = await self.save_message(message)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message,
                    "username": self.username,
                    "timestamp": timestamp.isoformat(),
                },
            )

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"type": "error", "message": "Invalid message format"}))
        except Exception as e:
            await self.send(text_data=json.dumps({"type": "error", "message": "Failed to process message"}))

    @database_sync_to_async
    def save_message(self, content):
        try:
            message = Message.objects.create(room=self.chat_room, sender=self.scope["user"], content=content)
            return message.timestamp
        except Exception as e:
            raise

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "message": event["message"],
                    "username": event["username"],
                    "timestamp": event["timestamp"],
                }
            )
        )

    @database_sync_to_async
    def is_blocked(self, sender, recipient):
        """Check if either user has blocked the other"""
        return BlockedUser.objects.filter(
            models.Q(user=sender, blocked_user=recipient) | models.Q(user=recipient, blocked_user=sender)
        ).exists()


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            if self.scope["user"] is None or self.scope["user"].is_anonymous:
                await self.close()
                return

            self.group_name = f"notifications_{self.scope['user'].username}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        except Exception as e:
            await self.close()

    async def disconnect(self, close_code):
        # Remove user from the group
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        # Send notification to WebSocket
        notification = event.get("notification", {})

        await self.send(
            text_data=json.dumps(
                {"type": "send_notification", "username": event.get("username", "system"), "notification": notification}
            )
        )
