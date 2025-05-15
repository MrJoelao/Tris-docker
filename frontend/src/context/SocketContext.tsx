import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './UserContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGame: (gameId: string) => void;
  leaveGame: (gameId: string) => void;
  makeMove: (gameId: string, row: number, col: number) => void;
  undoMove: (gameId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      // If no user is logged in, disconnect socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      
      // Identify user to the server
      newSocket.emit('identify', { userId: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  const joinGame = (gameId: string) => {
    if (socket && user) {
      socket.emit('join_game', { gameId, userId: user.id });
    }
  };

  const leaveGame = (gameId: string) => {
    if (socket && user) {
      socket.emit('leave_game', { gameId, userId: user.id });
    }
  };

  const makeMove = (gameId: string, row: number, col: number) => {
    if (socket && user) {
      socket.emit('make_move', {
        gameId,
        move: {
          playerId: user.id,
          row,
          col,
        },
      });
    }
  };

  const undoMove = (gameId: string) => {
    if (socket && user) {
      socket.emit('undo_move', {
        gameId,
        playerId: user.id,
      });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinGame, leaveGame, makeMove, undoMove }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
