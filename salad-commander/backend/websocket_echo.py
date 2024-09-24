# example code form https://websockets.readthedocs.io/en/stable/

import time
import math
import asyncio
import os
from websockets.asyncio.server import serve

posXY = [0.4,0.4]
lastMsg = time.time()

def foo():
    t = time.time()
    numberA = 0.5 * math.sin(17 * t / 10) + 0.5
    numberB = 0.5 * math.cos( 4 * t / 10) + 0.5
    if (time.time() - lastMsg < 3):
        numberA = posXY[1]
        numberB = posXY[0]
    return ("[" + str(numberA) + ", " + str(numberB) + "]")


async def echo(websocket):
    async for message in websocket:
        if (message != "client"):
            global posXY
            global lastMsg
            posXY = [float(x) for x in message.split(',')]
            lastMsg = time.time()
        await websocket.send(foo())

async def main():
    async with serve(echo, "", os.environ["PORT"]):
        await asyncio.get_running_loop().create_future()  # run forever

asyncio.run(main())