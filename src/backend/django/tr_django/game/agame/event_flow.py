def initialize_cycle_data(self):
    """Initialize data structure for tracking events and metrics"""
    return {
        "events": [],
        "highest_distance": 0,
        "state_updates": {},
        "collision_data": [],
    }

