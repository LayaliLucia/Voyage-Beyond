VB.BootScene = class extends Phaser.Scene {
    constructor() { super('Boot'); }
    preload() {
        const bar = this.add.graphics();
        const txt = VB.ui.text(this, 450, 220, 'LOADING...', 24, '#ffffff', { ox: 0.5 });
        this.load.on('progress', v => { bar.clear().fillStyle(0x3a37a8, 1).fillRect(250, 260, 400, 16).fillStyle(0x6fe06f, 1).fillRect(252, 262, 396 * v, 12); });
        this.load.image('space', 'assets/spacebg.png');
        for (let i = 1; i <= 4; i++) { this.load.image('p' + i, 'assets/portraits/p' + i + '.png'); this.load.image('b' + i, 'assets/portraits/b' + i + '.png'); }
    }
    create() {
        VB.makeTextures(this);
        VB.nasa.start();
        // Make sure the pixel font is ready before any text is drawn.
        const go = () => this.scene.start('Title');
        if (document.fonts && document.fonts.load) {
            Promise.race([document.fonts.load('20px BlockBlueprint'), new Promise(r => setTimeout(r, 1500))]).then(go, go);
        } else go();
    }
};
