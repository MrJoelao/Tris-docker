<template>
  <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-2xl font-bold">Game History</h2>
      <button @click="loadHistory" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors flex items-center">
        <span class="mr-1">Refresh</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <div v-if="isLoading" class="text-center py-8">
      <LoadingSpinner message="Loading history..." />
    </div>
    
    <div v-else-if="errorMessage" class="bg-red-500/20 p-4 rounded-lg text-center">
      <p>{{ errorMessage }}</p>
      <button @click="loadHistory" class="mt-2 px-4 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors">
        Try Again
      </button>
    </div>
    
    <div v-else-if="gameHistory.length === 0" class="text-center py-8">
      <p class="mb-2">No game history yet</p>
      <p class="text-sm opacity-70">Play some games to see your history!</p>
    </div>
    
    <div v-else>
      <div class="space-y-3">
        <div 
          v-for="game in gameHistory" 
          :key="game.id" 
          class="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <div class="flex justify-between items-center">
            <div>
              <p class="font-medium">Game #{{ game.id.substring(0, 8) }}</p>
              <p class="text-sm opacity-70">{{ formatDate(game.updatedAt) }}</p>
            </div>
            <div>
              <span 
                class="px-2.5 py-1 rounded-md text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800': game.winnerId === playerId,
                  'bg-red-100 text-red-800': game.winnerId && game.winnerId !== playerId,
                  'bg-gray-100 text-gray-800': game.status === 'draw'
                }"
              >
                {{ getGameResult(game) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
  playerId: {
    type: String,
    required: true
  }
});

const gameHistory = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

onMounted(() => {
  loadHistory();
});

async function loadHistory() {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    // Use the new dedicated endpoint for game history
    const response = await fetch(`http://localhost:3000/games/history?playerId=${props.playerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game history');
    }
    
    gameHistory.value = await response.json();
    isLoading.value = false;
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load game history';
    isLoading.value = false;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function getGameResult(game) {
  if (game.status === 'draw') {
    return 'Draw';
  } else if (game.winnerId === props.playerId) {
    return 'Won';
  } else {
    return 'Lost';
  }
}
</script>
