import requests

# Base URL
base_url = "http://127.0.0.1:8080/api/game"

# Test creating a new game
print("\nTesting create_new_game:")
try:
    data_to_send = {"mode": "regular"}
    response1 = requests.post(f"{base_url}/create_new_game/", json=data_to_send)
    print(f"Status: {response1.status_code}")
    print("Response:", response1.json())
except Exception as e:
    print(f"Error: {e}")

# Test getting all games
print("\nTesting get_all_games:")
try:
    response = requests.get(f"{base_url}/get_all_games/")
    print(f"Status: {response.status_code}")
    print("Response:", response.json())
except Exception as e:
    print(f"Error: {e}")
# Test getting all games
print("\nTesting get settings:")
try:
    data_to_send = response1.json().get("game_id")  
    print(data_to_send)
    response = requests.get(f"{base_url}/get_detail_from_game?game_id={data_to_send}")
    print(f"Status: {response.status_code}")
    print("Response:", response.json())
except Exception as e:
    print(f"Error: {e}")
