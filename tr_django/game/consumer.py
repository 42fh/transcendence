import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    connected_clients = []

    async def connect(self):
        self.connected_clients.append(self)

        await self.accept()

    async def disconnect(self, close_code):
        self.connected_clients.remove(self)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        await self.send_to_all_clients(message)

    async def send_to_all_clients(self, message):
        for client in self.connected_clients:
            await client.send(text_data=json.dumps({
                'message': message
            }))
