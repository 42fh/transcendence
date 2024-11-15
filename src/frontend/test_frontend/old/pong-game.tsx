import React, { useState, useEffect } from 'react';
import { AlertCircle, Activity } from 'lucide-react';

const SetupForm = ({ formData, setFormData, onSubmit }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [gameType, setGameType] = useState('regular');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Basic Game Info</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Game ID
            </label>
            <input
              type="text"
              name="gameId"
              value={formData.gameId}
              onChange={handleInputChange}
              placeholder="Enter game ID or leave empty for new game"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player ID
            </label>
            <input
              type="text"
              name="playerId"
              value={formData.playerId}
              onChange={handleInputChange}
              placeholder="Enter player ID or leave empty for random"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition"
        >
          {showSettings ? 'Hide Settings ▼' : 'Show Settings ▶'}
        </button>
      </div>

      {showSettings && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Game Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Type
              </label>
              <select
                name="gameType"
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="regular">Regular Pong</option>
                <option value="circular">Circular Pong</option>
                <option value="irregular">Irregular Pong</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Players
              </label>
              <input
                type="number"
                name="numPlayers"
                value={formData.numPlayers}
                onChange={handleInputChange}
                min="2"
                max="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {gameType !== 'classic' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Sides
                </label>
                <input
                  type="number"
                  name="numSides"
                  value={formData.numSides}
                  onChange={handleInputChange}
                  min="3"
                  max="12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Balls
              </label>
              <input
                type="number"
                name="numBalls"
                value={formData.numBalls}
                onChange={handleInputChange}
                min="1"
                max="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold"
        >
          Start Game
        </button>
      </div>
    </form>
  );
};

const PongGame = () => {
  const [showSetup, setShowSetup] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [events, setEvents] = useState([]);
  const [errors, setErrors] = useState([]);
  const [gameState, setGameState] = useState(null);
  
  const [formData, setFormData] = useState({
    gameId: 'test-123',
    playerId: 'player-1',
    numPlayers: 4,
    numSides: 6,
    numBalls: 2
  });

  useEffect(() => {
    if (gameStarted) {
      // Simulate initial game state
      const initialState = {
        balls: [
          { x: 0, y: 0, velocity_x: 0.1, velocity_y: 0.1, size: 0.05 },
          { x: -0.2, y: 0.2, velocity_x: -0.1, velocity_y: 0.1, size: 0.05 }
        ],
        paddles: [
          { position: 0.5, active: true, side_index: 0 },
          { position: 0.3, active: true, side_index: 2 },
          { position: 0.7, active: true, side_index: 3 },
          { position: 0.4, active: true, side_index: 5 }
        ],
        scores: [0, 0, 0, 0],
        dimensions: {
          paddle_length: 0.3,
          paddle_width: 0.1
        }
      };
      
      setGameState(initialState);
    }
  }, [gameStarted]);

  const handleStartGame = (e) => {
    e.preventDefault();
    setSetupData(formData);
    setGameStarted(true);
    setShowSetup(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showSetup ? (
        <div className="max-w-2xl mx-auto p-6">
          <SetupForm formData={formData} setFormData={setFormData} onSubmit={handleStartGame} />
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="flex gap-4">
            <div className="flex-grow flex flex-col gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 aspect-square">
                <div id="gameCanvas" className="w-full h-full bg-gray-100 rounded">
                  <svg id="pongSvg" viewBox="0 0 300 300" className="w-full h-full">
                    {gameState && (
                      <>
                        <path
                          d="M 150,50 L 250,100 L 250,200 L 150,250 L 50,200 L 50,100 Z"
                          fill="none"
                          stroke="gray"
                          strokeWidth="2"
                        />
                        {gameState.paddles.map((paddle, i) => (
                          <rect
                            key={i}
                            x={120 + (i * 20)}
                            y={50}
                            width="20"
                            height="10"
                            fill={i === 0 ? "orange" : "blue"}
                          />
                        ))}
                        {gameState.balls.map((ball, i) => (
                          <circle
                            key={i}
                            cx={150 + ball.x * 100}
                            cy={150 + ball.y * 100}
                            r={ball.size * 100}
                            fill="yellow"
                          />
                        ))}
                      </>
                    )}
                  </svg>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-4 h-48 overflow-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-lg">Event Log</h3>
                </div>
                <div id="eventLog" className="font-mono text-sm space-y-1">
                  {events.map((event, i) => (
                    <div key={i} className="text-gray-600">
                      [{new Date(event.timestamp).toLocaleTimeString()}] {event.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-80 flex flex-col gap-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-lg mb-3">Game Setup</h3>
                {setupData && (
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Game ID:</span> {setupData.gameId}</div>
                    <div><span className="font-medium">Player ID:</span> {setupData.playerId}</div>
                    <div><span className="font-medium">Players:</span> {setupData.numPlayers}</div>
                    <div><span className="font-medium">Sides:</span> {setupData.numSides}</div>
                    <div><span className="font-medium">Balls:</span> {setupData.numBalls}</div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-lg">Error Monitor</h3>
                </div>
                <div id="errorLog" className="text-sm space-y-2">
                  {errors.map((error, i) => (
                    <div key={i} className="p-2 bg-red-50 rounded border border-red-200">
                      <div className="text-red-700 font-medium">{error.error}</div>
                      <div className="text-red-600 text-xs">{error.details}</div>
                      <div className="text-red-400 text-xs">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-lg mb-2">Scores</h3>
                <div id="scoreDisplay" className="space-y-1">
                  {gameState?.scores.map((score, i) => (
                    <div 
                      key={i} 
                      className={`p-2 rounded ${i === 0 ? 'bg-orange-100' : 'bg-blue-50'}`}
                    >
                      Player {i + 1}: {score}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PongGame;
