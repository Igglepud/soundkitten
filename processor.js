class VolumeProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const samples = input[0];
      let sum = 0;
      for (let i = 0; i < samples.length; ++i) {
        sum += samples[i] * samples[i];
      }
      const volume = Math.sqrt(sum / samples.length);
      this.port.postMessage(volume);
    }
    return true;
  }
}

registerProcessor("volume-processor", VolumeProcessor);
