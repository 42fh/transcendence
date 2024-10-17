import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    connected_users = set()

    async def connect(self):
        self.roomGroupName = "group_chat_gfg"
        self.username = self.scope["user"].username

        if not self.username:
            await self.close()
            return

        ChatConsumer.connected_users.add(self.username)

        await self.channel_layer.group_add(
            self.roomGroupName,
            self.channel_name
        )
        await self.accept()

        await self.channel_layer.group_send(
            self.roomGroupName,
            {
                "type": "user_list",
                "users": list(ChatConsumer.connected_users)
            }
        )

    async def disconnect(self, close_code):
        ChatConsumer.connected_users.discard(self.username)
        await self.channel_layer.group_discard(
            self.roomGroupName,
            self.channel_name
        )

        await self.channel_layer.group_send(
            self.roomGroupName,
            {
                "type": "user_list",
                "users": list(ChatConsumer.connected_users)
            }
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        await self.channel_layer.group_send(
            self.roomGroupName, {
                "type": "sendMessage",
                "message": message,
                "username": self.username,
            }
        )

    async def sendMessage(self, event):
        message = event["message"]
        username = event["username"]
        await self.send(text_data=json.dumps({"message": message, "username": username}))

    async def user_list(self, event):
        users = event["users"]
        await self.send(text_data=json.dumps({"type": "user_list", "users": users}))
