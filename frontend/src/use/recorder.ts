import { ref } from 'vue';

const mediaObject = ref<MediaStream | null>(null);

export default function useRecorder() {
  const hasAudioPermission = ref<boolean>(false);
  const isRecording = ref<boolean>(false);
  const audioChunks = ref<Blob[]>([]);
  const recordedFile = ref<Blob | null>();
  const audioRecorder = ref<MediaRecorder | null>(null);

  const requestAudioPermission = async () => {
    try {
      mediaObject.value = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      hasAudioPermission.value = true;
    } catch (error) {
      hasAudioPermission.value = false;
    }
  };

  const handleAudioRecording = () => {
    if (!!mediaObject.value && !!audioRecorder.value) {
      audioRecorder.value.ondataavailable = (ev) => {
        audioChunks.value.push(ev.data);
        if (isRecording.value === false) {
          recordedFile.value = new Blob(audioChunks.value, {
            type: 'audio/mp3',
          });
        }
      };
    }
  };

  const startRecording = async () => {
    if (!mediaObject.value) {
      return await requestAudioPermission();
    }
    audioRecorder.value = new MediaRecorder(mediaObject.value);

    recordedFile.value = null;
    audioChunks.value = [];
    isRecording.value = true;
    audioRecorder.value.start();

    handleAudioRecording();
  };

  const stopRecording = () => {
    isRecording.value = false;
    audioRecorder.value?.stop();
  };

  return {
    requestAudioPermission,
    recordedFile,
    startRecording,
    stopRecording,
    isRecording,
    hasAudioPermission,
  };
}
