from dataclasses import dataclass, field, asdict
import uuid
import json

@dataclass
class game_state():
    unique_game_id:uuid = 0
    player_1_id:int = 0
    player_2_id:int = 0
    private_websocket_p1:uuid = ""
    private_websocket_p2:uuid = ""
    state:str = "waiting"
    score: int = 0

    ball: list[float] = field(default_factory=lambda: [0.5, 0.5, 0.1, 0.1])  # Correct usage    
    paddle: list[float] = field(default_factory=lambda: [0.5, 0.5])

    def to_json(self) -> str:
        return json.dumps(asdict(self), default=str)