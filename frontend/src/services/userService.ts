import api from './api';

export interface User {
  id: string;
  nickname: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesTied: number;
  isOnline: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  nickname: string;
}

export const userService = {
  /**
   * Create a new user
   */
  createUser: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Get user by nickname
   */
  getUserByNickname: async (nickname: string): Promise<User> => {
    const response = await api.get<User>(`/users/nickname/${nickname}`);
    return response.data;
  },

  /**
   * Update user's online status
   */
  updateOnlineStatus: async (id: string, isOnline: boolean): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/online-status`, { isOnline });
    return response.data;
  },
};

export default userService;
