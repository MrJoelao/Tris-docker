import React from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../../context/AccessibilityContext';

interface GameStatusProps {
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
  currentTurn: 'X' | 'O';
  playerSymbol: 'X' | 'O';
  opponentNickname: string;
  isPlayerTurn: boolean;
  isDraw: boolean;
  isWinner: boolean;
  timeRemaining: number;
  isConnected: boolean;
  isOpponentDisconnected: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({
  status,
  currentTurn,
  playerSymbol,
  opponentNickname,
  isPlayerTurn,
  isDraw,
  isWinner,
  timeRemaining,
  isConnected,
  isOpponentDisconnected,
}) => {
  const { reducedMotion } = useAccessibility();

  // Get status message
  const getStatusMessage = () => {
    if (status === 'waiting') {
      return 'Waiting for another player to join...';
    }
    
    if (status === 'completed') {
      if (isDraw) {
        return 'Game ended in a draw!';
      }
      
      if (isWinner) {
        return 'You won the game!';
      } else {
        return 'You lost the game!';
      }
    }
    
    if (isOpponentDisconnected) {
      return 'The other player has disconnected. Waiting for reconnection...';
    }
    
    if (isPlayerTurn) {
      return 'Your turn';
    } else {
      return "Opponent's turn";
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (status === 'completed') {
      if (isDraw) {
        return 'text-gray-700';
      }
      
      if (isWinner) {
        return 'text-green-600';
      } else {
        return 'text-red-600';
      }
    }
    
    if (isOpponentDisconnected) {
      return 'text-amber-600';
    }
    
    if (isPlayerTurn) {
      return 'text-primary-700';
    } else {
      return 'text-secondary-700';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: reducedMotion ? 0.1 : 0.3 
      } 
    }
  };

  return (
    <motion.div 
      className="flex justify-between items-center mb-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div>
        <h2 className="text-2xl font-bold text-primary-800">Game vs {opponentNickname}</h2>
        <p className="text-gray-600">
          You are playing as <span className="font-bold">{playerSymbol}</span>
        </p>
        
        {/* Connection status */}
        <div className="flex items-center mt-1">
          <div 
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} mr-2`} 
            aria-hidden="true"
          ></div>
          <p className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className={`text-lg font-medium ${getStatusColor()}`} aria-live="polite">
          {getStatusMessage()}
        </p>
        
        {status === 'in_progress' && (
          <div className="flex items-center justify-end mt-1" aria-label={`Time remaining: ${timeRemaining} seconds`}>
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
    </motion.div>
  );
};

export default GameStatus;
