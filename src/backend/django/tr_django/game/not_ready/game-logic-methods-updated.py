from abc import ABC, abstractmethod
import math
import random

class AGameManager(ABC):
    def __init__(self, game_id):
        super().__init__(game_id)
        # Initialize metrics tracking
        self.game_metrics = {
            "total_paddle_hits": 0,
            "total_wall_hits": 0,
            "total_tunneling_events": 0,
            "total_balls_reset": 0,
            "highest_recorded_distance": 0,
            "longest_rally": 0,
            "current_rally": 0
        }
        
        # Initialize frontend event configuration
        self.frontend_events = {
            "paddle_hit": {
                "enabled": True,
                "data": ["hit_position", "ball_speed", "paddle_index"]
            },
            "wall_hit": {
                "enabled": True,
                "data": ["hit_position", "wall_index"]
            },
            "ball_reset": {
                "enabled": True,
                "data": ["failed_paddle_index", "new_scores"]
            },
            "tunneling": {
                "enabled": True,
                "data": ["entry_point", "exit_point"]
            },
            "combo": {
                "enabled": True,
                "data": ["combo_count", "time_active"]
            }
        }

    async def game_logic(self, current_state):
        """
        Main game logic orchestrator that uses the step methods.
        Returns (new_state, game_over, cycle_data)
        """
        game_over = False
        new_state = current_state.copy()
        cycle_data = self.initialize_cycle_data()
        
        for ball_index, ball in enumerate(new_state["balls"]):
            # Step 1: Move ball
            self.move_ball(ball)
            
            # Step 2: Check ball distance and update metrics
            distance = self.get_ball_distance(ball)
            self.update_distance_metrics(distance, cycle_data)
            distance_result = self.handle_distance_check(ball, distance, new_state)
            
            if distance_result.get("skip_ball"):
                if distance_result.get("game_over"):
                    game_over = True
                    self.add_game_over_event(cycle_data, new_state)
                    break
                continue
                
            if distance_result.get("continue_ball"):
                continue
            
            # Step 3: Get current sector
            sector_info = self.get_ball_sector(ball, ball_index, new_state)
            if not sector_info:
                continue
                
            # Step 4: Handle side/ball interaction
            collision = self.handle_side_ball_situation(ball, sector_info, new_state)
            
            # Step 5: Handle collision outcomes with events
            collision_result = self.handle_collision_with_events(collision, ball, new_state, cycle_data)
            
            if collision_result.get("game_over"):
                game_over = True
                self.add_game_over_event(cycle_data, new_state)
                break
                
            if collision_result.get("skip_ball"):
                continue
        
        return new_state, game_over, cycle_data
    
    def move_ball(self, ball):
        """Move ball according to its velocity"""
        ball["x"] += ball["velocity_x"]
        ball["y"] += ball["velocity_y"]
    
    @abstractmethod
    def get_ball_distance(self, ball):
        """Get distance from ball to game center"""
        pass
    
    def handle_distance_check(self, ball, distance, state):
        """Handle distance checks and related actions"""
        result = {
            "skip_ball": False,
            "continue_ball": False,
            "game_over": False
        }
        
        if distance > self.get_outer_boundary():
            collision = self.handle_outside_boundary(ball, state)
            if collision:
                collision_result = self.handle_collision_with_events(collision, ball, state, self.initialize_cycle_data())
                result.update(collision_result)
                
        elif distance <= self.get_inner_boundary():
            result["continue_ball"] = True
            
        return result
    
    @abstractmethod
    def get_ball_sector(self, ball, ball_index, state):
        """Determine which sector the ball is in"""
        pass
    
    def handle_side_ball_situation(self, ball, sector_info, state):
        """Handle interaction between ball and side"""
        if sector_info["type"] == "tunneling":
            return self.handle_tunneling(ball, sector_info, state)
            
        if sector_info["distance"] <= self.get_collision_check_range():
            return self.handle_side_collision(ball, sector_info, state)
            
        return None
    
    @abstractmethod
    def handle_tunneling(self, ball, sector_info, state):
        """Handle case where ball may have passed through a side"""
        pass
    
    @abstractmethod
    def handle_side_collision(self, ball, sector_info, state):
        """Handle collision between ball and side"""
        pass
    
    def handle_collision_with_events(self, collision, ball, state, cycle_data):
        """Handle collision and generate appropriate events"""
        if not collision:
            return {"game_over": False, "skip_ball": False}
            
        result = {"game_over": False, "skip_ball": False}
        
        if collision["type"] == "paddle":
            self.handle_paddle_collision_with_events(collision, ball, cycle_data)
            
        elif collision["type"] == "wall":
            self.handle_wall_collision_with_events(collision, ball, cycle_data)
            
        elif collision["type"] == "miss":
            result.update(self.handle_miss_collision_with_events(collision, ball, state, cycle_data))
            
        elif collision["type"] == "tunneling":
            self.handle_tunneling_collision_with_events(collision, ball, cycle_data)
            
        return result
    
    def initialize_cycle_data(self):
        """Initialize data structure for tracking events and metrics"""
        return {
            "events": [],           
            "highest_distance": 0,  
            "state_updates": {},    
            "collision_data": []    
        }
    
    @abstractmethod
    def get_outer_boundary(self):
        """Get the outer boundary distance"""
        pass
    
    @abstractmethod
    def get_inner_boundary(self):
        """Get the inner safe zone boundary"""
        pass
    
    @abstractmethod
    def get_collision_check_range(self):
        """Get the collision check distance"""
        pass
    
    def handle_outside_boundary(self, ball, state):
        """Handle ball outside boundary"""
        return {
            "type": "miss",
            "failed_side_index": self.get_nearest_side_index(ball)
        }
    
    @abstractmethod
    def get_nearest_side_index(self, ball):
        """Get index of nearest side"""
        pass
    
    @abstractmethod
    def determine_winner(self, state):
        """Determine the winner of the game"""
        pass
    
    def update_distance_metrics(self, distance, cycle_data):
        """Update distance-related metrics"""
        cycle_data["highest_distance"] = max(cycle_data["highest_distance"], distance)
        self.game_metrics["highest_recorded_distance"] = max(
            self.game_metrics["highest_recorded_distance"],
            distance
        )

    # Event handling methods moved from game_logic_combined
    def handle_paddle_collision_with_events(self, collision, ball, cycle_data):
        """Handle paddle collision and generate events"""
        self.game_metrics["total_paddle_hits"] += 1
        self.game_metrics["current_rally"] += 1
        self.game_metrics["longest_rally"] = max(
            self.game_metrics["longest_rally"],
            self.game_metrics["current_rally"]
        )
        
        if self.frontend_events["paddle_hit"]["enabled"]:
            cycle_data["events"].append({
                "type": "paddle_hit",
                "data": {
                    "hit_position": collision.get("hit_position"),
                    "ball_speed": math.sqrt(ball["velocity_x"]**2 + ball["velocity_y"]**2),
                    "paddle_index": collision.get("paddle_index"),
                    "combo_count": self.game_metrics["current_rally"]
                }
            })
        
        self.apply_paddle_bounce(ball, collision)
        cycle_data["collision_data"].append({
            "type": "paddle",
            "position": [ball["x"], ball["y"]],
            "velocity": [ball["velocity_x"], ball["velocity_y"]]
        })

    def handle_wall_collision_with_events(self, collision, ball, cycle_data):
        """Handle wall collision and generate events"""
        self.game_metrics["total_wall_hits"] += 1
        if self.frontend_events["wall_hit"]["enabled"]:
            cycle_data["events"].append({
                "type": "wall_hit",
                "data": {
                    "hit_position": {"x": ball["x"], "y": ball["y"]},
                    "wall_index": collision.get("wall_index")
                }
            })
        self.apply_wall_bounce(ball, collision)

    def handle_miss_collision_with_events(self, collision, ball, state, cycle_data):
        """Handle miss collision and generate events"""
        self.game_metrics["current_rally"] = 0
        self.game_metrics["total_balls_reset"] += 1
        
        if self.frontend_events["ball_reset"]["enabled"]:
            cycle_data["events"].append({
                "type": "ball_reset",
                "data": {
                    "failed_paddle_index": collision["failed_side_index"],
                    "new_scores": state["scores"]
                }
            })
        
        state["scores"] = self.update_scores(state["scores"], collision["failed_side_index"])
        self.reset_ball(ball)
        
        return {
            "game_over": self.check_winner(state["scores"]),
            "skip_ball": True
        }

    def handle_tunneling_collision_with_events(self, collision, ball, cycle_data):
        """Handle tunneling collision and generate events"""
        self.game_metrics["total_tunneling_events"] += 1
        if self.frontend_events["tunneling"]["enabled"]:
            cycle_data["events"].append({
                "type": "tunneling",
                "data": {
                    "entry_point": collision.get("entry_point"),
                    "exit_point": collision.get("exit_point")
                }
            })
        if collision.get("is_paddle"):
            self.apply_paddle_bounce(ball, collision)
        else:
            self.apply_wall_bounce(ball, collision)

    def add_game_over_event(self, cycle_data, state):
        """Add game over event to cycle data"""
        cycle_data["events"].append({
            "type": "game_over",
            "winner": self.determine_winner(state)
        })
