## STATEDIAGRAM

```` mermaid
stateDiagram-v2
    [*] --> openConnectionWebsocket 
    openConnectionWebsocket-->  FirstPlayer
    FirstPlayer -->Channels
    state FirstPlayer {
        [*] --> GameManager_1
        GameManager_1 --> REDIS
        GameManager_1 -->  GameManager_1.run()
        GameManager_1 --> GameManager.recieve() 
        GameManager.recieve() --> GameManager_1.updatePadle()
        GameManager_1.run() --> GameManager_1.updateGameState()
        GameManager_1.updateGameState()-->GameManager_1.finsih()
        GameManager_1.finsih() --> closeConnectionWebsocket
        read --> GameManager_1.run()
        GameManager_1.run() -->lock
        unlock --> GameManager_1.run()
        GameManager_1.run() --> Broadcast
    }

    openConnectionWebsocket--> SecondPlayer
    state SecondPlayer {
        [*] --> GameManager_2
        GameManager_2 --> closeConnectionWebsocket 
        GameManager.recieve() --> GameManager_2.finsih()
         GameManager.recieve() --> GameManager_2.updatePadle()
         GameManager_2.updatePadle() --> lock
         unlock -->GameManager_2.updatePadle()
         GameManager_2.finsih() --> closeConnectionWebsocket
        GameManager_2.updatePadle() -->Broadcast
    }
    state Channels {
        [*] --> Broadcast
        Broadcast --> GameManager.recieve()
        Broadcast --> [*]
    }
    state REDIS {
        [*] --> read
        read --> [*] 
        [*] --> lock 
        lock--> write
        write-->unlock
        unlock --> [*]
    }
    
    closeConnectionWebsocket --> [*]
   
````
