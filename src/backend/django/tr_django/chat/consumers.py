import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    connected_users = {}

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"].get(
            "room_name", "group_chat"
        )
        self.room_group_name = f"chat_{self.room_name}"

        print(f"Attempting connection to room: {self.room_name}")

        if self.scope["user"].is_anonymous:
            print("non-logged user tried to connect")
            await self.close()
            return

        self.username = self.scope["user"].username
        print(f"User {self.username} connects to {self.room_group_name}")

        if self.room_group_name not in ChatConsumer.connected_users:
            ChatConsumer.connected_users[self.room_group_name] = set()

        ChatConsumer.connected_users[self.room_group_name].add(self.username)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

        await self.update_user_list()
        print(
            f"Current users in {self.room_group_name}: {ChatConsumer.connected_users[self.room_group_name]}"
        )

    async def disconnect(self, close_code):
        if hasattr(self, "username") and hasattr(self, "room_group_name"):
            print(f"User {self.username} disconnecting from {self.room_group_name}")

            if self.room_group_name in ChatConsumer.connected_users:
                ChatConsumer.connected_users[self.room_group_name].discard(
                    self.username
                )

                if not ChatConsumer.connected_users[self.room_group_name]:
                    del ChatConsumer.connected_users[self.room_group_name]

            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

            await self.update_user_list()

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json["message"]

            print(
                f"Received message from {self.username} in {self.room_group_name}: {message}"
            )

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "chat_message", "message": message, "username": self.username},
            )

        except Exception as e:
            print(f"Error in receive: {str(e)}")

    async def chat_message(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_message",
                    "message": event["message"],
                    "username": event["username"],
                }
            )
        )

    async def update_user_list(self):
        if self.room_group_name in ChatConsumer.connected_users:
            users = list(ChatConsumer.connected_users[self.room_group_name])

            await self.channel_layer.group_send(
                self.room_group_name, {"type": "user_list", "users": users}
            )

    async def user_list(self, event):
        await self.send(
            text_data=json.dumps({"type": "user_list", "users": event["users"]})
        )
