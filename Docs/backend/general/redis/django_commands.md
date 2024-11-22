
---

# Useful Commands related to Redis


    ➜  transcendence git:(jonistroh/tra-102-game_logic-unregular-polygon-optimization-and-websockets-api) docker compose exec redis bash root@666bc4345d53:/data# redis-cli
    127.0.0.1:6379> KEYS * (empty array)
    127.0.0.1:6379> SELECT 1 OK
    127.0.0.1:6379[1]> KEYS * 1) "game_vertices:1"
    127.0.0.1:6379[1]> KEYS * 1) "game_players:1" 2) "game_running:1" 3) "game_state:1" 4) "game_paddles:1" 5) "game_vertices:1" 6) "game_settings:1" 7) "game_type:1"
    127.0.0.1:6379[1]> KEYS *
    127.0.0.1:6379[1]> KEYS *:1 1) "game_state:1" 2) "game_settings:1" 3)"game_running:1" 4) "game_players:1" 5) "game_vertices:1" 6) "game_paddles:1" 7) "game_type:1"
    127.0.0.1:6379[1]>

