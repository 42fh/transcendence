import random


def _calculate_base_deformation(self):
    """Calculate deformation based on game mode"""
    player_density = self.num_paddles / self.num_sides

    if self.game_mode == "irregular":
        # Original balanced ratios
        if self.num_sides == 4:
            return 4 / 3 if self.num_paddles == 2 else 1.0
        else:
            if player_density <= 0.5:
                return 1.0 + (player_density * 0.5)
            else:
                return 1.25 - (player_density * 0.25)

    elif self.game_mode == "crazy":
        # Extreme deformation
        if self.num_sides == 4:
            return 4 / 3 if self.num_paddles == 2 else 1.0
        else:
            return 1.8 if player_density <= 0.5 else 1.5

    elif self.game_mode == "star":
        # Alternating long and short sides
        return 2.2 if player_density <= 0.3 else 1.8

    return 1.0  # Default if mode not recognized


def _calculate_side_ratios(self):
    """Calculate ratios based on game mode"""
    base_deform = self._calculate_base_deformation()

    if self.game_mode == "irregular":
        return self._calculate_regular_ratios(
            base_deform
        )  # This is now our irregular mode
    elif self.game_mode == "crazy":
        return self._calculate_crazy_ratios(base_deform)
    elif self.game_mode == "star":
        return self._calculate_star_ratios(base_deform)
    else:
        return self._calculate_regular_ratios(base_deform)  # Default


def _calculate_regular_ratios(self, base_deform):
    """Original balanced ratio calculation"""
    ratios = [1.0] * self.num_sides
    angle_adjustments = [0] * self.num_sides

    if self.num_sides == 4:
        if self.num_paddles == 2:
            # Special handling for rectangle
            if 0 in self.active_sides and 2 in self.active_sides:
                ratios[0] = ratios[2] = base_deform
                ratios[1] = ratios[3] = 1.0
            elif 1 in self.active_sides and 3 in self.active_sides:
                ratios[0] = ratios[2] = 1.0
                ratios[1] = ratios[3] = base_deform
        else:
            # More square-like for more players
            for i in self.active_sides:
                ratios[i] = base_deform
    else:
        # General polygon case
        for side in self.active_sides:
            ratios[side] = base_deform
            prev_side = (side - 1) % self.num_sides
            next_side = (side + 1) % self.num_sides
            ratios[prev_side] = 1.0 + (base_deform - 1.0) * 0.5
            ratios[next_side] = 1.0 + (base_deform - 1.0) * 0.5

        # Smooth out the ratios
        smoothed_ratios = ratios.copy()
        for i in range(self.num_sides):
            prev_ratio = ratios[(i - 1) % self.num_sides]
            next_ratio = ratios[(i + 1) % self.num_sides]
            smoothed_ratios[i] = (prev_ratio + 2 * ratios[i] + next_ratio) / 4
        ratios = smoothed_ratios

    return ratios, angle_adjustments


def _calculate_crazy_ratios(self, base_deform):
    """Extreme ratio calculation with sharp transitions"""
    ratios = [0.6] * self.num_sides  # Compressed non-player sides
    angle_adjustments = [0] * self.num_sides

    # Set player sides
    for side in self.active_sides:
        ratios[side] = base_deform
        if (side + 1) % self.num_sides not in self.active_sides:
            angle_adjustments[side] = random.uniform(-0.26, 0.26)

    return ratios, angle_adjustments


def _calculate_star_ratios(self, base_deform):
    """Star-like shape with alternating long and short sides"""
    ratios = [0.4 if i % 2 == 0 else 1.2 for i in range(self.num_sides)]
    angle_adjustments = [0] * self.num_sides

    # Ensure player sides are equal
    for side in self.active_sides:
        ratios[side] = base_deform

    return ratios, angle_adjustments
