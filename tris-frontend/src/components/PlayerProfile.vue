<template>
  <div class="bg-white/10 backdrop-blur-sm rounded-lg p-4">
    <div class="flex items-center">
      <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold">
        {{ playerInitial }}
      </div>
      <div class="ml-3">
        <h3 class="font-medium">{{ displayName }}</h3>
        <p class="text-sm opacity-70">Playing as: {{ symbol }}</p>
      </div>
      <div v-if="isCurrentTurn" class="ml-auto">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Your Turn
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  playerId: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  isCurrentTurn: {
    type: Boolean,
    default: false
  }
});

const playerInitial = computed(() => {
  return props.playerId.charAt(0).toUpperCase();
});

const displayName = computed(() => {
  // Extract the random part after 'player_' and capitalize the first letter
  const namePart = props.playerId.split('_')[1] || '';
  return 'Player ' + namePart.charAt(0).toUpperCase() + namePart.slice(1, 4);
});
</script>
