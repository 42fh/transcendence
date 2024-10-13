classDiagram
    class Game {
        +Cache cache
        +WebSocket websocket
        +GameState state
        +Player player
        +void start()
        +void stop()
    }
class GameManager {
        +UUID gameId
        +int playerAmount
        +string playerMode
        +bool playerReady
        +Game game
        +void makePlayerReady(UUID)
        +void makePlayerUnready(UUID)
        +void addPlayerToGame(UUID)
        +void removePlayerFromGame(UUID)
        +void waitForPlayer(UUID)
    }

    class Tournament {
        +Player[] players
        +string tournamentMode
        +int score
        +void organizeGames()
        +void calculateScores()
    }
    class GameState {
        + ? getGamestate(Game)
        + ? setGamestate(Game)
        + ? sendGamestate(Game)
    }

    class Cache {
        +void store()
        +void load()
    }

    class WebSocket {
        +void send()
        +void receive()
    }

    

    class Window {
        +int width
        +int height
        +void open()
    }

    class Ball {
        +int radius
        +void bounce()
    }

    class Padle {
        +int width
        +int height
        +void moveUp()
        +void moveDown()
    }

    class Player {
        +Paddle paddle
        +string name
        +void score()
    }


    Game --> GameManager
    Tournament <--GameManager
    Game <--> Cache
    Game <--> WebSocket
    Game <-- GameState
    Game <-- Window
    Game <-- Ball
    Game <-- Player
    Padle --> Player
    
   


subgraph Game Components
class GameElement {
        +int length
        +int height
        +string surfaceProperty
    }

    class DrawElement {
        +void draw()
    }

    class MovingElement {
        +int position
        +Vector direction
        +int speed
        +void move()
        +void directionChange()
        +void speedChange()
    }
        GameElement --|> Window
        GameElement --|> Ball
        GameElement --|> Padle
        DrawElement --|> Window
        DrawElement --|> Ball
        DrawElement --|> Padle
        MovingElement --|> Ball
        MovingElement --|> Padle
    end
