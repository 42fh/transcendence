# chat/consumers.py
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
        await self.send(text_data=json.dumps({"type": "sendMessage", "message": message, "username": username}))

    async def user_list(self, event):
        users = event["users"]
        await self.send(text_data=json.dumps({"type": "user_list", "users": users}))

class OneToOneChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        username = text_data_json['username']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        username = event['username']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message,
            'username': username
        }))
