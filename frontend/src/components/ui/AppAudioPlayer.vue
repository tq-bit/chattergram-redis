<script setup lang="ts">
import { onMounted, onUpdated, ref } from 'vue';
import iPlay from '../icons/iPlay.vue';
import iPause from '../icons/iPause.vue';

const audioPlayer = ref<HTMLAudioElement | null>(null);
const playbackTime = ref<number>(0);
const audioDuration = ref<number>(Infinity);
const isPlaying = ref<boolean>(false);

defineProps<{ audioFileUrl: string | null; loading: boolean }>();

const onClick = () => {
  if (audioPlayer.value) {
    if (isPlaying.value) {
      audioPlayer.value.pause();
    } else {
      audioPlayer.value.play();
    }
    isPlaying.value = !isPlaying.value;
  }
};

const onChange = (ev: Event) => {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = +(ev.target as HTMLInputElement).value;
    playbackTime.value = +(ev.target as HTMLInputElement).value;
  }
};

const syncAudioPlayer = () => {
  if (audioPlayer.value) {
    audioPlayer.value.ontimeupdate = () => {
      audioDuration.value = audioPlayer.value?.duration || Infinity;
      playbackTime.value = audioPlayer.value?.currentTime || 0;
    };

    audioPlayer.value.onended = () => {
      isPlaying.value = false;
    };
  }
};

onMounted(() => syncAudioPlayer());
onUpdated(() => syncAudioPlayer());
</script>

<template>
  <div class="my-2 flex flex-row items-center justify-start">
    <audio class="hidden" ref="audioPlayer" v-if="audioFileUrl" controls>
      <source :src="audioFileUrl" type="audio/mpeg" />
    </audio>

    <button
      :disabled="loading"
      class="mr-2 disabled:animate-pulse"
      @click="onClick"
      v-if="!isPlaying"
    >
      <i-play></i-play>
    </button>
    <button
      :disabled="loading"
      class="mr-2 disabled:animate-pulse"
      @click="onClick"
      v-if="isPlaying"
    >
      <i-pause></i-pause>
    </button>
    <input
      v-if="!loading"
      :disabled="loading"
      type="range"
      step="0.01"
      :value="playbackTime"
      :max="audioDuration"
      min="0"
      @change="onChange"
    />
    <div class="h-4 w-40 animate-pulse bg-violet-500" v-if="loading"></div>
  </div>
</template>

<style scoped>
input[type='range'] {
  @apply h-4 w-40 cursor-pointer bg-gray-200;
  -webkit-appearance: none;
}
input[type='range']:focus {
  @apply outline-none;
}
input[type='range']::-webkit-slider-runnable-track {
  @apply h-4 w-40 cursor-pointer bg-gray-200;
}
input[type='range']::-webkit-slider-thumb {
  @apply h-4 w-4 cursor-pointer bg-violet-300;
  -webkit-appearance: none;
}
input[type='range']:focus::-webkit-slider-runnable-track {
  background: #dddddd;
}
input[type='range']::-moz-range-track {
  @apply h-4 w-40 cursor-pointer bg-gray-200;
}
input[type='range']::-moz-range-thumb {
  @apply h-4 w-4 cursor-pointer bg-violet-300;
}
input[type='range']::-ms-track {
  @apply h-4 w-40 cursor-pointer bg-gray-200;
}
input[type='range']::-ms-fill-lower {
  @apply bg-gray-200;
}
input[type='range']::-ms-fill-upper {
  @apply bg-gray-200;
}
input[type='range']::-ms-thumb {
  @apply h-4 w-4 cursor-pointer bg-violet-300;
}
input[type='range']:focus::-ms-fill-lower {
  background: transparent;
}
input[type='range']:focus::-ms-fill-upper {
  background: transparent;
}
</style>
