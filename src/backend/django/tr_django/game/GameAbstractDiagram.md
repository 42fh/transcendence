## GAME ABSTRACT
````mermaid
sequenceDiagram
    participant Cl as Client
    participant U as User
    participant GC as GameCordinator
    participant G as Game
    participant Ca as Cache 
    participant D as Database
    participant W as Websocket 
    Note over Cl,D: RESTAPI
    Note over Cl: CL decided the GAME(GAMESETTINGS) 
    Cl ->>+ U: User want to play GAME 
    alt User is not valid
        U->>Cl: sorry are ar not allowed
        Note over Cl, U: close conection 
    else User is valid
        U -> U: generate UUID
        U->>GC: User want to play GAME
        GC ->>D: is this GAME waiting
        alt no GAME waiting
            D->>D: create new GAME
            D->>GC: here is the GAME id
            GC->>G: create new GAME
            G->>Ca: create new Cache
            GC->>W: add new channel to Websocket with GameId
            GC->>Cl: here is your GameId and UUID
            note over Cl,W: WEBSOCKETS
            Cl->>W: open connection 
            note over Cl: Waiting for other Player

        else  yes GAME waiting
            D->>D: GAME to not waiting
            D->>GC: here is the GAME id
            GC->>Cl: here is your GameId and UUID
            note over Cl,W: WEBSOCKETS
            Cl->>W: open connection 
        end
        W->>GC:Player ready
        par GC to G         
            GC ->> G: Player ready
            G->>G: start Game
            loop every n ms
            Ca->>G: getGamestate
            G->>G: caculate Gamsate
            G->>Ca: setGamestate
            G->>W: new Gaestate
            W->>Cl: update Gamestate
            end
        and GC to W
            GC ->>W: start Game
            W->>Cl: start Game
            opt Client want to move Padle
                Cl->>W: UUID want move Padle
                W->>GC: UUID want move Padle
                GC->>GC: UUID want move Padle
                alt UUID/token is not valid or Padle move is not valid
                    GC->>GC: CHEAT detection LOG
                    Note over GC: GAME get not informed   
                else everything correct
                    GC->>G: update Padle
                    Ca->>G: getGamestate
                    G->>G: caculate Gamsate
                    G->>Ca: setGamestate
                    G->>W: new Gaestate
                    W->>Cl: update Gamestate
                end
            end   
        end
        break when a player won
            par G to D 
                Ca->G: get result
                G->>D: save resullt
                G->>Ca: delete Cache    
            and W to Cl
                G->>GC: Game over
                GC->>W: Game over
                W->>Cl: game over 
            end
            note over Cl,D: RESTAPI
            GC->>Cl: you are wo or loose, result, statistic ....
        end
    end
      
````
