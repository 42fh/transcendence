## Detail in Game
````mermaid
sequenceDiagram
    participant Cl as Client
    participant GC  as GameCordinator
    participant GM as GameManager
    participant G as Game
    participant GS as GamState
    participant Ca as Cache 
    participant D as Database
    participant W as Websocket
    Note over Cl, D: RESTAPI
    Cl ->> GC: i want to play Game
    GC ->> D: is Game waiting
    alt Game is not waiting
        D->>GC: here is your new GameID
        GC->>+ GM: new Gamemanager Instance to list in GameCordinator
        GM->>+GM: add active player to Game
        GM->>+ G: create new Game
        G->>D:ask for default GameState
        D->>G:get default Gamestate

        G->>GS: create GameState
        GS->>Ca: create Cache
        G->>W: create and add new Layer with GameID group
        GC->> Cl: GameId
    else Game is waiting
        GC->>GM: new Player
        GM->>+GM: add active player to Game
        GC->> Cl: GameId 
    end 
    Cl->>W: connect to GameId 
    Note over Cl, W: WEBSOCKT
    alt all Players are not ready
        Note over GM, W: Waiting 
    else all Players are ready
        GM ->>G: Game.run()
        G->>W: start Game
        W->>Cl: start Game    
    end
    par  GameLoop
        loop every n ms
            Ca ->>GS: load from cache
            GS->>G:get GameState
            G->>G: ball goes one step 
            G->>GS: save new GameState
            GS->>Ca: save in cache
            alt Client could not know new GameState
                G->>W:new Gamestate
                W->>Cl:new Gamestate
            else Client could know new GameState
                note over G: Do nothing
            end    
        end   
    and ClientInput
        Cl->>W:move Padle
        W->>GC: movePadel
        alt move is not valid
            Note over GC: do nothing
        else move is valid
            GC->>GM: move Padle
            GM->>G:move Padle
            Ca ->>GS: load from cache
            GS->>G:get GameState
            G->>G: Padle goes one step 
            G->>GS: save new GameState
            GS->>Ca: save in cache
            alt Client could not know new GameState
                G->>W:new Gamestate
                W->>Cl:new Gamestate
            else Client could know new GameState
                note over G: Do nothing
            end    
        end
    end
    break A Player have 11 Points
        G->>W: finished
        W->>Cl:finished
        G->>D:store Gamestate
        G->>Ca: delete Cache
        G->>GM: finished
        GM->>GC: finished
        Note over Cl,D: RESTAPI
        D->>Cl: GameResult
    end
````
