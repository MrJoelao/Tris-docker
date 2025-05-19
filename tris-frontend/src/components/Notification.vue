<template>
  <transition name="fade">
    <div 
      v-if="show" 
      class="fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50"
      :class="typeClasses"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg v-if="type === 'success'" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else-if="type === 'error'" class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">
            {{ message }}
          </p>
        </div>
        <div class="ml-auto pl-3">
          <div class="-mx-1.5 -my-1.5">
            <button 
              @click="closeNotification" 
              class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="closeButtonClasses"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  },
  show: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close']);

const typeClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-green-50 text-green-800';
    case 'error':
      return 'bg-red-50 text-red-800';
    default:
      return 'bg-blue-50 text-blue-800';
  }
});

const closeButtonClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50';
    case 'error':
      return 'text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50';
    default:
      return 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50';
  }
});

function closeNotification() {
  emit('close');
}

let timer = null;

onMounted(() => {
  if (props.duration > 0) {
    timer = setTimeout(() => {
      closeNotification();
    }, props.duration);
  }
});

watch(() => props.show, (newVal) => {
  if (!newVal && timer) {
    clearTimeout(timer);
    timer = null;
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
