
from typing import List, Dict, Optional 
import math

@classmethod
def setup_game(cls, settings: Dict[str, Any]) -> dict:

    try:
        settings.update(cls.calculate_player_side_indices(settings)
        setting.update(cls.calculate_vertices(settings))                                                                                                  
        settings.update(cls.calculate_sides_normals(settings))                                                                                                                                              
        settings.update(cls.calculate_inner_boundaries(settings))
        return settings  
    except Exception as e:
        print("FOOO") 

@classmethos
def calculate_vertices(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: calculate_vertices!")

@classmethos
def calculate_sides_normals(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: sides_normals!")

@classmethos
def calculate_inner_boundaries(cls, settings: Dict[str, Any]) -> dict:
    raise NotImplementedError("Subclasses must implement this: inner_boundaries!")


@classmethod
def calculate_player_side_indices(cls, settings: Dict[str, Any]) -> dict:
    """
 
    Determine which sides should be player sides with improved distribution.
    For high player counts (> sides/2), first alternates players, then fills remaining clockwise.
    
    Class method to calculate which sides should have paddles.
    Can be called before game instance creation.
        
        Args:
            settings: Dict containing game configuration
            
        Returns:
            list: Indices of sides that should have paddles

    """
    num_paddles = settings.get("num_players")
    num_sides = settings.get("sides")
    game_mode = settings.get("mode")
    game_type = settings.get("type")


    player_sides = []
    
    if game_mode == "classic" and num_paddles == 2 and num_sides == 4:
        player_sides = [1, 3]  # Vertical sides for classic Pong layout
    elif num_paddles == 2:
        # For 2 players, prefer opposite sides
        half_sides = num_sides // 2
        player_sides = [0, half_sides]  # Top and bottom when possible
    else:
        half_sides = num_sides // 2
        if num_paddles <= half_sides:
            # If players <= half sides, distribute evenly
            spacing = math.floor(num_sides / num_paddles)
            for i in range(num_paddles):
                player_sides.append((i * spacing) % num_sides)
        else:
            # First place players on alternating sides
            for i in range(half_sides):
                player_sides.append(i * 2)

            # Then fill remaining players clockwise in the gaps
            remaining_players = num_paddles - half_sides
            current_side = 1  # Start with the first gap

            while remaining_players > 0:
                if current_side not in player_sides:
                    player_sides.append(current_side)
                    remaining_players -= 1
                current_side = (current_side + 2) % num_sides

                # If we've gone all the way around, start filling sequential gaps
                if current_side == 1 and remaining_players > 0:
                    current_side = 1
                    while remaining_players > 0:
                        if current_side not in player_sides:
                            player_sides.append(current_side)
                            remaining_players -= 1
                        current_side = (current_side + 1) % num_sides

    # Sort the sides for consistent ordering
    player_sides.sort()

    print(
        f"Sides: {num_sides}, Players: {num_paddles}, Distribution: {player_sides}" # debug
    )
    return {"players_sides": player_sides)


