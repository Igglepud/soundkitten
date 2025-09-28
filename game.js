class gameScene extends Phaser.Scene {
  constructor() {
    super({ key: "gameScene" });
    this.micVolume = 0; // Initialize micVolume
    this.threshold = 0.8; // Initialize threshold
    this.eyeOpenAmount = 0; // Track eye state
    this.lastStateChange = 0; // Track when we last changed states
    this.currentState = "closed"; // Track current state
  }

  preload() {
    // Remove plugin loading
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Initialize tone generator
    this.toneGenerator = new ToneGenerator();

    // Create face in center of screen
    this.createFace(width / 2, height / 2);

    // Move volume text to top left
    this.micVolumeText = this.add.text(10, 10, "Mic Volume: 0", {
      font: "16px Arial",
      fill: "#ffffff",
    });

    this.createCustomSlider();
    this.initMicrophone();
  }

  createFace(x, y) {
    // Head
    this.head = this.add.circle(x, y, 100, 0xffcc99);

    // Eye sockets
    this.leftEyeSocket = this.add.ellipse(x - 30, y - 20, 40, 30, 0xffffff);
    this.rightEyeSocket = this.add.ellipse(x + 30, y - 20, 40, 30, 0xffffff);

    // Create single rectangle eyes (going back to simpler approach)
    this.leftEye = this.add.rectangle(x - 30, y - 20, 40, 2, 0x000000);
    this.rightEye = this.add.rectangle(x + 30, y - 20, 40, 2, 0x000000);

    // Set the origin for rotation
    this.leftEye.setOrigin(0.5, 0.5);
    this.rightEye.setOrigin(0.5, 0.5);

    // Sleeping Z's
    this.sleepingZ = this.add.text(x + 70, y - 60, "z z z", {
      font: "24px Arial",
      fill: "#666666",
    });

    // Create mouth
    this.mouth = this.add.curve(
      x - 20,
      y + 30,
      new Phaser.Curves.CubicBezier(
        new Phaser.Math.Vector2(-20, 0),
        new Phaser.Math.Vector2(-10, 10),
        new Phaser.Math.Vector2(10, 10),
        new Phaser.Math.Vector2(20, 0)
      ),
      0x000000
    );
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
    this.updateFace();

    // Remove the alert to prevent interruption
    if (this.micVolume > this.threshold) {
      console.log("Mic is loud!");
    }
  }

  updateFace() {
    const halfThreshold = this.threshold / 2;
    let targetEyeOpen = 0;

    // Directly use volume to determine eye state without state management
    // This allows for more fluid transitions
    if (this.micVolume > this.threshold) {
      targetEyeOpen = 1;
    } else if (this.micVolume > halfThreshold) {
      // Map the value between halfThreshold and threshold to 0.5-1.0
      const range = this.threshold - halfThreshold;
      const position = this.micVolume - halfThreshold;
      targetEyeOpen = 0.5 + (position / range) * 0.5;
      this.sleepingZ.setText('Shut up!!!');
      this.toneGenerator.playTone(14000, 1000, 1, 'sine');
    } else {
      // Map the value between 0 and halfThreshold to 0-0.5
      targetEyeOpen = (this.micVolume / halfThreshold) * 0.5;
      this.sleepingZ.setText('z z z');
     //this.sleepingZ.setVisible(targetEyeOpen < 0.1);
    }

    // Smooth animation
    this.eyeOpenAmount = Phaser.Math.Linear(
      this.eyeOpenAmount,
      targetEyeOpen,
      0.03
    );

    // Update eye height
    const maxHeight = 20;
    const height = Math.max(2, this.eyeOpenAmount * maxHeight);

    this.leftEye.setSize(40, height);
    this.rightEye.setSize(40, height);
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
    if (this.toneGenerator) {
      this.toneGenerator.destroy();
      this.toneGenerator = null;
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: gameScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
};

const game = new Phaser.Game(config);
