def reset_ball(self, ball, ball_index, speed=0.006):
    """
    Extends parent reset_ball method by also resetting movement tracking.
    
    Args:
        ball (dict): Ball object to reset
        speed (float): Initial ball speed
    Returns:
        dict: Updated ball object
    """
    # Call parent method first
    ball = super().reset_ball(ball, speed)
    
    # Add our polygon-specific reset
    self.reset_movement_tracking()
    
    return ball
