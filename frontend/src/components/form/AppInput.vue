<script setup lang="ts">
withDefaults(
  defineProps<{
    labelPrefix?: string;
    label?: string;
    placeholder?: string;
    modelValue?: string | number;
    error?: string;
    required?: boolean;
    requiredSign?: string;
    variant?: 'default' | 'chat';
  }>(),
  {
    required: false,
    requiredSign: '*',
    variant: 'default',
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', chatText: string): void;
}>();

const onInput = (ev: Event) =>
  emit('update:modelValue', (ev.target as HTMLInputElement).value);
</script>

<template>
  <div>
    <label v-if="label" class="mb-2 block font-semibold">
      {{ label }}
      <span class="text-red-500" v-if="required">{{ requiredSign }}</span>
    </label>
    <!-- @ts-ignore -->
    <input
      class="h-full bg-transparent p-2 outline-none"
      :class="{
        'w-full border-b border-gray-600 text-gray-900 transition-all focus:border-violet-600 dark:border-gray-400 dark:text-gray-100 focus:dark:border-violet-400 ':
          variant === 'default',
        'mt-2 h-10 w-full rounded-lg border border-gray-200 bg-gray-100 p-2 text-gray-800 outline-none  transition-all focus:outline-violet-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-50':
          variant === 'chat',
      }"
      v-bind="$attrs"
      @input="onInput"
      :value="modelValue"
      :required="required"
      :placeholder="labelPrefix ? labelPrefix + label?.toLowerCase() : label || $attrs.placeholder as string"
    />
  </div>
</template>
