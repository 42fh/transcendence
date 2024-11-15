def initialize_cycle_data(self):
    """Initialize data structure for tracking events and metrics"""
    return {
        "events": [],
        "highest_distance": 0,
        "state_updates": {},
        "collision_data": [],
    }


#
#
# def update_distance_metrics(self, distance, cycle_data):
#    """Update distance-related metrics"""
#    cycle_data["highest_distance"] = max(cycle_data["highest_distance"], distance)
#
#
#
# def add_game_over_event(self, cycle_data, state):
#    """Add game over event to cycle data"""
#    cycle_data["events"].append({
#        "type": "game_over",
#        "winner": self.determine_winner(state)
#    })
