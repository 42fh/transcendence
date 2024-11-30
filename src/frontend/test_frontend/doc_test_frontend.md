#  "TEST"_FRONTEND

### How to use it out of the box

    python3 server.py
this will start  server to serve  the static test_pong.html site.

### main.js

> class PongTest : specific start to the test_pong.html

### config.js
> store same settings

### GameController.js
>   the class GameController: is the counterpart to the the PongConsumer and AGameManager.
>   This is where all clientside decisions are made. And the data from the user and backend I/O is processed here.
	
#### handleMessage(message)

> place to define what to do with each WebSocketAPi message. Till now:

- initial_state
- game_state
- game_finished
- error
####  initializeRenderer(gameType)

> here we decide how to render the data of the Game from Backend and Frontend.
> the backend will send with GameType the backend has choosen to calculate on 

- PolygonRender
- CircularRender
- 3DRender ?


###  api.js

> class GameAPI: place for the RestAPI calls

### gamestate.js

> class GameState:  hold later the Gamestate of the frontend

###  websocket.js

> class GameWebSocket: pure websocket controll 

### pong-render.js

> holds till now the classes to render the gamein the same way as the AGameManager

- BasePongRenderer
- PolygonRender (works)
- CircularRender (not working till noe) 

