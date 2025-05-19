<template>
  <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-2xl font-bold">Your Statistics</h2>
      <button @click="loadStats" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors flex items-center">
        <span class="mr-1">Refresh</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <div v-if="isLoading" class="text-center py-8">
      <LoadingSpinner message="Loading statistics..." />
    </div>
    
    <div v-else-if="errorMessage" class="bg-red-500/20 p-4 rounded-lg text-center">
      <p>{{ errorMessage }}</p>
      <button @click="loadStats" class="mt-2 px-4 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors">
        Try Again
      </button>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white/5 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold mb-1">{{ stats.totalGames }}</div>
        <div class="text-sm opacity-70">Games Played</div>
      </div>
      
      <div class="bg-white/5 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold mb-1 text-green-400">{{ stats.wins }}</div>
        <div class="text-sm opacity-70">Wins</div>
      </div>
      
      <div class="bg-white/5 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold mb-1 text-red-400">{{ stats.losses }}</div>
        <div class="text-sm opacity-70">Losses</div>
      </div>
      
      <div class="bg-white/5 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold mb-1 text-yellow-400">{{ stats.draws }}</div>
        <div class="text-sm opacity-70">Draws</div>
      </div>
      
      <div class="bg-white/5 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold mb-1">{{ stats.winRate }}%</div>
        <div class="text-sm opacity-70">Win Rate</div>
      </div>
      
      <div class="bg-white/5 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold mb-1">{{ stats.streak }}</div>
        <div class="text-sm opacity-70">Current Streak</div>
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

const stats = ref({
  totalGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  winRate: 0,
  streak: 0
});

const isLoading = ref(true);
const errorMessage = ref('');

onMounted(() => {
  loadStats();
});

async function loadStats() {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    // Fetch game history to calculate stats
    const response = await fetch(`http://localhost:3000/games/history?playerId=${props.playerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch game statistics');
    }
    
    const games = await response.json();
    
    // Calculate statistics
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let streak = 0;
    let currentStreak = 0;
    let lastResult = null;
    
    games.forEach(game => {
      if (game.status === 'draw') {
        draws++;
        lastResult = 'draw';
      } else if (game.winnerId === props.playerId) {
        wins++;
        lastResult = 'win';
      } else {
        losses++;
        lastResult = 'loss';
      }
    });
    
    // Calculate current streak (consecutive wins or losses)
    if (games.length > 0) {
      let currentResult = games[0].status === 'draw' 
        ? 'draw' 
        : (games[0].winnerId === props.playerId ? 'win' : 'loss');
        
      currentStreak = 1;
      
      for (let i = 1; i < games.length; i++) {
        const gameResult = games[i].status === 'draw' 
          ? 'draw' 
          : (games[i].winnerId === props.playerId ? 'win' : 'loss');
          
        if (gameResult === currentResult && gameResult !== 'draw') {
          currentStreak++;
        } else {
          break;
        }
      }
      
      if (currentResult === 'win') {
        streak = currentStreak;
      } else if (currentResult === 'loss') {
        streak = -currentStreak;
      } else {
        streak = 0;
      }
    }
    
    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    
    stats.value = {
      totalGames,
      wins,
      losses,
      draws,
      winRate,
      streak
    };
    
    isLoading.value = false;
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load statistics';
    isLoading.value = false;
  }
}
</script>
