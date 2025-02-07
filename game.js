class gameScene extends Phaser.Scene {
  constructor() {
    super({ key: "gameScene" });
    this.micVolume = 0; // Initialize micVolume
    this.threshold = 0.5; // Initialize threshold
  }

  preload() {
    // Remove plugin loading
  }

  create() {
    this.micVolumeText = this.add.text(10, 10, "Mic Volume: 0", {
      font: "16px Arial",
      fill: "#ffffff",
    });

    this.createCustomSlider();
    this.initMicrophone();
  }

  createCustomSlider() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Add threshold text
    this.thresholdText = this.add
      .text(width / 2, height - 60, "Threshold: 0.5", {
        font: "16px Arial",
        fill: "#ffffff",
      })
      .setOrigin(0.5);

    // Create slider track
    const trackWidth = 200;
    const trackHeight = 4;
    this.sliderTrack = this.add.rectangle(
      width / 2,
      height - 30,
      trackWidth,
      trackHeight,
      0x333333
    );

    // Create slider thumb
    this.sliderThumb = this.add.circle(width / 2, height - 30, 8, 0xcccccc);
    this.sliderThumb.setInteractive({ draggable: true });

    // Store slider properties
    this.sliderStartX = this.sliderTrack.x - trackWidth / 2;
    this.sliderEndX = this.sliderTrack.x + trackWidth / 2;

    // Add drag events
    this.sliderThumb.on("drag", (pointer, dragX) => {
      const x = Phaser.Math.Clamp(dragX, this.sliderStartX, this.sliderEndX);
      this.sliderThumb.x = x;

      // Calculate and update threshold value (0.1 to 1.0)
      const percent =
        (x - this.sliderStartX) / (this.sliderEndX - this.sliderStartX);
      this.threshold = 0.1 + percent * 0.9;
      this.thresholdText.setText(`Threshold: ${this.threshold.toFixed(2)}`);
    });

    // Set initial position (0.5)
    const initialX =
      this.sliderStartX +
      ((0.5 - 0.1) / 0.9) * (this.sliderEndX - this.sliderStartX);
    this.sliderThumb.x = initialX;
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

  // Remove initSlider() method since we're not using DOM elements anymore

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
  width: window.innerWidth,
  height: window.innerHeight,
  scene: gameScene,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
