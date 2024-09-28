import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from channels.db import database_sync_to_async
from .models import Game
import asyncio

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.game_group_name = f'game_{self.game_id}'

        # Join the game group
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )

        await self.accept()

        # Check if this is the first or second player
        player_count = await self.get_player_count()
        if player_count == 1:
            await self.send(text_data=json.dumps({
                'message': 'Waiting for another player to join...'
            }))
        elif player_count == 2:
            # Start the game when the second player joins
            await self.start_game()


    async def disconnect(self, close_code):
        # Leave the game group
        await self.channel_layer.group_discard(
            self.game_group_name,
            self.channel_name
        )

        # Decrease player count
        await self.decrease_player_count()

        if hasattr(self, 'ball_task'):
            self.ball_task.cancel()

    @database_sync_to_async
    def get_player_count(self):
        count = cache.get(f'player_count_{self.game_id}', 0)
        count += 1
        cache.set(f'player_count_{self.game_id}', count)
        return count

    @database_sync_to_async
    def decrease_player_count(self):
        count = cache.get(f'player_count_{self.game_id}', 0)
        if count > 0:
            count -= 1
            cache.set(f'player_count_{self.game_id}', count)

    async def start_game(self):
        # Notify both players that the game is starting
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'game_message',
                'message': 'Both players have joined. The game is starting!'
            }
        )

        # Start the ball movement update loop
        self.ball_task = asyncio.create_task(self.update_ball_position())

    async def game_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))


    async def receive(self, text_data):
        data = json.loads(text_data)

        # Update game state (paddle positions, etc.) and cache it
        await self.update_game_state(data)

        # Broadcast the updated game state to all clients
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'game_update',
                'message': await self.get_game_state()
            }
        )

    async def game_update(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))

    async def update_ball_position(self):
        """
        Periodically update the ball's position, handle collisions, and update the game state.
        """
        while True:
            await asyncio.sleep(0.05)  # Update every 50ms

            game_state = await self.get_game_state()
            if game_state:
                # Check for the end condition (player reaches 5 goals)
                if game_state['player1_score'] >= 5 or game_state['player2_score'] >= 5:
                    await self.end_game(game_state)
                    break

                # Update the ball position
                game_state['ball_x'] += game_state['ball_dx']
                game_state['ball_y'] += game_state['ball_dy']

                # Ball collision with top and bottom walls
                if game_state['ball_y'] <= 0 or game_state['ball_y'] >= 1:
                    game_state['ball_dy'] *= -1

                # Ball collision with paddles
                if (game_state['ball_x'] <= 0.05 and game_state['ball_y'] >= game_state['paddle1_y'] - 0.1 and game_state['ball_y'] <= game_state['paddle1_y'] + 0.1) or \
                   (game_state['ball_x'] >= 0.95 and game_state['ball_y'] >= game_state['paddle2_y'] - 0.1 and game_state['ball_y'] <= game_state['paddle2_y'] + 0.1):
                    game_state['ball_dx'] *= -1

                # Scoring
                if game_state['ball_x'] <= 0:
                    game_state['player2_score'] += 1
                    self.reset_ball(game_state)
                if game_state['ball_x'] >= 1:
                    game_state['player1_score'] += 1
                    self.reset_ball(game_state)

                # Cache the updated game state
                await self.save_game_state(game_state)

                # Broadcast the updated game state
                await self.channel_layer.group_send(
                    self.game_group_name,
                    {
                        'type': 'game_update',
                        'message': game_state
                    }
                )

    def reset_ball(self, game_state):
        game_state['ball_x'] = 0.5
        game_state['ball_y'] = 0.5
        game_state['ball_dx'] = 0.005 * (-1 if game_state['ball_dx'] < 0 else 1)
        game_state['ball_dy'] = 0.005 * (-1 if game_state['ball_dy'] < 0 else 1)

    async def update_game_state(self, data):
        game_state = await self.get_game_state()

        # Update paddle positions
        if 'paddle1_y' in data:
            game_state['paddle1_y'] = data['paddle1_y']
        if 'paddle2_y' in data:
            game_state['paddle2_y'] = data['paddle2_y']

        # Cache the updated game state
        await self.save_game_state(game_state)

    @database_sync_to_async
    def get_game_state(self):
        """
        Retrieve the game state from the cache, or initialize it if not found.
        """
        game_state = cache.get(f'game_state_{self.game_id}')
        if game_state is None:
            # Initialize game state
            game_state = {
                'player1_score': 0,
                'player2_score': 0,
                'ball_x': 0.5,
                'ball_y': 0.5,
                'ball_dx': 0.005,
                'ball_dy': 0.005,
                'paddle1_y': 0.5,
                'paddle2_y': 0.5,
            }
            cache.set(f'game_state_{self.game_id}', game_state)
        return game_state

    @database_sync_to_async
    def save_game_state(self, game_state):
            """
            Save the updated game state to the cache.
            """
            cache.set(f'game_state_{self.game_id}', game_state)
    # Continuation of the previous GameConsumer
    
   # @database_sync_to_async
    async def end_game(self, game_state):
        """
        End the game and store the final result in the database.
        """
        # Fetch the game instance from the database
        #game = Game.objects.get(id=self.game_id)
        game = await database_sync_to_async(Game.objects.get)(id=self.game_id)
        # Update the game instance with the final score
        game.player1_score = game_state['player1_score']
        game.player2_score = game_state['player2_score']
    
        # Save the game result to the database
        #game.save()
        await database_sync_to_async(game.save)()
        # Notify the clients that the game has ended
        final_state = {
            'player1_score': game.player1_score,
            'player2_score': game.player2_score,
            'winner': 'Player 1' if game.player1_score == 5 else 'Player 2',
            'game_over': True
        }
        print("hallo: ",  final_state)
        # Broadcast the final game state
        await self.channel_layer.group_send(
            self.game_group_name,
            {
                'type': 'game_update',
                'message': final_state
            }
        )
    
        # Clear the cached game state
        cache.delete(f'game_state_{self.game_id}')

