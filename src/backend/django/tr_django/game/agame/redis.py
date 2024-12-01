import redis.asyncio as redis
from channels.layers import get_channel_layer
import asyncio


async def setup_connections(self):
    """Set up Redis and channel layer connections"""
    self.redis_conn = redis.Redis.from_url(
        "redis://redis:6379/1", decode_responses=False
    )
    self.channel_layer = get_channel_layer()
