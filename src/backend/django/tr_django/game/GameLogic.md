# (PONG -) GAME


## INDEX

* CACHE
* WEBSOCKET
* ~~GAMEELEMENT~~
* ~~DRAWELEMENT~~
* ~~MOVINGELEMNT~~
* ~~WINDOW~~
* ~~BALL~~
* ~~PADLE~~
* PLAYER
* GAMESTATE
* GAME
* GAMEMANAGER
* TOURNAMENT
* *DEPENDENCIES*


****

## CACHE

> is a *placeolder* to store and load values quickly

****


****

## WEBSOCKET

> is a *placeolder* to send and recieve values 

****

~~
****

## GAMEELEMENT

> Parent Class from things that are intaragized with 

### implementation

#### Abtributes

* lenght
* hight
* surface property
  
#### Functions

*no function*

****

****

## DRAWELEMENT

> Parent CLass from things that are drawn

#### Functions

* draw()

****

****
## MOVINGELEMENT

> Parent Class from things that move 


### implementation

#### Abtributes

* position
* vectore direction
* speed / nextSteppValue

#### Functions

* void move(void)
* void directionChange(value)
* void speedChange(value)


****

****

## WINDOW(GAMEELEMNT, DRAWELEMENT)

> the GAME take place in this area 
> It is an area defined at the start of the game in which PADELS and BALLS can move.
> It only interacts with its surface properties.

### implementation

#### Abtributes

*no*
  
#### Functions

*no function*

****

****

## BALL(GAMEELEMENT,  DRAWELEMENT, MOVINGELEMENT)

> it has an arbitrary but at the start of the game a fixed shape, movement properties and player dependency.  
> it moves at a speed and in one direction in the WINDOW. It is passiv. It only interacts with its surface properties 

### ***BALL*** needs:

* 1 WINDOW   
* n PLAYER

### implementation

#### Abtributes

* list of PLAYER.id

#### Functions

* bool assigneToPlayer(PLAYER)	
* bool connectedWithPlayer(PLAYER)

****

****

## PADLE(GAMEELEMENT, DRAWELEMENT, MOVINGELEMENT)

> it has an arbitrary but at the start of the game a fixed shape and movement possibilities.
> It can influence n BALL through collision.  It is limited by the WINDOW.
> The paddle belongs to a specific player. It is moved. It only interacts with its surface properties

### ***PADLE*** needs:

* 1 WINDOW
* 1 PLAYER

### implementation

#### Abtributes

* (const) PLAYER.uuid 

#### Functions

* void usePadle( 1 || -1 ) 
* bool assigneToPlayer(PLAYER)	
* bool connectedWithPlayer(PLAYER)

****

****

## PLAYER

> Representation or embodiment of the *USER* in the GAME 
> PLAYER is assigned (to) n BALL, which he can influence with his assigned PADLE.

### **PLAYER** needs:

* 1 PADLE
* n BALL
* 1 *USER*

### implementation

#### Abtributes

* const uuid
* (&PADLE) -> depends on where the Padle
* (list of BALLs) ->


#### Functions

* bool assigneToPadle(PADLE)
* bool assigneToBall(BALL)	
* bool usePadle(PADLE, value(1 || -1))	

****
~~

****

## GAMESTATE

> the data from a GAME 
> cordinate to save GAMESTATE in CACHE and send parts of GAMESTATE with WEBSOCKETS  

### implementation

#### Abtributes

#### Functions

* ? 	getGamestate(GAME)
* ? 	setGamestate(GAME)
* ? 	sendGamstate(GAME)	 
* bool	checkGamstateSize(GAME)

****

****

## GAME

> manage a GAMESTATE 

### **GAME** needs:

* n PLAYER
* n BALL
* 1 WINDOW
* 1 GAMESTATE
* 1 GAMEMANAGER

### implementation

#### Abtributes
* bool    				 			pause
* list/map[GAMEMANAGER.playerAmount]				PLAYERs	
* list/map[GAMEMANAGER.playerAmount/GAMEMANAFER.playMode]	BALLs
* WINDOW 							win
* GAMESTATE 							state

#### Functions

* PLAYER 	run()
* void		pause()
* void		start()
* void		finish(UUID)
* void		actionPlayer(UUID)
* void		updateGane()
* void		updateBall()
* void		makeBounce()
* void		checkCollision()
* void		checkScore()	  

****

****

## GAMEMANAGER

> manage a GAME. 

### **GAMEMANAGER** needs:

* a GAME

### implementation

#### Abtributes

* gameId
* playerAmount
* playerMode
* playerReady
* GAME

#### Functions

* makePlayerReady(UUID)
* makePlayerUnready(UUID)
* addPlayerToGame(UUID)
* removePlayerFromGame(UUID)
* waitForPlayer(UUID)

****

****

## TOURNAMENT

> n Games in specific order 

A **TOURNAMENT** needs:
* n PLAYER
* n TOURNAMENTMODE *( e.g each again each = 2n(n−1) GAMEMANAGER)*
* a SCORE


### implementation

#### Abtributes

#### Functions

****

## *DEPENDENCIES*

> Abstracts which are not in GAME


### *USER*

> controll *USERDATA* 


### *USERDATA*

> date from a *USER*

