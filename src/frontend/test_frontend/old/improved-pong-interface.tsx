import React, { useState } from 'react';

const PongInterface = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [gameType, setGameType] = useState('regular');
  const [formData, setFormData] = useState({
    gameId: '',
    playerId: '',
    numPlayers: 2,
    numSides: 4,
    numBalls: 1,
    shape: 'regular',
    scoreMode: 'classic'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Handle game start logic
    console.log('Starting game with settings:', formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
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

        {/* Settings Toggle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition"
          >
            {showSettings ? 'Hide Settings ▼' : 'Show Settings ▶'}
          </button>
        </div>

        {/* Advanced Settings Section */}
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
                  <option value="classic">Classic Pong</option>
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

              {gameType === 'irregular' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shape
                  </label>
                  <select
                    name="shape"
                    value={formData.shape}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="regular">Regular</option>
                    <option value="star">Star</option>
                    <option value="crazy">Crazy</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Mode
                </label>
                <select
                  name="scoreMode"
                  value={formData.scoreMode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="classic">Classic (First to 11)</option>
                  <option value="timed">Timed (5 minutes)</option>
                  <option value="survival">Survival</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold"
          >
            Start Game
          </button>
        </div>
      </form>
    </div>
  );
};

export default PongInterface;
