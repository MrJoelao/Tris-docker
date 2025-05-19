<script setup>
import { ref, onMounted } from 'vue';
import GameBoard from './components/GameBoard.vue';
import GameLobby from './components/GameLobby.vue';
import GameHistory from './components/GameHistory.vue';
import GameStats from './components/GameStats.vue';
import Notification from './components/Notification.vue';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
const currentView = ref('lobby'); // 'lobby' or 'game'
const currentGame = ref(null);
const playerId = ref(generatePlayerId());
const isConnected = ref(false);

// Notification state
const notification = ref({
  show: false,
  message: '',
  type: 'info', // 'success', 'error', 'info'
  duration: 3000
});

function generatePlayerId() {
  return 'player_' + Math.random().toString(36).substring(2, 9);
}

function startGame(gameId) {
  currentGame.value = { id: gameId };
  currentView.value = 'game';
  
  // Join the game via WebSocket
  socket.emit('joinGame', { gameId, playerId: playerId.value });
}

function returnToLobby() {
  currentView.value = 'lobby';
  currentGame.value = null;
}

function showNotification(message, type = 'info', duration = 3000) {
  notification.value = {
    show: true,
    message,
    type,
    duration
  };
}

function hideNotification() {
  notification.value.show = false;
}

onMounted(() => {
  socket.on('connect', () => {
    isConnected.value = true;
    console.log('Connected to server');
    showNotification('Connected to server', 'success');
  });

  socket.on('disconnect', () => {
    isConnected.value = false;
    console.log('Disconnected from server');
    showNotification('Disconnected from server', 'error');
  });

  socket.on('gameUpdated', (game) => {
    if (currentGame.value && game.id === currentGame.value.id) {
      currentGame.value = game;
      
      // Show notifications for game state changes
      if (game.status === 'completed') {
        const isWinner = game.winnerId === playerId.value;
        showNotification(
          isWinner ? 'You won the game!' : 'You lost the game.', 
          isWinner ? 'success' : 'info',
          5000
        );
      } else if (game.status === 'draw') {
        showNotification('Game ended in a draw!', 'info', 5000);
      }
    }
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    showNotification(error.message || 'An error occurred', 'error');
  });
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 md:p-8">
    <Notification 
      v-if="notification.show" 
      :message="notification.message" 
      :type="notification.type" 
      :duration="notification.duration" 
      :show="notification.show"
      @close="hideNotification"
    />
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold mb-2">Tris Game</h1>
      <p class="text-lg opacity-80">Multiplayer Tic-Tac-Toe</p>
      <div class="mt-2">
        <span v-if="isConnected" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span class="h-2 w-2 mr-1 bg-green-400 rounded-full"></span>
          Connected
        </span>
        <span v-else class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <span class="h-2 w-2 mr-1 bg-red-400 rounded-full"></span>
          Disconnected
        </span>
      </div>
    </header>

    <main class="max-w-4xl mx-auto">
      <div v-if="currentView === 'lobby'" class="space-y-6">
        <div class="card bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          <GameLobby :socket="socket" :player-id="playerId" @start-game="startGame" />
        </div>
        
        <GameStats :player-id="playerId" />
        
        <GameHistory :player-id="playerId" />
      </div>
      
      <div v-else-if="currentView === 'game'" class="card bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
        <GameBoard 
          :socket="socket" 
          :game="currentGame" 
          :player-id="playerId" 
          @return-to-lobby="returnToLobby" 
        />
      </div>
    </main>

    <footer class="mt-8 text-center text-sm opacity-70">
      <p>© {{ new Date().getFullYear() }} Tris Game - Multiplayer Tic-Tac-Toe</p>
    </footer>
  </div>
</template>
