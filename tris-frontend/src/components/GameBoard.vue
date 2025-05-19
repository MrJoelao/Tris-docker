<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import PlayerProfile from './PlayerProfile.vue';

const props = defineProps({
  socket: Object,
  game: Object,
  playerId: String
});

const emit = defineEmits(['returnToLobby']);

const board = ref(Array(9).fill(''));
const winner = ref(null);
const isDraw = ref(false);
const isMyTurn = ref(false);
const statusMessage = ref('Waiting for opponent...');
const timeoutInterval = ref(null);
const lastMove = ref(null);
const winningCombination = ref([]);

const playerSymbol = computed(() => {
  if (!props.game) return '';
  return props.game.player1Id === props.playerId ? 'X' : 'O';
});

const opponentSymbol = computed(() => {
  return playerSymbol.value === 'X' ? 'O' : 'X';
});

const gameStatus = computed(() => {
  if (!props.game) return 'waiting';
  return props.game.status;
});

watch(() => props.game, (newGame) => {
  if (newGame) {
    // Parse the board if it's a string
    if (typeof newGame.board === 'string') {
      board.value = JSON.parse(newGame.board);
    } else if (Array.isArray(newGame.board)) {
      board.value = newGame.board;
    }

    // Update game status
    if (newGame.status === 'waiting') {
      statusMessage.value = 'Waiting for opponent...';
      isMyTurn.value = false;
    } else if (newGame.status === 'in_progress') {
      isMyTurn.value = (newGame.currentTurn === playerSymbol.value);
      statusMessage.value = isMyTurn.value ? 'Your turn' : 'Opponent\'s turn';
    } else if (newGame.status === 'completed') {
      if (newGame.winnerId === props.playerId) {
        statusMessage.value = 'You won!';
        winner.value = playerSymbol.value;
        // Calculate winning combination
        winningCombination.value = calculateWinningCombination(board.value, winner.value);
      } else {
        statusMessage.value = 'You lost!';
        winner.value = opponentSymbol.value;
        // Calculate winning combination
        winningCombination.value = calculateWinningCombination(board.value, winner.value);
      }
    } else if (newGame.status === 'draw') {
      statusMessage.value = 'Game ended in a draw!';
      isDraw.value = true;
    }
  }
}, { deep: true, immediate: true });

function makeMove(index) {
  if (!isMyTurn.value || board.value[index] !== '' || gameStatus.value !== 'in_progress') {
    return;
  }

  // Set the last move for animation
  lastMove.value = index;

  // Emit the move to the server
  props.socket.emit('makeMove', {
    gameId: props.game.id,
    playerId: props.playerId,
    position: index
  });
}

function calculateWinningCombination(board, symbol) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (const pattern of winPatterns) {
    if (pattern.every(index => board[index] === symbol)) {
      return pattern;
    }
  }

  return [];
}

function checkTimeout() {
  props.socket.emit('checkTimeout', { gameId: props.game.id });
}

onMounted(() => {
  // Set up a timer to check for timeout every 5 seconds
  timeoutInterval.value = setInterval(checkTimeout, 5000);
});

onUnmounted(() => {
  if (timeoutInterval.value) {
    clearInterval(timeoutInterval.value);
  }
});
</script>

<template>
  <div>
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-2xl font-bold">Game #{{ game?.id?.substring(0, 8) }}</h2>
      <button @click="emit('returnToLobby')" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors">
        Back to Lobby
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Your profile -->
      <PlayerProfile 
        :player-id="playerId" 
        :symbol="playerSymbol" 
        :is-current-turn="isMyTurn" 
      />
      
      <!-- Opponent profile (if exists) -->
      <PlayerProfile 
        v-if="game?.player2Id" 
        :player-id="game.player2Id" 
        :symbol="opponentSymbol" 
        :is-current-turn="gameStatus === 'in_progress' && !isMyTurn" 
      />
      <div v-else class="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center">
        <p class="text-center opacity-70">Waiting for opponent to join...</p>
      </div>
    </div>
    
    <div class="mb-4 p-3 bg-white/5 rounded-lg text-center">
      <p class="text-lg font-medium">{{ statusMessage }}</p>
    </div>
    
    <div class="grid grid-cols-3 gap-3 mb-6">
      <button 
        v-for="(cell, index) in board" 
        :key="index"
        @click="makeMove(index)"
        class="aspect-square flex items-center justify-center text-4xl font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300"
        :class="{
          'cursor-not-allowed opacity-80': !isMyTurn || cell !== '' || gameStatus !== 'in_progress',
          'bg-green-400/20 scale-105': winningCombination.includes(index),
          'animate-pulse': lastMove === index,
          'hover:scale-105': cell === '' && isMyTurn && gameStatus === 'in_progress'
        }"
      >
        <span 
          v-if="cell" 
          class="transform transition-all duration-300"
          :class="{
            'scale-0 opacity-0': lastMove === index,
            'scale-100 opacity-100': lastMove !== index,
            'text-blue-300': cell === 'X',
            'text-pink-300': cell === 'O'
          }"
        >
          {{ cell }}
        </span>
      </button>
    </div>
    
    <div v-if="gameStatus === 'completed' || gameStatus === 'draw'" class="mt-4 p-4 bg-white/10 rounded-lg text-center">
      <p class="text-xl font-bold mb-2">
        {{ isDraw ? 'Game ended in a draw!' : (winner === playerSymbol ? 'You won!' : 'You lost!') }}
      </p>
      <button @click="emit('returnToLobby')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
        Play Again
      </button>
    </div>
  </div>
</template>
