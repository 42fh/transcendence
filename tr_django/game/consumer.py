import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
	async def connect(self):#method called when websocket connection is established
		await self.accept()

	async def disconnect(self, close_code):
		pass # method is empty (pass): no action is taken on disconnection

	async def receive(self, text_data):
		text_data_json = json.loads(text_data) #parses the JSON string into a Python dictionary.
		message = text_data_json['message']

		#echo server (sends back message)
		await self.send(text_data=json.dumps({'message':message}))