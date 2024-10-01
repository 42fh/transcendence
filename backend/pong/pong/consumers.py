import json

from channels.generic.websocket import WebsocketConsumer

class echoConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self):
        print(self.__str__())

    def receive(self, text_data):
        print("text_data = ", text_data)
        obj = json.loads(text_data)
        print("obj = ", obj)
        message = obj['greeting']
        self.send(text_data=json.dumps({"reply" : message}))