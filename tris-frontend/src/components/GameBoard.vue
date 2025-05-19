<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

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
      } else {
        statusMessage.value = 'You lost!';
        winner.value = opponentSymbol.value;
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

  // Emit the move to the server
  props.socket.emit('makeMove', {
    gameId: props.game.id,
    playerId: props.playerId,
    position: index
  });
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
    
    <div class="mb-4 p-3 bg-white/5 rounded-lg">
      <p class="text-lg font-medium">{{ statusMessage }}</p>
      <div class="mt-2 flex justify-between">
        <div>
          <span class="font-bold">You:</span> {{ playerSymbol }}
        </div>
        <div v-if="game?.player2Id">
          <span class="font-bold">Opponent:</span> {{ opponentSymbol }}
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-3 gap-3 mb-6">
      <button 
        v-for="(cell, index) in board" 
        :key="index"
        @click="makeMove(index)"
        class="aspect-square flex items-center justify-center text-4xl font-bold bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        :class="{
          'cursor-not-allowed opacity-80': !isMyTurn || cell !== '' || gameStatus !== 'in_progress',
          'bg-green-400/20': winner && cell === winner,
        }"
      >
        {{ cell }}
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
