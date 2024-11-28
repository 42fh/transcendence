import requests
import random
import json

BASE_URL = "http://localhost:8000/api/game"

def test_api_endpoints():
    # Mock user ID
    user_id = random.randint(1000, 9999)
    headers = {
        'X-User-ID': str(user_id),
        'Content-Type': 'application/json'
    }

    # Test create game
    create_response = requests.post(
        f"{BASE_URL}/create_new_game/",
        json={'mode': 'regular'},
        headers=headers
    )
    print(f"\nCreate Game Response (Status {create_response.status_code}):")
    print(json.dumps(create_response.json(), indent=2))


if __name__ == "__main__":
    test_api_endpoints()
