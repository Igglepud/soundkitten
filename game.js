class gameScene extends Phaser.Scene {
  constructor() {
    super({ key: "gameScene" });
    this.micVolume = 0; // Initialize micVolume
  }

  preload() {}

  create() {
    this.micVolumeText = this.add.text(10, 10, "Mic Volume: 0", {
      font: "16px Arial",
      fill: "#ffffff",
    });

    this.initMicrophone();
  }

    update() {
        this.micVolumeText.setText("Mic Volume: " + this.micVolume.toFixed(2));
        if (this.micVolume > 0.5) {
            console.log("Mic is loud!");
            alert('mic is too loud')
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
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    this.microphoneStream = this.audioContext.createMediaStreamSource(stream);
    this.microphoneStream.connect(this.gainNode);

    this.processor = new AudioWorkletNode(
      this.audioContext,
      "volume-processor"
    );
    this.processor.port.onmessage = (event) =>
      this.processMicrophoneBuffer(event.data);
    this.microphoneStream.connect(this.processor);
  }

  processMicrophoneBuffer(volume) {
    this.micVolume = volume;
    console.log("Mic Volume: ", this.micVolume);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: gameScene,
};

const game = new Phaser.Game(config);
