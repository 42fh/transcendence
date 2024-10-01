import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.channel_layer.group_add("pingpong_messages", self.channel_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("pingpong_messages", self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.channel_layer.group_send(
            "pingpong_messages",
            {
                'type': 'game_message',
                'message': message
            }
        )

    async def game_message(self, event):
        message = event['message']

        await self.send(text_data=json.dumps({
            'message': message
        }))