import requests
import random
import json
import time
import websockets
import asyncio


BASE_URL = "http://localhost:8000/api/game"



async def client_session(user_id, ws_url):
    async with websockets.connect(ws_url) as websocket:
        print(f"Client {user_id} connected")
        while True:
            message = await websocket.recv()
            print(f"Client {user_id} received: {message}")



async def test_api_endpoints():
    # Mock user ID
    user_id = random.randint(1000, 9999)
    headers = {
        'X-User-ID': str(user_id),
        'Content-Type': 'application/json'
    }

    # Test create game
    response = requests.post(
        f"{BASE_URL}/create_new_game/",
        json={'mode': 'classic', "sides": 7},
        headers=headers
    )
    game_url = response.json()['ws_url']
    await client_session(user_id, game_url)     
    print(f"\nCreate Game Response (Status {response.status_code}):")
    print(json.dumps(response.json(), indent=2))
    
   
  #  time.sleep(1)  # 1 second delay

 
    create_response = requests.post(
        f"{BASE_URL}/create_new_game/",
        json={'mode': 'regular'},
        headers=headers
    )
    print(f"\nCreate Game Response (Status {create_response.status_code}):")
    print(json.dumps(create_response.json(), indent=2))


if __name__ == "__main__":
    asyncio.run(test_api_endpoints())

"""
import requests
import random
import json
import time

BASE_URL = "http://localhost:8000/api/game"


async def run_multiple_clients(num_clients):
    tasks = []
    game_url = None
    
    for i in range(num_clients):
        user_id = random.randint(1000, 9999)
        headers = {
            'X-User-ID': str(user_id),
            'Content-Type': 'application/json'
        }

        if i == 0:  # First client creates the game
            response = requests.post(
                f"{BASE_URL}/create_new_game/",
                json={'mode': 'regular'},
                headers=headers
            )
            game_url = response.json()['websocket_url']
        
        task = asyncio.create_task(client_session(user_id, game_url))
        tasks.append(task)
        await asyncio.sleep(0.5)  # Slight delay between client connections

    await asyncio.gather(*tasks)

if __name__ == "__main__":
    num_clients = 4  # Adjust as needed
    asyncio.run(run_multiple_clients(num_clients))
"""
