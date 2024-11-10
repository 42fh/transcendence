
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
            
            # Step 2: Check if ball is in valid game field
            distance_from_center = self.get_distance(ball) 
            self.update_distance_metrics(distance_from_center, cycle_data)
            boundary_check = self.handle_distance_check(ball, distance_from_center, new_state)
            if boundary_check.get("skip_ball"):
                if boundary_check.get("game_over"):
                    game_over = True
                    self.add_game_over_event(cycle_data, new_state)
                    break
                continue
                
            if boundary_check.get("continue_ball"):
                continue                    
                
            # if ball should be. 
            # Step 3: Find closest side that might result in a collision
            collision_candidate = self.find_collision_candidate(ball, ball_index, new_state, distance_from_center)
            if not collision_candidate:
                continue
                
            # Step 4: Verify if candidate results in actual collision
            verified_collision = self.verify_collision_candidate(ball, collision_candidate, new_state)
            if not verified_collision:
                continue

            # Step 5: Process collision effects and events
            collision_result = self.handle_collision_with_events(verified_collision, ball, new_state, cycle_data)
            
            if collision_result.get("game_over"):
                game_over = True
                self.add_game_over_event(cycle_data, new_state)
                break            

        return new_state, game_over, cycle_data
    

    def move_ball(self, ball):
        """Move ball according to its velocity"""
        ball["x"] += ball["velocity_x"]
        ball["y"] += ball["velocity_y"]


    def handle_distance_check(self, ball, distance, state, cycle_data):
        """Handle distance checks and related actions"""
        result = {
            "skip_ball": False,
            "continue_ball": False,
            "game_over": False
        }
        
        if distance > self.outer_boundary:
            collision = self.handle_outside_boundary(ball, state)
            if collision:
                collision_result = self.handle_collision_with_events(collision, ball, state, cycle_data)
                result.update(collision_result)
                
        elif distance < self.get_inner_boundary(state, ball):
            result["continue_ball"] = True
            
        return result


    def handle_outside_boundary(self, ball, state):
        """Handle ball outside boundary"""
        sector_info = None
        return self.handle_tunneling(ball, sector_info, state) 
   

 
    def handle_pair_situation(self, ball, pair_info, state):
        """Handle interaction between ball and side"""
        if pair_info["type"] == "tunneling":
            return self.handle_tunneling(ball, pair_info, state)
            
        if pair_info["distance"] <= self.get_collision_check_range():
            # Priority 2: Handle near-side collisions
            if pair_info['type'] == 'parallel':
                # Case 1: Ball moving parallel to side
                return self.handle_parallel(ball, pair_info, new_state)
            elif pair_info['side_index'] in self.active_sides:
                # Case 2: Ball near active paddle side
                return self.handle_paddle(ball, pair_info, new_state)
            else
                # Case 3: Ball near wall
                return self.handle_wall(ball,  pair_info, new_state)
            
        return None


    def handle_collision_with_events(self, collision, ball, state, cycle_data):
        """Handle collision and generate appropriate events"""
            
        result = {"game_over": False} 
        
        if collision["type"] == "paddle":
            self.handle_paddle_collision_with_events(collision, ball, cycle_data)
            
        elif collision["type"] == "wall":
            self.handle_wall_collision_with_events(collision, ball, cycle_data)
            
        elif collision["type"] == "miss":
            result.update(self.handle_miss_collision_with_events(collision, ball, state, cycle_data))
            
        elif collision["type"] == "tunneling": # ? 
            print ("TUNNELING HANDLE COLLISION WITH EVENT")
            # self.handle_tunneling(ball,state,  cycle_data)
            
        return result



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
    



    def update_scores(self, current_scores, failed_player_index):
        """
        Update scores when a player fails to hit the ball
        Args:
            current_scores (list): Current scores
            failed_player_index (int): Index of player who missed
        Returns:
            list: Updated scores
        """
        return [score + (1 if i != failed_player_index else 0) for i, score in enumerate(current_scores)]


    def check_winner(self, scores, win_threshold=11):
        max_score = max(scores)
        if max_score >= win_threshold:
            # Find all players with max score
            return [i for i, score in enumerate(scores) if score == max_score]
        return []
