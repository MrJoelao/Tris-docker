<template>
  <div class="flex justify-center items-center">
    <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
    <span v-if="message" class="ml-3">{{ message }}</span>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: ''
  }
});
</script>
