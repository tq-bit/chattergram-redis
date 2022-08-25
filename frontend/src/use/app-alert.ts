import { ref, computed } from 'vue';

import { AlertVariant } from '../@types/commons';

export interface AlertComposableConfig {
  variant?: AlertVariant;
  message: string;
}

const variantState = ref<AlertVariant>('info');
const messageState = ref('');
const showAppAlertState = ref(false);
const timeoutHandler = ref<ReturnType<typeof setTimeout> | null>(null);

export default function useAppAlert() {
  const variant = computed(() => variantState.value);
  const message = computed(() => messageState.value);
  const showAppAlert = computed(() => showAppAlertState.value);

  const setAlertConfig = ({ variant, message }: AlertComposableConfig) => {
    variantState.value = variant || 'info';
    messageState.value = message;
  };

  const triggerAppAlert = (
    payload: AlertComposableConfig,
    timeout: number = 3500,
  ) => {
    showAppAlertState.value = true;
    setAlertConfig(payload);

    if (timeoutHandler.value) {
      clearTimeout(timeoutHandler.value);
    }
    timeoutHandler.value = setTimeout(() => {
      showAppAlertState.value = false;
    }, timeout);
  };

  return { triggerAppAlert, showAppAlert, message, variant };
}
