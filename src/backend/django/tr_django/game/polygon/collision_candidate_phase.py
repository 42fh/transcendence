# Collision Candidate Phase

def check_ball_movement_relative_to_side(self, ball, side_index, ball_index, new_state): 
    # Get normal from class's side_normals
    normal = self.side_normals[side_index]
    start = self.vertices[side_index]
    
    # Calculate current state
    signed_distance = float(
        (ball['x'] - start['x']) * normal['x'] + 
        (ball['y'] - start['y']) * normal['y']
    )
    
    current_distance = abs(signed_distance)
    current_dot_product = float(
        ball['velocity_x'] * normal['x'] + 
        ball['velocity_y'] * normal['y']
    )
    
    PARALLEL_THRESHOLD = float(1e-10) # can be global or const , in c it would stand in a h file
    # Get previous state
    previous_movement = self.previous_movements[ball_index]['sides'][side_index]
    previous_signed_distance = float(previous_movement['distance'])
    previous_dot_product = float(previous_movement['dot_product'])
    was_approaching = previous_dot_product < PARALLEL_THRESHOLD
    
    # Case 1: Ball is parallel to side
    PARALLEL_THRESHOLD = float(1e-10) # can be global or const , in c it would stand in a h file
    if abs(current_dot_product) < PARALLEL_THRESHOLD:
        #current_distance = self.check_paddle(current_distance, new_state, side_index, ball)# this should reduze the distance to side with the paddle width plus radius 
        self.update_ball_movement(ball_index, side_index, current_distance, current_dot_product)
        return {
            'is_approaching': True,
            'current_distance': float(current_distance),
            'approach_speed': float(0.0),
            'type': 'parallel'
        }
    
    # Case 2: Ball is moving towards side
    if current_dot_product < 0:
        #current_distance = self.check_paddle(current_distance, new_state, side_index, ball)# this should reduze the distance to side with the paddle width plus radius  
        self.update_ball_movement(ball_index, side_index, current_distance, current_dot_product, signed_distance)
        return {
            'is_approaching': True,
            'current_distance': float(current_distance),
            'approach_speed': float(abs(current_dot_product)),
            'type': 'approaching'
        }
    
    # Case 3: Ball is moving away from side
    else:
        # Case 3a: Was already moving away
        if not was_approaching:
            self.update_ball_movement(ball_index, side_index, current_distance, current_dot_product, signed_distance)
            return {
                'is_approaching': False,
                'current_distance': float(current_distance),
                'approach_speed': float(abs(current_dot_product)),
                'type': 'moving_away'
            }
        
        # Case 3b: Was moving towards last frame
        else:
            if was_approaching and abs(previous_dot_product) > PARALLEL_THRESHOLD:
                
                # Check for tunneling using position and velocity signs
                position_sign_changed = (current_distance * previous_signed_distance < 0)
            
                # Case 3ba: Tunneling detected
                if position_sign_changed:
                    print("3ba")
                    # Don't update previous_movements for tunneling case
                    # This preserves the state before tunneling for proper bounce handling
                    return {
                        'is_approaching': True,  # Consider approaching for collision handling
                        'current_distance': float(min(current_distance, previous_signed_distance)),
                        'approach_speed': float(abs(current_dot_product)),
                        'type': 'tunneling'
                }
            print("3bb") 
            # Case 3bb: Regular moving away (including post-bounce)
            self.update_ball_movement(ball_index, side_index, current_distance, current_dot_product,signed_distance)
            return {
                    'is_approaching': False,
                    'current_distance': float(current_distance),
                    'approach_speed': float(abs(current_dot_product)),
                    'type': 'moving_away'
            }



def check_paddle(self, current_distance, new_state, side_index, ball):
    """Helper function to check paddle collision and adjust distance"""
    if side_index not in self.active_sides:
        return current_distance
        
    # Calculate paddle width plus ball size for collision zone
    total_width = new_state['dimensions']['paddle_width'] + ball['size']
    return current_distance - total_width

