class gameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'gameScene' });
        this.micVolume = 0; // Initialize micVolume
    }

    preload() {
        
    }

    create() {
        this.micVolumeText = this.add.text(10, 10, 'Mic Volume: 0', { font: '16px Arial', fill: '#ffffff' });

        this.initMicrophone();
    }

    update() {
        this.micVolumeText.setText('Mic Volume: ' + this.micVolume.toFixed(2));
    }

    initMicrophone() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => this.startMicrophone(stream))
            .catch(err => console.error('getUserMedia error:', err));
    }

    startMicrophone(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);

        this.microphoneStream = this.audioContext.createMediaStreamSource(stream);
        this.microphoneStream.connect(this.gainNode);

        this.processor = this.audioContext.createScriptProcessor(1024, 1, 1);
        this.processor.onaudioprocess = event => this.processMicrophoneBuffer(event);
        this.microphoneStream.connect(this.processor);
    }

    processMicrophoneBuffer(event) {
        const microphoneOutputBuffer = event.inputBuffer.getChannelData(0);

        let sum = 0.0;
        for (let i = 0; i < microphoneOutputBuffer.length; ++i) {
            sum += microphoneOutputBuffer[i] * microphoneOutputBuffer[i];
        }
        this.micVolume = Math.sqrt(sum / microphoneOutputBuffer.length);
        console.log("Mic Volume: ", this.micVolume);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: gameScene
};

const game = new Phaser.Game(config);