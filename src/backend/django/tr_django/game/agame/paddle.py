import redis.asyncio as redis
import asyncio
import msgpack


async def update_paddle(self, player_index, position):
    """Update paddle position atomically with length-based limits"""
    try:
        # Get current paddle state to check if we're at a limit
        try:
            current_data = await self.redis_conn.hget(
                self.paddles_key, str(player_index)
            )
            current_position = (
                msgpack.unpackb(current_data)["position"] if current_data else 0.5
            )
        except:
            current_position = 0.5  # Fallback if can't get current position

        # Get paddle length from game settings
        paddle_length = float(self.settings.get("paddle_length", 0.3))
        half_length = paddle_length / 2.0

        # Calculate valid range
        min_valid = half_length
        max_valid = 1.0 - half_length

        # If at a limit and trying to move further out, maintain current position
        if (current_position >= max_valid and position > current_position) or (
            current_position <= min_valid and position < current_position
        ):
            return True

        # Limit new position to valid range
        position = float(max(min_valid, min(max_valid, position)))

        try:
            packed_data = msgpack.packb({"position": position})
            await self.redis_conn.hset(self.paddles_key, str(player_index), packed_data)
            return True
        except msgpack.PackException as e:
            print(f"Error packing paddle data: {e}")
            return False
    except Exception as e:
        print(f"Error updating paddle: {e}")
        return False


async def get_paddle_positions(self):
    """Get all paddle positions atomically"""
    try:
        positions = await self.redis_conn.hgetall(self.paddles_key)
        return {
            int(idx): msgpack.unpackb(pos_data)["position"]
            for idx, pos_data in positions.items()
        }
    except Exception as e:
        print(f"Error getting paddle positions: {e}")
        return {}
