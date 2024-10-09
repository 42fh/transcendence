import json
import time

from channels.generic.websocket import WebsocketConsumer
from django.core.cache import cache

class EchoConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        print("message received: ", message)
        cache.set("message", message)
        time_stamp = str(time.time())
        self.send(text_data=json.dumps({"message": "backend greets: " + time_stamp}))