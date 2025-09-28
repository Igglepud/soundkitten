class ToneGenerator {
  constructor() {
    this.audioContext = null;
    this.currentOscillator = null;
    this.currentGainNode = null;
  }

  // Initialize the audio context (call this once)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Play a tone at specified frequency
  playTone(frequency, duration = 1000, volume = 0.1, waveType = 'sine') {
    if (!this.audioContext) {
      this.init();
    }

    // Stop any currently playing tone
    this.stopTone();

    // Create oscillator and gain node
    this.currentOscillator = this.audioContext.createOscillator();
    this.currentGainNode = this.audioContext.createGain();

    // Connect nodes
    this.currentOscillator.connect(this.currentGainNode);
    this.currentGainNode.connect(this.audioContext.destination);

    // Set properties
    this.currentOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    this.currentOscillator.type = waveType;

    // Fade in and out to prevent clicking
    const now = this.audioContext.currentTime;
    const fadeTime = 0.01; // 10ms fade

    this.currentGainNode.gain.setValueAtTime(0, now);
    this.currentGainNode.gain.linearRampToValueAtTime(volume, now + fadeTime);
    this.currentGainNode.gain.linearRampToValueAtTime(volume, now + duration/1000 - fadeTime);
    this.currentGainNode.gain.linearRampToValueAtTime(0, now + duration/1000);

    // Start and schedule stop
    this.currentOscillator.start(now);
    this.currentOscillator.stop(now + duration/1000);

    // Clean up references when done
    this.currentOscillator.onended = () => {
      this.currentOscillator = null;
      this.currentGainNode = null;
    };
  }

  // Stop any currently playing tone
  stopTone() {
    if (this.currentOscillator) {
      try {
        this.currentOscillator.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
      this.currentOscillator = null;
      this.currentGainNode = null;
    }
  }

  // Play a continuous tone (call stopTone() to stop it)
  playContinuousTone(frequency, volume = 0.1, waveType = 'sine') {
    if (!this.audioContext) {
      this.init();
    }

    // Stop any currently playing tone
    this.stopTone();

    // Create oscillator and gain node
    this.currentOscillator = this.audioContext.createOscillator();
    this.currentGainNode = this.audioContext.createGain();

    // Connect nodes
    this.currentOscillator.connect(this.currentGainNode);
    this.currentGainNode.connect(this.audioContext.destination);

    // Set properties
    this.currentOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    this.currentOscillator.type = waveType;

    // Fade in to prevent clicking
    const now = this.audioContext.currentTime;
    const fadeTime = 0.01;

    this.currentGainNode.gain.setValueAtTime(0, now);
    this.currentGainNode.gain.linearRampToValueAtTime(volume, now + fadeTime);

    // Start playing
    this.currentOscillator.start(now);
  }

  // Clean up resources
  destroy() {
    this.stopTone();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}