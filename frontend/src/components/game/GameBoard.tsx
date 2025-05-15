import React from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../../context/AccessibilityContext';

interface GameBoardProps {
  board: Array<Array<string | null>>;
  onCellClick: (row: number, col: number) => void;
  isInteractive: boolean;
  currentPlayerSymbol: 'X' | 'O' | null;
  winningCells?: Array<[number, number]>;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  isInteractive,
  currentPlayerSymbol,
  winningCells = [],
}) => {
  const { reducedMotion, highContrast } = useAccessibility();

  // Convert winning cells to a map for easy lookup
  const winningCellsMap = new Map<string, boolean>();
  winningCells.forEach(([row, col]) => {
    winningCellsMap.set(`${row}-${col}`, true);
  });

  // Animation variants
  const cellVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: reducedMotion ? 0.1 : 0.3 } },
    exit: { scale: 0.8, opacity: 0, transition: { duration: reducedMotion ? 0.1 : 0.3 } },
    hover: { scale: reducedMotion ? 1 : 1.05, transition: { duration: 0.2 } }
  };

  // Get cell background color based on state
  const getCellBackground = (row: number, col: number, value: string | null) => {
    // Winning cell
    if (winningCellsMap.has(`${row}-${col}`)) {
      return 'bg-green-200 text-green-800';
    }
    
    // Normal cell
    if (value === null) {
      return highContrast 
        ? 'bg-gray-200 hover:bg-gray-300' 
        : 'bg-gray-100 hover:bg-gray-200';
    }
    
    if (value === 'X') {
      return highContrast 
        ? 'bg-blue-300 text-blue-900' 
        : 'bg-primary-100 text-primary-700';
    }
    
    return highContrast 
      ? 'bg-purple-300 text-purple-900' 
      : 'bg-secondary-100 text-secondary-700';
  };

  return (
    <div 
      className="grid grid-cols-3 gap-4 w-full max-w-md"
      role="grid"
      aria-label="Tic-Tac-Toe game board"
    >
      {board.map((row, rowIndex) => (
        row.map((cell, colIndex) => {
          const isWinningCell = winningCellsMap.has(`${rowIndex}-${colIndex}`);
          const cellPosition = rowIndex * 3 + colIndex + 1;
          const isClickable = isInteractive && cell === null;
          
          return (
            <motion.button
              key={`${rowIndex}-${colIndex}`}
              className={`aspect-square rounded-lg flex items-center justify-center text-4xl font-bold ${
                getCellBackground(rowIndex, colIndex, cell)
              } ${
                isClickable
                  ? 'shadow-md hover:shadow-lg cursor-pointer'
                  : 'cursor-default'
              } ${
                isWinningCell ? 'animate-pulse' : ''
              }`}
              onClick={() => isClickable && onCellClick(rowIndex, colIndex)}
              disabled={!isClickable}
              variants={cellVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              whileHover={isClickable ? "hover" : {}}
              aria-label={`Cell ${cellPosition}, ${cell || 'empty'}${isWinningCell ? ', winning cell' : ''}`}
              aria-disabled={!isClickable}
              tabIndex={isClickable ? 0 : -1}
            >
              {cell}
            </motion.button>
          );
        })
      ))}
    </div>
  );
};

export default GameBoard;
