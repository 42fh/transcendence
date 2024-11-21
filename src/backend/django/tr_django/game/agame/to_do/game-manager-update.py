async def update_game(self):
    """Process-safe game update with dynamic state broadcast frequency"""
    if not await self.acquire_lock():
        return False

    try:
        # Track timing for state broadcasts
        self.last_state_broadcast = getattr(self, "last_state_broadcast", 0)
        current_time = time.time()

        # Get current state with error handling
        try:
            state_data = await self.redis_conn.get(self.state_key)
            current_state = msgpack.unpackb(state_data) if state_data else None
        except msgpack.UnpackException as e:
            print(f"Error unpacking game state: {e}")
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "error",
                    "error": "Game state corruption detected",
                    "details": str(e),
                },
            )
            return False

        if not current_state:
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "error",
                    "error": "Game state not found",
                },
            )
            return False

        # Run game logic
        new_state, game_over, cycle_data = await self.game_logic(current_state)

        # Calculate update frequency based on ball distance
        update_interval = self.calculate_update_interval(cycle_data["highest_distance"])

        # Handle any events generated during game logic
        if cycle_data["events"]:
            await self.broadcast_events(cycle_data["events"])

        # Save new state
        await self.redis_conn.set(self.state_key, msgpack.packb(new_state))

        # Broadcast state only if enough time has passed based on the dynamic interval
        if current_time - self.last_state_broadcast >= update_interval:
            await self.channel_layer.group_send(
                f"game_{self.game_id}",
                {
                    "type": "game_state",
                    "game_state": new_state,
                    "metrics": {
                        "update_interval": update_interval,
                        "distance": cycle_data["highest_distance"],
                        "collision_data": cycle_data["collision_data"],
                    },
                },
            )
            self.last_state_broadcast = current_time

        return game_over

    except Exception as e:
        print(f"Error in update_game: {e}")
        await self.channel_layer.group_send(
            f"game_{self.game_id}",
            {"type": "error", "error": "Game update failed", "details": str(e)},
        )
        return False

    finally:
        await self.release_lock()


def calculate_update_interval(self, highest_distance):
    """
    Calculate the update interval based on the ball's distance from sides.
    Returns time in seconds between updates.

    Args:
        highest_distance (float): Highest distance of any ball from center this cycle

    Returns:
        float: Time in seconds to wait between state broadcasts
    """
    # Get the boundaries for reference
    outer_boundary = self.get_outer_boundary()
    inner_boundary = self.get_inner_boundary()

    # Define min and max update intervals (in seconds)
    MIN_INTERVAL = 0.016  # ~60 FPS for close action
    MAX_INTERVAL = 0.1  # ~10 FPS for distant action

    # If ball is in inner safe zone, use max interval
    if highest_distance <= inner_boundary:
        return MAX_INTERVAL

    # If ball is beyond outer boundary, use min interval
    if highest_distance >= outer_boundary:
        return MIN_INTERVAL

    # Calculate normalized distance between inner and outer boundaries
    distance_range = outer_boundary - inner_boundary
    normalized_distance = (highest_distance - inner_boundary) / distance_range

    # Inverse the normalized distance (closer = smaller interval)
    inverse_distance = 1 - normalized_distance

    # Calculate interval using inverse lerp
    interval = MIN_INTERVAL + (MAX_INTERVAL - MIN_INTERVAL) * inverse_distance

    return interval
