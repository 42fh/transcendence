async def test_redis_connection(self):
    try:
        await self.redis_conn.ping()
        # Try to set and get a test value
        await self.redis_conn.set('test_key', 'test_value')
        test_value = await self.redis_conn.get('test_key')
        if test_value:
            print("Redis connection and operations working correctly")
            return True
    except Exception as e:
        print(f"Redis connection test failed: {e}")
        return False
