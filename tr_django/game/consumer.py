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
        if 'message' in text_data_json:
            message = text_data_json['message']
            await self.send_to_all_clients({'message': message})
        elif 'type' in text_data_json and text_data_json['type'] == 'position':
            position = text_data_json['position']
            await self.send_to_all_clients({'type': 'position', 'position': position})

    async def send_to_all_clients(self, data):
        for client in self.connected_clients:
            await client.send(text_data=json.dumps(data))
        
