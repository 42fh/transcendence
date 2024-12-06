from datetime import timedelta
from django.utils import timezone
from typing import Dict

def get_base_tournament_data() -> Dict:
    """Creates base tournament data with current time"""
    now = timezone.now()
    
    return {
        "name": "Test Tournament",
        "description": "Test tournament description",
        "start_date": now + timedelta(days=4),
        "registration_start": now, 
        "registration_end": now + timedelta(days=3),
        "type": "single_elimination",
        "visibility": "public",
        "game_mode": "1v1",
        "min_participants": 2,
        "max_participants": 4
    }

def get_test_tournament_data() -> Dict:
    """Converts internal test data to frontend JSON format"""
    data = get_base_tournament_data()
    
    return {
        "name": data["name"],
        "description": data["description"],
        "startingDate": data["start_date"].replace(tzinfo=None).isoformat(),
        "registrationStart": data["registration_start"].replace(tzinfo=None).isoformat(), 
        "registrationClose": data["registration_end"].replace(tzinfo=None).isoformat(),
        "type": data["type"],
        "visibility": data["visibility"],
        "gameMode": data["game_mode"],
        "min_participants": data["min_participants"],
        "max_participants": data["max_participants"]
    }
