import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useAccessibility } from '../context/AccessibilityContext';

interface Game {
  id: string;
  playerX: {
    id: string;
    nickname: string;
  };
  playerO?: {
    id: string;
    nickname: string;
  };
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useUser();
  const { reducedMotion } = useAccessibility();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch available games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/games`);
        setGames(response.data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch games', error);
        setError('Failed to load available games. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchGames, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const createNewGame = async () => {
    if (!user) return;
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/games`, {
        creatorId: user.id
      });
      
      navigate(`/game/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create game', error);
      setError('Failed to create a new game. Please try again.');
    }
  };

  const joinGame = async (gameId: string) => {
    if (!user) return;
    
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/games/${gameId}/join`, {
        userId: user.id
      });
      
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Failed to join game', error);
      setError('Failed to join the game. It may no longer be available.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0.1 : 0.5,
        when: "beforeChildren",
        staggerChildren: reducedMotion ? 0.1 : 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: reducedMotion ? 0.1 : 0.5 }
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-700 to-primary-900 p-4">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.header variants={itemVariants} className="flex justify-between items-center mb-8 text-white">
          <div>
            <h1 className="text-3xl font-bold">Tic-Tac-Toe</h1>
            <p className="text-primary-200">Welcome, {user.nickname}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-primary-200">Games: {user.gamesPlayed}</p>
              <p className="text-sm text-primary-200">Wins: {user.gamesWon}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-primary-800 hover:bg-primary-900 text-white px-4 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-800"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </motion.header>

        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-xl p-6 mb-8 relative">
          <h2 className="text-2xl font-bold text-primary-800 mb-4">Create New Game</h2>
          
          {showTooltip && (
            <div className="absolute -top-12 right-4 bg-secondary-500 text-white p-3 rounded-lg shadow-lg max-w-xs z-10" role="tooltip">
              <p className="text-sm">Create a new game and invite a friend to play!</p>
              <div className="absolute -bottom-2 right-4 w-4 h-4 bg-secondary-500 transform rotate-45"></div>
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-gray-600">Start a new game and wait for another player to join.</p>
            </div>
            <motion.button
              onClick={createNewGame}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              whileHover={reducedMotion ? {} : { scale: 1.05 }}
              whileTap={reducedMotion ? {} : { scale: 0.95 }}
              aria-label="Create new game"
            >
              Create Game
            </motion.button>
          </div>
          
          {/* Game board preview */}
          <div className="mt-6 flex justify-center">
            <div className="grid grid-cols-3 gap-2 w-48">
              {Array(9).fill(null).map((_, index) => (
                <div 
                  key={index}
                  className="aspect-square bg-gray-100 rounded-md flex items-center justify-center text-2xl font-bold text-gray-300"
                >
                  {index % 3 === 0 ? 'X' : index % 3 === 1 ? 'O' : ''}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-primary-800 mb-4">Available Games</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert">
              <p>{error}</p>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No games available. Create a new one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map((game) => (
                <motion.div
                  key={game.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition duration-200"
                  whileHover={reducedMotion ? {} : { scale: 1.02 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800">Game by {game.playerX.nickname}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(game.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => joinGame(game.id)}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      whileHover={reducedMotion ? {} : { scale: 1.05 }}
                      whileTap={reducedMotion ? {} : { scale: 0.95 }}
                      aria-label={`Join game created by ${game.playerX.nickname}`}
                    >
                      Join Game
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
