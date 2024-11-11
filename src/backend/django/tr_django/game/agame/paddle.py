import redis.asyncio as redis
import asyncio
import msgpack


async def update_paddle(self, player_index, position):
    """Update paddle position atomically"""
    try:
        position = float(max(0, min(1, position)))
        try:
            packed_data = msgpack.packb({"position": position})
            await self.redis_conn.hset(
                self.paddles_key,
                str(player_index),
                packed_data
            )
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
