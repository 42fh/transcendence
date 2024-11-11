import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from chat.models import ChatRoom, Message, BlockedUser
from django.db import models


class ChatConsumer(AsyncWebsocketConsumer):
    connected_users = {}

    async def connect(self):
        try:
            self.room_name = self.scope["url_route"]["kwargs"].get("room_name")
            if not self.room_name:
                # print("DEBUG: Room name is missing")
                await self.close()
                return

            self.room_group_name = f"chat_{self.room_name}"

            if self.scope["user"].is_anonymous:
                # print("DEBUG: Anonymous user connection rejected")
                await self.close()
                return

            self.username = self.scope["user"].username
            # print(f"DEBUG: User {self.username} connecting to room {self.room_name}")

            try:
                self.chat_room = await self.get_or_create_chat_room()
                if not self.chat_room:
                    print("DEBUG: Failed to create or get chat room")
                    await self.close()
                    return
            except ObjectDoesNotExist as e:
                print(f"DEBUG: User not found error: {str(e)}")
                await self.close()
                return
            except Exception as e:
                print(f"DEBUG: Chat room error: {str(e)}")
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
            print(f"DEBUG: Connection error: {str(e)}")
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
                print("DEBUG: No messages found in history")
        except Exception as e:
            print(f"DEBUG: Error sending message history: {str(e)}")
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
            usernames = self.room_name.split("_")
            if len(usernames) != 2:
                raise ValueError("Invalid room name format")

            user1 = User.objects.get(username=usernames[0])
            user2 = User.objects.get(username=usernames[1])

            chat_room, created = ChatRoom.objects.get_or_create(
                room_id=self.room_name, defaults={"user1": user1, "user2": user2}
            )

            if not created:
                chat_room.last_message_at = timezone.now()
                chat_room.save(update_fields=["last_message_at"])

            print(f"DEBUG: Chat room {'created' if created else 'retrieved'}: {chat_room}")
            return chat_room

        except User.DoesNotExist as e:
            raise ObjectDoesNotExist(f"User not found: {str(e)}")
        except Exception as e:
            print(f"DEBUG: Error in get_or_create_chat_room: {str(e)}")
            raise

    async def disconnect(self, close_code):
        try:
            print(f"DEBUG: User {self.username} disconnected from room {self.room_name}")
            if hasattr(self, "room_group_name"):
                if self.room_group_name in self.connected_users:
                    self.connected_users[self.room_group_name].discard(self.username)
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        except Exception as e:
            print(f"DEBUG: Disconnect error: {str(e)}")

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json["message"]

            # Get the other user in the chat
            other_user = self.chat_room.user2 if self.chat_room.user1 == self.scope["user"] else self.chat_room.user1

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
                    "username": self.scope["user"].username,
                    "timestamp": timestamp.isoformat() if timestamp else None,
                },
            )
        except Exception as e:
            print(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({"type": "error", "message": "Failed to process message"}))

    @database_sync_to_async
    def save_message(self, content):
        try:
            message = Message.objects.create(room=self.chat_room, sender=self.scope["user"], content=content)
            print(f"DEBUG: Message saved: {message.content} at {message.timestamp}")
            return message.timestamp
        except Exception as e:
            print(f"DEBUG: Error saving message: {str(e)}")
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
