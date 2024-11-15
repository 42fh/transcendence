import redis.asyncio as redis
import msgpack
from channels.layers import get_channel_layer
import asyncio


async def setup_connections(self):
    """Set up Redis and channel layer connections"""
    self.redis_conn = redis.Redis.from_url(
        "redis://redis:6379/1", decode_responses=False
    )
    self.channel_layer = get_channel_layer()


async def store_vertices(self, vertices):
    """Store vertices in Redis"""
    if self.redis_conn:
        try:
            await self.redis_conn.set(self.vertices_key, msgpack.packb(vertices))
            return True
        except Exception as e:
            print(f"Error storing vertices: {e}")
            return False
    return False


async def get_vertices(self):
    """Retrieve vertices from Redis"""
    if self.redis_conn:
        try:
            vertices_data = await self.redis_conn.get(self.vertices_key)
            if vertices_data:
                return msgpack.unpackb(vertices_data)
        except Exception as e:
            print(f"Error retrieving vertices: {e}")
    return None


async def acquire_lock(self, timeout=1.0):
    """Acquire distributed lock"""
    return await self.redis_conn.set(self.lock_key, b"1", nx=True, ex=int(timeout))


async def release_lock(self):
    """Release distributed lock"""
    await self.redis_conn.delete(self.lock_key)
