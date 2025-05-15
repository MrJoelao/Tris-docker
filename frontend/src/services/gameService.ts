import api from './api';
import { User } from './userService';

export interface Game {
  id: string;
  playerXId: string;
  playerOId: string | null;
  playerX: User;
  playerO: User | null;
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
  winnerId: string | null;
  isDraw: boolean;
  currentTurn: 'X' | 'O';
  board: Array<Array<string | null>>;
  moveCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGameRequest {
  creatorId: string;
}

export interface JoinGameRequest {
  userId: string;
}

export interface MakeMoveRequest {
  playerId: string;
  row: number;
  col: number;
}

export interface UndoMoveRequest {
  playerId: string;
}

export const gameService = {
  /**
   * Create a new game
   */
  createGame: async (data: CreateGameRequest): Promise<Game> => {
    const response = await api.post<Game>('/games', data);
    return response.data;
  },

  /**
   * Get all available games (waiting for players)
   */
  getAvailableGames: async (): Promise<Game[]> => {
    const response = await api.get<Game[]>('/games');
    return response.data;
  },

  /**
   * Get game by ID
   */
  getGameById: async (id: string): Promise<Game> => {
    const response = await api.get<Game>(`/games/${id}`);
    return response.data;
  },

  /**
   * Join a game
   */
  joinGame: async (id: string, data: JoinGameRequest): Promise<Game> => {
    const response = await api.put<Game>(`/games/${id}/join`, data);
    return response.data;
  },

  /**
   * Make a move in a game
   */
  makeMove: async (id: string, data: MakeMoveRequest): Promise<Game> => {
    const response = await api.post<Game>(`/games/${id}/moves`, data);
    return response.data;
  },

  /**
   * Undo the last move in a game
   */
  undoMove: async (id: string, data: UndoMoveRequest): Promise<Game> => {
    const response = await api.post<Game>(`/games/${id}/undo`, data);
    return response.data;
  },
};

export default gameService;
