from django.utils import timezone
import datetime
from datetime import timedelta



def get_test_tournament_data(override_data=None):
    now = timezone.now()
    override_data = override_data or {}
    
    # Ensure datetime fields are datetime objects, not strings
    start_date = override_data.get('start_date', now + timedelta(hours=1.01))
    registration_start = override_data.get('registration_start', now) 
    registration_close = override_data.get('registration_close', now + timedelta(hours=1))
    default_data = {
        "name": override_data.get('name', "Debug Tournament"),
        "description": override_data.get('description', "Test tournament"),
        "type": override_data.get('type', "single_elimination"),
        "start_date": start_date,
        "registration_start": registration_start,
        "registration_close": registration_close,
        "min_participants": override_data.get('min_participants', 2),
        "max_participants": override_data.get('max_participants', 4),
        "visibility": override_data.get('visibility', "public"),
        "game_settings": override_data.get('game_settings', {
            "mode": "classic",
            "score": {"max": 5}
        })
    }
    return default_data
