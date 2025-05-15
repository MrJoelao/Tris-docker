import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useSocket } from '../context/SocketContext';
import { useAccessibility } from '../context/AccessibilityContext';

interface GameState {
  id: string;
  playerXId: string;
  playerOId: string;
  playerX: {
    id: string;
    nickname: string;
  };
  playerO: {
    id: string;
    nickname: string;
  };
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
  winnerId: string | null;
  isDraw: boolean;
  currentTurn: 'X' | 'O';
  board: Array<Array<string | null>>;
  moveCount: number;
  createdAt: string;
  updatedAt: string;
}

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { user } = useUser();
  const { socket, isConnected, joinGame, leaveGame, makeMove, undoMove } = useSocket();
  const { reducedMotion } = useAccessibility();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmLeave, setShowConfirmLeave] = useState<boolean>(false);
  const [lastMoveTime, setLastMoveTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [playerDisconnected, setPlayerDisconnected] = useState<boolean>(false);
  const [showUndoTooltip, setShowUndoTooltip] = useState<boolean>(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch game data
  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/games/${gameId}`);
        setGame(response.data);
        setError(null);
        
        // Set last move time for the timer
        if (response.data.moveCount > 0) {
          setLastMoveTime(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch game', error);
        setError('Failed to load the game. It may no longer exist.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // Join game room when connected
  useEffect(() => {
    if (isConnected && gameId && user) {
      joinGame(gameId);
      
      // Show undo tooltip after 2 seconds
      const timer = setTimeout(() => {
        setShowUndoTooltip(true);
        
        // Hide after 5 seconds
        setTimeout(() => {
          setShowUndoTooltip(false);
        }, 5000);
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        leaveGame(gameId);
      };
    }
  }, [isConnected, gameId, user, joinGame, leaveGame]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    
    const handleGameUpdated = (updatedGame: GameState) => {
      setGame(updatedGame);
      setLastMoveTime(new Date());
      setTimeRemaining(30);
    };
    
    const handlePlayerJoined = (data: { gameId: string, userId: string }) => {
      if (data.gameId === gameId) {
        // Refresh game data
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/games/${gameId}`)
          .then(response => {
            setGame(response.data);
          })
          .catch(error => {
            console.error('Failed to refresh game after player joined', error);
          });
        
        setPlayerDisconnected(false);
      }
    };
    
    const handlePlayerDisconnected = (data: { gameId: string, userId: string }) => {
      if (data.gameId === gameId) {
        setPlayerDisconnected(true);
      }
    };
    
    const handleGameOver = (data: { gameId: string, isDraw: boolean, winnerId: string | null }) => {
      if (data.gameId === gameId) {
        // Show game over notification
      }
    };
    
    socket.on('game_updated', handleGameUpdated);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_disconnected', handlePlayerDisconnected);
    socket.on('game_over', handleGameOver);
    
    return () => {
      socket.off('game_updated', handleGameUpdated);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_disconnected', handlePlayerDisconnected);
      socket.off('game_over', handleGameOver);
    };
  }, [socket, gameId]);

  // Move timer countdown
  useEffect(() => {
    if (!game || game.status !== 'in_progress' || !lastMoveTime) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - lastMoveTime.getTime()) / 1000);
      const remaining = Math.max(0, 30 - elapsedSeconds);
      
      setTimeRemaining(remaining);
      
      // Auto-timeout after 30 seconds of inactivity
      if (remaining === 0) {
        // TODO: Handle timeout
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [game, lastMoveTime]);

  const handleCellClick = (row: number, col: number) => {
    if (!game || !user) return;
    
    // Check if it's the user's turn
    const isPlayerX = game.playerXId === user.id;
    const isPlayerO = game.playerOId === user.id;
    const isUserTurn = (isPlayerX && game.currentTurn === 'X') || (isPlayerO && game.currentTurn === 'O');
    
    if (!isUserTurn) return;
    
    // Check if cell is empty
    if (game.board[row][col] !== null) return;
    
    // Make the move
    makeMove(game.id, row, col);
  };

  const handleUndoRequest = () => {
    if (!game || !user) return;
    
    undoMove(game.id);
  };

  const handleLeaveGame = () => {
    setShowConfirmLeave(true);
  };

  const confirmLeaveGame = () => {
    navigate('/dashboard');
  };

  const cancelLeaveGame = () => {
    setShowConfirmLeave(false);
  };

  // Check if it's the user's turn
  const isUserTurn = () => {
    if (!game || !user) return false;
    
    const isPlayerX = game.playerXId === user.id;
    const isPlayerO = game.playerOId === user.id;
    
    return (isPlayerX && game.currentTurn === 'X') || (isPlayerO && game.currentTurn === 'O');
  };

  // Get the current game status message
  const getStatusMessage = () => {
    if (!game || !user) return '';
    
    if (game.status === 'waiting') {
      return 'Waiting for another player to join...';
    }
    
    if (game.status === 'completed') {
      if (game.isDraw) {
        return 'Game ended in a draw!';
      }
      
      if (game.winnerId === user.id) {
        return 'You won the game!';
      } else {
        return 'You lost the game!';
      }
    }
    
    if (playerDisconnected) {
      return 'The other player has disconnected. Waiting for reconnection...';
    }
    
    if (isUserTurn()) {
      return 'Your turn';
    } else {
      return "Opponent's turn";
    }
  };

  // Get opponent's nickname
  const getOpponentNickname = () => {
    if (!game || !user) return '';
    
    if (game.playerXId === user.id) {
      return game.playerO?.nickname || 'Waiting for opponent...';
    } else {
      return game.playerX?.nickname || 'Unknown opponent';
    }
  };

  // Animation variants
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

  const cellVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: reducedMotion ? 0.1 : 0.3 } },
    exit: { scale: 0.8, opacity: 0, transition: { duration: reducedMotion ? 0.1 : 0.3 } },
    hover: { scale: reducedMotion ? 1 : 1.05, transition: { duration: 0.2 } }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-700 to-primary-900">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-700 to-primary-900 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error || 'Game not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
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
            <div className="flex items-center mt-1">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} mr-2`} 
                aria-hidden="true"></div>
              <p className="text-primary-200">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLeaveGame}
            className="bg-primary-800 hover:bg-primary-900 text-white px-4 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-800"
            aria-label="Leave game"
          >
            Leave Game
          </button>
        </motion.header>

        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary-800">Game vs {getOpponentNickname()}</h2>
              <p className="text-gray-600">
                You are playing as <span className="font-bold">{game.playerXId === user.id ? 'X' : 'O'}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-medium text-primary-700">{getStatusMessage()}</p>
              {game.status === 'in_progress' && (
                <div className="flex items-center justify-end mt-1">
                  <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className={`h-2.5 rounded-full ${timeRemaining > 10 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${(timeRemaining / 30) * 100}%` }}
                      aria-hidden="true"
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{timeRemaining}s</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center relative">
            {showUndoTooltip && game.moveCount > 0 && isUserTurn() && (
              <div className="absolute -top-12 right-4 bg-secondary-500 text-white p-3 rounded-lg shadow-lg max-w-xs z-10" role="tooltip">
                <p className="text-sm">You can undo your last move!</p>
                <div className="absolute -bottom-2 right-4 w-4 h-4 bg-secondary-500 transform rotate-45"></div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {game.board.map((row, rowIndex) => (
                row.map((cell, colIndex) => (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    className={`aspect-square rounded-lg flex items-center justify-center text-4xl font-bold ${
                      cell === null 
                        ? 'bg-gray-100 hover:bg-gray-200 cursor-pointer' 
                        : cell === 'X' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-secondary-100 text-secondary-700'
                    } ${
                      game.status === 'in_progress' && isUserTurn() && cell === null
                        ? 'shadow-md hover:shadow-lg'
                        : ''
                    }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={game.status !== 'in_progress' || !isUserTurn() || cell !== null}
                    variants={cellVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover={game.status === 'in_progress' && isUserTurn() && cell === null ? "hover" : {}}
                    aria-label={`Cell ${rowIndex * 3 + colIndex + 1}, ${cell || 'empty'}`}
                  >
                    {cell}
                  </motion.button>
                ))
              ))}
            </div>
          </div>

          {game.status === 'in_progress' && game.moveCount > 0 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleUndoRequest}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                disabled={!isUserTurn()}
                aria-label="Undo last move"
              >
                Undo Last Move
              </button>
            </div>
          )}

          {game.status === 'completed' && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Back to dashboard"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Confirmation dialog for leaving game */}
      <AnimatePresence>
        {showConfirmLeave && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-2xl font-bold text-primary-800 mb-4">Leave Game?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to leave this game? If the game is in progress, it will be marked as abandoned.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelLeaveGame}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLeaveGame}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Leave game"
                >
                  Leave Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamePage;
