<script setup>
import { ref, onMounted } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
  socket: Object,
  playerId: String
});

const emit = defineEmits(['startGame']);

const games = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(async () => {
  try {
    // Fetch available games from the API
    const response = await fetch('http://localhost:3000/games');
    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }
    games.value = await response.json();
    isLoading.value = false;
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load games';
    isLoading.value = false;
  }
});

async function createNewGame() {
  try {
    isLoading.value = true;
    const response = await fetch('http://localhost:3000/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to create game');
    }
    
    const game = await response.json();
    emit('startGame', game.id);
  } catch (error) {
    errorMessage.value = error.message || 'Failed to create game';
    isLoading.value = false;
  }
}

async function joinGame(gameId) {
  try {
    isLoading.value = true;
    const response = await fetch(`http://localhost:3000/games/${gameId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ playerId: props.playerId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to join game');
    }
    
    emit('startGame', gameId);
  } catch (error) {
    errorMessage.value = error.message || 'Failed to join game';
    isLoading.value = false;
  }
}

function refreshGames() {
  isLoading.value = true;
  errorMessage.value = '';
  
  fetch('http://localhost:3000/games')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      return response.json();
    })
    .then(data => {
      games.value = data;
      isLoading.value = false;
    })
    .catch(error => {
      errorMessage.value = error.message || 'Failed to load games';
      isLoading.value = false;
    });
}
</script>

<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold">Game Lobby</h2>
      <button @click="refreshGames" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors flex items-center">
        <span class="mr-1">Refresh</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <div class="mb-6">
      <button @click="createNewGame" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium">
        Create New Game
      </button>
    </div>
    
    <div v-if="isLoading" class="text-center py-8">
      <LoadingSpinner message="Loading games..." />
    </div>
    
    <div v-else-if="errorMessage" class="bg-red-500/20 p-4 rounded-lg text-center">
      <p>{{ errorMessage }}</p>
      <button @click="refreshGames" class="mt-2 px-4 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors">
        Try Again
      </button>
    </div>
    
    <div v-else-if="games.length === 0" class="text-center py-8">
      <p class="mb-2">No games available</p>
      <p class="text-sm opacity-70">Create a new game to start playing!</p>
    </div>
    
    <div v-else>
      <h3 class="text-lg font-medium mb-3">Available Games</h3>
      <div class="space-y-3">
        <div 
          v-for="game in games" 
          :key="game.id" 
          class="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          @click="joinGame(game.id)"
        >
          <div class="flex justify-between items-center">
            <div>
              <p class="font-medium">Game #{{ game.id.substring(0, 8) }}</p>
              <p class="text-sm opacity-70">Created {{ new Date(game.createdAt).toLocaleTimeString() }}</p>
            </div>
            <button class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
