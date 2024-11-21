# Steps game_logic                                                                                 

                          

frequenz = 0 ( 0 is low , 1 high)                                              

for ball in balls:                                                                                   

 1. move b                                                                                  

 2. check distance ball  

	 - if distance is bigger then radius big circel

			 -  ball is outside PongStructure do check if missed or tunneld, ..... , continue to next ball,

	 - elif distance <= small radius ( no check zone)

			 -  if distance is > frequenz, frequenze = distance,  continue to next ball

3. get sector ball: 

	- should return the sector which is the nearest to the ball and ball has to move towards or paralell to it. 

	- except: tunneling this has priority 

4. handle side ball situation

	-  if distancce to side is in collison check range 

		-  do collision check and return collision data

	-  else return collision = None, ...., continue to next ball

	- except: tunneling: do something, ..... , create collision

5.  handle collison 

	- wall

		- wall_bounce

	- miss

		- score, winner check

	- paddle

		- paddle_bounce 

6. return distance, new gamestate, gameover(true || false)
