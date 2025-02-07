// set game configuration
let config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: gameScene
    };
    
    //create new game and send configuration
    let game = new Phaser.Game(config)