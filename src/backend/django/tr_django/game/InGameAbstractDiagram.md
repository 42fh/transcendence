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
        D->>D: create new waiting Game
        D->>GC: here is your new GameID
        GC->> Cl: GameId
    else Game is waiting
        D->>GC: here is your new GameID
        GC->> Cl: GameId 
    end 
    Cl->>W: connect to GameId 
    Note over Cl, W: WEBSOCKT
    alt you are first Player
        W->>W: will create new GameIdLayer
        W->>GM:will create new GameManager Instance
        note over GM,W: all this is happaning in the Instance of the WebsocketConsumer
        GM->>+ GM: 
        GM->>+GM: add active player to Game
        GM->>+ G: create new Game
        G->>D:ask for default GameState
        D->>G:get default Gamestate
        G->>GS: create GameState
        GS->>Ca: create Cache

        Note over GM, W: Waiting 
    else not first player
    note over GM,W: all this is happaning in the Instance of the WebsocketConsumer
        W->>GM: new Player
        GM->>+GM: add active player to Game
        alt not all player ar ready
        Note over GM, W: Waiting 
        else all player are ready
        GM ->>G: Game.run()
        G->>W: start Game
        W->>Cl: start Game  
        end
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
            GC->>W: move Padle aproved
            W->> GM: move Padle aproved
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
        G->>D:store Gamestate
        G->>Ca: delete Cache
        G->>GM: finished
        W->>GC: finished
        W->>Cl:finished
        Note over Cl,D: RESTAPI
        GC->>D: giveResult
        D->>Cl: GameResult
    end
````
