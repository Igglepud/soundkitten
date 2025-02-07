class gameScene extends Phaser.Scene {
  constructor() {
    super({ key: "gameScene" });
    this.micVolume = 0; // Initialize micVolume
    this.threshold = 0.5; // Initialize threshold
  }

  preload() {}

  create() {
    this.micVolumeText = this.add.text(10, 10, "Mic Volume: 0", {
      font: "16px Arial",
      fill: "#ffffff",
    });

    this.initMicrophone();
    this.initSlider();
  }

  update() {
    this.micVolumeText.setText("Mic Volume: " + this.micVolume.toFixed(2));
    if (this.micVolume > this.threshold) {
      console.log("Mic is loud!");
      alert("mic is too loud");
    }
  }

  initMicrophone() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => this.startMicrophone(stream))
      .catch((err) => console.error("getUserMedia error:", err));
  }

  async startMicrophone(stream) {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    await this.audioContext.audioWorklet.addModule("processor.js");

    // Create media stream source but don't connect to destination
    this.microphoneStream = this.audioContext.createMediaStreamSource(stream);

    // Create processor and connect only the stream to it
    this.processor = new AudioWorkletNode(
      this.audioContext,
      "volume-processor"
    );
    this.processor.port.onmessage = (event) =>
      this.processMicrophoneBuffer(event.data);

    // Simple, direct connection
    this.microphoneStream.connect(this.processor);
  }

  processMicrophoneBuffer(volume) {
    this.micVolume = volume;
    console.log("Mic Volume: ", this.micVolume);
  }

  initSlider() {
    const slider = document.getElementById("thresholdSlider");
    const thresholdValue = document.getElementById("thresholdValue");
    slider.addEventListener("input", (event) => {
      this.threshold = parseFloat(event.target.value);
      thresholdValue.textContent = event.target.value;
    });
  }

  shutdown() {
    if (this.microphoneStream) {
      this.microphoneStream.disconnect();
      this.microphoneStream = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: gameScene,
};

const game = new Phaser.Game(config);
