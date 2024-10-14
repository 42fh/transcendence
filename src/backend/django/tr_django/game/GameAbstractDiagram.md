## GAME ABSTRACT
````mermaid
sequenceDiagram
    
    participant Cl as Client
    participant U as User
    participant GC as GameCordinator
    participant D as Database
    box green AsyncWebsocketConsumer
    participant W as Websocket 
    participant Ch as Channel 
    participant G as GameManager
    participant Ca as GameCache 
    end
    Note over Cl,D: RESTAPI
    Note over Cl: CL decided the GAME(GAMESETTINGS) 
    Cl ->>+ U: User want to play GAME 
    alt User is not valid
        U ->> Cl: close connection
        Note over Cl, U: close conection 
    else User is valid
        U->>U: generate UUID
        U->>GC: User want to play GAME
        GC ->>D: is this GAME waiting
        alt no GAME waiting
            D->>D: create new GAME
            D->>GC: here is the GAME id
            GC->>Cl: here is your GameId and UUID
        else  yes GAME waiting
            D->>D: GAME to not waiting
            D->>GC: here is the GAME id
            GC->>Cl: here is your GameId and UUID
        end
        note over Cl, Ca: QUESTION, when do we give the GameId back
        note over W, Ca: WEBSOCKETS
        Cl->>W: open connection
        alt first Player
            W->>W: will create its self
            W->>Ch: will create Channel Layer
            W->> G: create first Instance
            G->>D: will ask for default GameState
            D->>G: get default GameState 
            G->> Ca: will create GameCache
            G->> Ca: store GameState
            loop GameManager.run()
            alt not all Player are ready
                note over W, Ca: WAITING FOR PLAYERS
            else all player are ready
                par GameLoop         
                loop every n ms
                    Ca->>G: getGamestate
                    G->>G: caculate Gamsate
                    alt Gamestate Client could know
                        Note over G: doing nothing 
                    else Gamestate Cleint couln not know 
                        G->>Ch: new Gamestate
                        W->>Cl: update Gamestate
            end
            G->>Ca: setGamestate
            end
        and Client Input
            opt Client want to move Padle
                Cl->>W: UUID want move Padle
                W->>G: UUID want move Padle
                G->>U: UUID want move Padle
                alt UUID/token is not valid or Padle move is not valid
                    U->>U: CHEAT detection LOG
                    Note over G: GameManager.updatePadle() get not informed   
                else everything correct
                    G->>G: update Padle
                    Ca->>G: getGamestate
                    G->>G: caculate Gamsate
                    G->>Ca: setGamestate
                    G->>Ch: new Gamestate
                    Ch->>W: GameManager wil reconice this
                    W->>Cl: update Gamestate
                end
            end 
        and  other player Input
                Ch-->W: send Update   
        end
        end
        end
        else Second player
            loop not first Player
            par other player Input
                Ch-->W: send Update 
            and Client  Input
            opt Client want to move Padle
                Cl->>W: UUID want move Padle
                W->>G: UUID want move Padle
                G->>U: UUID want move Padle
                alt UUID/token is not valid or Padle move is not valid
                    U->>U: CHEAT detection LOG
                    Note over G: GameManager.updatePadle() get not informed   
                else everything correct
                    G->>G: update Padle
                    Ca->>G: getGamestate
                    G->>G: caculate Gamsate
                    G->>Ca: setGamestate
                    G->>Ch: new Gamestate
                    Ch->>W: GameManager wil reconice this
                    W->>Cl: update Gamestate
                end
            end   
            end
            end
        


        end 
        break when a player won
            par save GameState 
                Ca->G: get result
                G->>D: save resullt
                G->>Ca: delete Cache    
            and finish 
                G->>Ch: Game over
                Ch->>W: Game over
                W->>Cl: game over 
            end
            note over Cl,D: RESTAPI
            Cl ->> D: result
            D->>Cl: result, statistic ....
        end
    end
      


````
