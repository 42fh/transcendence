import asyncio
import websockets
import json

# empty dictionary
chats = {}

async def handler(websocket):
	try:
		# Keep the connection open and handle incoming messages if needed
		async for message in websocket:
			data = json.loads(message)
			chat = data.get("chat_id")
			
			if (data.get("type") == "message"):
				await broadcaster(message, chats[chat]) # broadcast the message to all clients that are subscribed to the chat
			elif (data.get("type") == "unsubscribe"): # client wants to unsubscribe from a chat
				if (chat in chats):
					chats[chat].remove(websocket)
			elif (data.get("type") == "subscribe"): # client wants to subscribe to a chat
				if (chat not in chats):
					chats[chat] = set()
				chats[chat].add(websocket)
	except websockets.exceptions.ConnectionClosed as e:
		print(f"Client disconnected: {e}")
	finally:
		# Remove the client from the set of connected clients
		if (chat in chats):
			chats[chat].remove(websocket)

async def broadcaster(message, clients):
	# send a message to every connected client
	tasks = [asyncio.create_task(client.send(message)) for client in clients]
	# Wait for all tasks to complete
	await asyncio.gather(*tasks)
            
            

async def main():
    async with websockets.serve(handler, "", 8001):
        await asyncio.Future()
		# await broadcaster()


if __name__ == "__main__":
    asyncio.run(main())

# async def broadcaster():
# 	while True:
# 		if connected_clients:
# 			message = "Hello!"
# 			tasks = [asyncio.create_task(client.send(message)) for client in connected_clients]
# 			# Wait for all tasks to complete
# 			await asyncio.gather(*tasks)
# 		await asyncio.sleep(5)