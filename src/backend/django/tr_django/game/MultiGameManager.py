import json
import asyncio
import redis.asyncio as redis
from channels.layers import get_channel_layer
import math
import random


class MultiGameManager:
    running_games = {}

    def __init__(self, game_id):
        self.game_id = game_id
        self.redis_lock = asyncio.Lock()
        self.redis_conn = None
        self.channel_layer = None
        self.players = []
        self.num_players = 3  # Will be set during initialization
        self.num_balls = 1
        self.running = False
        self.min_players = 3 # Will be set ....

    @classmethod
    def get_instance(cls, game_id):
        if game_id in cls.running_games:
            return cls.running_games[game_id]
        instance = cls(game_id)
        cls.running_games[game_id] = instance
        return instance


    #    async def game_logic(self, current_state):
    async def game_logic(self, current_state):
        import math

        def calculate_distance(point):
            return math.sqrt(point["x"] ** 2 + point["y"] ** 2)

        def calculate_angle(point):
            angle = math.atan2(point["y"], point["x"]) * (180 / math.pi)
            if angle < 0:
                angle += 360
            return angle

        def get_max_offset_for_sector(sector_index, sector_count, ball_size, paddle_length):
            sector_size = 360 / sector_count
            hit_zone_angle = ball_size * 180 / math.pi * 0.5
            paddle_angle = sector_size * paddle_length
            total_angle_needed = paddle_angle + (hit_zone_angle * 2)
            
            if total_angle_needed >= sector_size:
                return 0
            return (sector_size - total_angle_needed) / 2

        def generate_paddle_centers(paddles, sector_count, paddle_length, ball_size):
            centers = []
            sector_size = 360 / sector_count

            for i in range(sector_count):
                max_offset = get_max_offset_for_sector(i, sector_count, ball_size, paddle_length)
                offset_angle = (paddles[i]["position"] - 0.5) * 2 * max_offset
                
                position = (i * sector_size) + offset_angle
                while position >= 360:
                    position -= 360
                while position < 0:
                    position += 360
                centers.append(position)
            return centers

        def calculate_paddle_hit(point, distance, paddles, dimensions, sector_count):
            angle = calculate_angle(point)
            sector_size = 360 / sector_count
            actual_paddle_size = sector_size * dimensions["paddle_length"]
            ball_size = point["size"]
            angular_hit_zone = ball_size * 180 / math.pi * 0.5
            
            radial_hit_zone_width = ball_size
            outer_radius = 1.0
            inner_radius = outer_radius - dimensions["paddle_width"]
            
            is_in_radial_range = (distance >= (inner_radius - radial_hit_zone_width) and 
                                 distance <= outer_radius)
            
            if not is_in_radial_range:
                return None

            paddle_centers = generate_paddle_centers(paddles, sector_count, 
                                                  dimensions["paddle_length"], ball_size)
            
            for i, center in enumerate(paddle_centers):
                half_size = actual_paddle_size / 2
                
                angle_diff = angle - center
                if angle_diff > 180:
                    angle_diff -= 360
                if angle_diff < -180:
                    angle_diff += 360
                
                if abs(angle_diff) <= (half_size + angular_hit_zone):
                    if abs(angle_diff) <= half_size:
                        normalized_offset = angle_diff / half_size
                    else:
                        hit_zone_diff = abs(angle_diff) - half_size
                        hit_zone_norm = hit_zone_diff / angular_hit_zone
                        normalized_offset = 1 + hit_zone_norm if angle_diff > 0 else -1 - hit_zone_norm
                    
                    return {
                        "paddle_number": i + 1,
                        "offset": angle_diff,
                        "normalized_offset": max(-2, min(2, normalized_offset)),
                        "radial_position": ((distance - (inner_radius - radial_hit_zone_width)) / 
                                          (dimensions["paddle_width"] + radial_hit_zone_width)),
                        "hit_zone_width": radial_hit_zone_width,
                        "angular_hit_zone": angular_hit_zone,
                        "actual_distance": distance,
                        "is_edge_hit": abs(angle_diff) > half_size
                    }
            
            return None

        # Main game logic
        game_over = False
        new_state = current_state.copy()
        
        # Update ball positions and check for collisions
        for ball in new_state["balls"]:
            # Move ball
            ball["x"] += ball["velocity_x"]
            ball["y"] += ball["velocity_y"]
            
            # Calculate current position metrics
            distance = calculate_distance(ball)
            
            # Check if ball is out of bounds
            if distance > 1.0:
                angle = calculate_angle(ball)
                sector_size = 360 / len(new_state["paddles"])
                responsible_paddle_index = int(angle / sector_size)
                
                # Update scores
                for i in range(len(new_state["scores"])):
                    if i != responsible_paddle_index:
                        new_state["scores"][i] += 1
                
                # Reset ball position
                ball["x"] = 0
                ball["y"] = 0
                
                # Set random initial velocity
                angle = random.uniform(0, 2 * math.pi)
                speed = 0.003
                ball["velocity_x"] = speed * math.cos(angle)
                ball["velocity_y"] = speed * math.sin(angle)
                
                # Check if any player has won (reached 11 points)
                if max(new_state["scores"]) >= 11:
                    game_over = True
            
            # Check for paddle collisions
            hit_info = calculate_paddle_hit(ball, distance, new_state["paddles"], 
                                          new_state["dimensions"], len(new_state["paddles"]))
            
            if hit_info:
                # Calculate normal vector at point of collision
                normal_angle = math.radians(calculate_angle(ball))
                normal_x = math.cos(normal_angle)
                normal_y = math.sin(normal_angle)
                
                # Calculate current velocity vector
                velocity_magnitude = math.sqrt(ball["velocity_x"]**2 + ball["velocity_y"]**2)
                
                # Apply reflection formula: R = V - 2(V · N)N
                dot_product = (ball["velocity_x"] * normal_x + ball["velocity_y"] * normal_y)
                
                # Calculate reflected velocity
                reflected_x = ball["velocity_x"] - 2 * dot_product * normal_x
                reflected_y = ball["velocity_y"] - 2 * dot_product * normal_y
                
                # Add paddle offset effect (angle adjustment based on hit position)
                offset_angle = hit_info["normalized_offset"] * math.pi * 0.25  # Max ±45 degree adjustment
                cos_offset = math.cos(offset_angle)
                sin_offset = math.sin(offset_angle)
                
                # Apply the offset rotation to the reflected velocity
                final_velocity_x = reflected_x * cos_offset - reflected_y * sin_offset
                final_velocity_y = reflected_x * sin_offset + reflected_y * cos_offset
                
                # Normalize and apply speed
                magnitude = math.sqrt(final_velocity_x**2 + final_velocity_y**2)
                speed = velocity_magnitude * 1.05  # 5% speed increase
                
                ball["velocity_x"] = (final_velocity_x / magnitude) * speed
                ball["velocity_y"] = (final_velocity_y / magnitude) * speed

        return new_state, game_over

    async def load_game_state(self):
        try:
            if self.redis_conn is None:
                #print("Redis connection not initialized")
                return None
            
            game_state_bytes = await self.redis_conn.get(f"game_state:{self.game_id}")
            #if game_state_bytes:
                #print(f"Successfully loaded game state for game {self.game_id}")
            #else:
                #print(f"No existing game state found for game {self.game_id}")
            return game_state_bytes
        except Exception as e:
            print(f"Error loading game state: {e}")
            return None

    async def save_game_state(self, game_state):
        try:
            if self.redis_conn is None:
                #print("Redis connection not initialized")
                return False
            
            game_state_bytes = self.encode_game_state(game_state)
            success = await self.redis_conn.set(
                f"game_state:{self.game_id}", 
                game_state_bytes,
                ex=3600  # Set expiration to 1 hour
            )
        
        # Verify the save was successful
            if success:
                # Verify the data was actually saved
                saved_data = await self.redis_conn.get(f"game_state:{self.game_id}")
                if saved_data:
                    #print(f"Game state saved successfully for game {self.game_id}")
                    return True
                else:
                    #print(f"Game state save verification failed for game {self.game_id}")
                    return False
        except Exception as e:
            print(f"Error saving game state: {e}")
            return False


    async def initialize(self):
        try:
            self.redis_conn = await redis.Redis(decode_responses=False)  # Set decode_responses to False
            # Test Redis connection
            await self.redis_conn.ping()
            #print(f"Successfully connected to Redis for game {self.game_id}")
        
            self.channel_layer = get_channel_layer()
            await self.initialize_game_state()
        except Exception as e:
            #print(f"Error initializing Redis connection: {e}")
            raise

    async def wait_for_players(self):
        while len(self.players) < self.min_players:
            print("Waiting for players to join...")
            await asyncio.sleep(1)
        print("All players connected. Starting the game.")
        self.running = True

    async def end_game(self):
        print(f"Game {self.game_id} has ended.")

    async def start_game(self):
        await self.wait_for_players()
        while len(self.players) > 0:
            game_over = await self.update_game()
            if game_over:
                await self.end_game()
                break
            await asyncio.sleep(0.05)
        # load gamestate to datatbase

    async def add_player(self, player_id):
        """Add a player to the game if they are not already added."""
        if player_id not in self.players:
            self.players.append(player_id)
            player_index = len(self.players) - 1
            print(
                f"Player {player_id} added to game {self.game_id}. Current players: {self.players}."
            )
            return player_index
        else:
            print(f"Player {player_id} is already in the game {self.game_id}.")
            return False

    async def remove_player(self, player_id):
        if player_id in self.players:
            self.players.remove(player_id)
            print(
                f"Player {player_id} removed from game {self.game_id}. Remaining players: {self.players}"
            )

            if len(self.players) == 0:
                # If no players left, end the game and clean up
                print(f"Game {self.game_id} ended. No more players.")
                del self.__class__.running_games[self.game_id]
            elif len(self.players) == 1:
                # If only one player left, you might want to pause the game or take some action
                print(f"Only one player left in game {self.game_id}.")
                # You could implement a waiting state here if needed
        else:
            print(f"Player {player_id} not found in game {self.game_id}")


    def init_game_state(self):
        try:
            # Initialize balls in the center moving in random directions
            balls = []
            for i in range(self.num_balls):
                angle = random.uniform(0, 2 * math.pi)
                speed = 0.006
                balls.append({
                    "x": float(0),
                    "y": float(0),
                    "velocity_x": float(speed * math.cos(angle)),
                    "velocity_y": float(speed * math.sin(angle)),
                    "size": float(0.05),
                })

            # Initialize paddles evenly spaced around the circle
            paddles = []
            for i in range(self.num_players):
                paddles.append({
                    "position": float(0.5)
                })

            state = {
                "balls": balls,
                "paddles": paddles,
                "scores": [int(0)] * self.num_players,
                "dimensions": {
                    "paddle_length": float(0.4),
                    "paddle_width": float(0.2),
                }
            }
        
            # Verify the state is valid
            if not self.verify_game_state(state):
                raise ValueError("Invalid game state generated")
            
            return state
        
        except Exception as e:
            print(f"Error in init_game_state: {e}")
            # Return a minimal valid state as fallback
            return {
                "balls": [{"x": 0.0, "y": 0.0, "velocity_x": 0.0, "velocity_y": 0.0, "size": 0.02}],
                "paddles": [{"position": 0.0} for _ in range(self.num_players)],
                "scores": [0] * self.num_players,
                "dimensions": {"paddle_length": 0.2, "paddle_width": 0.02}
            }

    def verify_game_state(self, state):
        """Verify that a game state is valid and JSON serializable"""
        try:
            # Test JSON serialization
            json.dumps(state)
        
            # Verify structure
            required_keys = ["balls", "paddles", "scores", "dimensions"]
            if not all(key in state for key in required_keys):
                return False
            
            # Verify types
            if not isinstance(state["balls"], list):
                return False
            if not isinstance(state["paddles"], list):
                return False
            if not isinstance(state["scores"], list):
                return False
            if not isinstance(state["dimensions"], dict):
                return False
            
            return True
        except (TypeError, ValueError):
            return False

    async def decode_game_state(self, game_state_bytes):
        try:
            if game_state_bytes is None:
                print("No game state found, initializing new state")
                return self.init_game_state()
            
            game_state_str = game_state_bytes.decode("utf-8")
            state = json.loads(game_state_str)
            
            # Validate the state structure
            required_keys = ["balls", "paddles", "scores", "dimensions"]
            if not all(key in state for key in required_keys):
                print("Invalid game state structure, reinitializing")
                return self.init_game_state()
                
            # Ensure correct number of paddles
            if len(state["paddles"]) != self.num_players:
                print(f"Paddle count mismatch. Expected: {self.num_players}, Got: {len(state['paddles'])}")
                return self.init_game_state()
                
            # Ensure correct number of scores
            if len(state["scores"]) != self.num_players:
                print(f"Score count mismatch. Expected: {self.num_players}, Got: {len(state['scores'])}")
                return self.init_game_state()
                
            return state
            
        except json.JSONDecodeError as e:
            print(f"Error decoding game state: {e}")
            return self.init_game_state()
        except Exception as e:
            print(f"Unexpected error handling game state: {e}")
            return self.init_game_state()


    def encode_game_state(self, game_state):
        try:
            # Ensure all numeric values are properly formatted
            encoded_state = {
                "balls": [{
                    "x": float(ball["x"]),
                    "y": float(ball["y"]),
                    "velocity_x": float(ball["velocity_x"]),
                    "velocity_y": float(ball["velocity_y"]),
                    "size": float(ball["size"])
                } for ball in game_state["balls"]],
                "paddles": [{
                    "position": float(paddle["position"])
                } for paddle in game_state["paddles"]],
                "scores": [int(score) for score in game_state["scores"]],
                "dimensions": {
                    "paddle_length": float(game_state["dimensions"]["paddle_length"]),
                    "paddle_width": float(game_state["dimensions"]["paddle_width"])
                }
            }
            return json.dumps(encoded_state).encode("utf-8")
        except Exception as e:
            print(f"Error encoding game state: {e}")
            return json.dumps(self.init_game_state()).encode("utf-8")

    async def initialize_game_state(self):
        try:
            game_state = await self.load_game_state()
            if game_state is None:
                initial_state = self.init_game_state()
                #print("Initializing new game state:", initial_state)  # Debug print
                await self.save_game_state(initial_state)
        except Exception as e:
            print(f"Error initializing game state: {e}")
            initial_state = self.init_game_state()
            await self.save_game_state(initial_state)

    def serialize_game_state(self, state):
        """Convert game state to a JSON-serializable format"""
        return {
            "balls": [{
                "x": float(ball["x"]),
                "y": float(ball["y"]),
                "velocity_x": float(ball["velocity_x"]),
                "velocity_y": float(ball["velocity_y"]),
                "size": float(ball["size"])
                } for ball in state["balls"]],
            "paddles": [{
                "position": float(paddle["position"])
                } for paddle in state["paddles"]],
            "scores": [int(score) for score in state["scores"]],
            "dimensions": {
                "paddle_length": float(state["dimensions"]["paddle_length"]),
                "paddle_width": float(state["dimensions"]["paddle_width"])
            }
        }


    async def update_game(self):
        async with self.redis_lock:
            try:
                game_state_bytes = await self.redis_conn.get(f"game_state:{self.game_id}")
                current_state = await self.decode_game_state(game_state_bytes)
                #print("Current state structure:", current_state.keys())  # Debug print
                
                new_state, game_over =  await self.game_logic(current_state)
                
                # Validate new state before saving
                if not all(key in new_state for key in ["balls", "paddles", "scores", "dimensions"]):
                    print("Invalid new state structure, using current state")
                    new_state = current_state
                    game_over = False
                    
                await self.save_game_state(new_state)
            

                # Broadcast the new state to all connected clients
                msg_type = "game_finished" if game_over else "game_state"
                winner = None
            
                if game_over:
                    # Find winner based on highest score
                    max_score = max(new_state["scores"])
                    winning_indices = [i for i, score in enumerate(new_state["scores"]) 
                                 if score >= 11 and score == max_score]
                    if winning_indices:
                        winner = winning_indices[0]
            
                # Send update through channel layer to all connected clients
                await self.channel_layer.group_send(
                    f"game_{self.game_id}",
                     {"type": msg_type, "game_state": new_state, "winner": winner},)
            
                #print(f"Game state updated and broadcast for game {self.game_id}")

                return game_over
                
            except Exception as e:
                print(f"Error in update_game: {e}")
                return False

    # ... (rest of the methods remain similar to the original GameManager)
