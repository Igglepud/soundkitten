class VolumeProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const samples = input[0];
      if (samples.length > 0) {
        let sum = 0;
        for (let i = 0; i < samples.length; ++i) {
          sum += samples[i] * samples[i];
        }
        const rms = Math.sqrt(sum / samples.length);
        // Scale the volume to a more reasonable range
        const volume = Math.min(1, Math.max(0, rms * 5));
        this.port.postMessage(volume);
      }
    }
    return true;
  }
}

registerProcessor("volume-processor", VolumeProcessor);
