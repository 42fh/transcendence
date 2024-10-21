# transcendence

SETUP: till now you have setup redis at  localhost by your self 
mac user : brew install redis // brew services start redis
*ATTENTION* 
	if a game is opend it will create a game with the id in redis. if you waant to run it again you have to delete it manually 
	redis-cli DEL game_state:<your_game_id>


 
This Version of the GAMELOGIC workes with this [FRONTEND](./src/frontend/pong_test.html)
here you can manually give your game and player an id.   
run daphne and you can play ... 
features:
	- if you press your paddle faster then 300ms (time setting only to show it). game blocks your moves
	- if you chance the player_id in the console.  game blocks your moves 
