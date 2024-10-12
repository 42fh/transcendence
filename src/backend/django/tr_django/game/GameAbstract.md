# (PONG -) GAME


## INDEX

* CACHE
* WEBSOCKET
* PADLE
* GAMESTATE
* GAME
* PLAYER
* BALL
* GAMESTATE
* TOURNAMENT
* *DEPENDENCIES*
* QUESTION


****

## CACHE

> is a *placeolder* to store and load values quickly

****


****

## WEBSOCKET

> is a *placeolder* to send and recieve values 

****

****

## GAMEELEMENT

> Parent Class from things that are intaragized with 



****

****

## DRAWELEMENT

> Parent CLass from things that are drawn

****

****

## WINDOW(GAMEELEMNT, DRAWELEMENT)

> the GAME take place in this area 
> It is an area defined at the start of the game in which PADELS and BALLS can move.
> It only interacts with its surface properties.

### implementation

#### Abtributes

* lenght
* hight
* surface property
  
#### Functions

*no function*

****


****
## MOVINGELEMENT

> Parent Class from things that move 

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

* position
* vectore direction
* speed / nextSteppValue
* list of PLAYER.id
* surface property

#### Functions

* void move(void)
* void directionChange(value)
* void speedChange(value)
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

* position
* vectore direction
* speed / nextSteppValue
* surface property
* PLAYER.id 

#### Functions

* void usePadle( 1 || -1 ) 
* void move(void)
* void speedChange(value)
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

* const UUID
* (&PADLE) -> depends on where the Padle

#### Functions

* bool assigneToPadle(PADLE)
* bool assigneToBall(BALL)	
* bool usePadle(PADLE, value(1 || -1))	

****

****

## GAMESTATE

> the data from a GAME 


## GAME

> manage a GAMESTATE 

### **GAME** needs:

* n PLAYER
* n BALL
* 1 WINDOW
* 1 GAMEFIELD (default WINDOW)
* 1 GAMESTATE

### implementation

#### Abtributes

#### Functions





### Abstract

### implementation

#### Abtributes

#### Functions



## *DEPENDENCIES*

> Abstracts which are not in GAME


### *USER*

> controll *USERDATA* 


### *USERDATA*

> date from a *USER*










## TOURNAMENT

A **TOURNAMENT** needs:
* n PLAYER
* n TOURNAMENTMODE *( e.g each again each = 2n(n−1) GAMES)*
* a SCORE






