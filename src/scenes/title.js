VB.TitleScene = class extends Phaser.Scene {
    constructor() { super('Title'); }
    create() {
        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.bg = this.add.tileSprite(450, 250, 900, 500, 'space');
        // twinkles
        for (let i = 0; i < 40; i++) {
            const s = this.add.image(Math.random() * 900, Math.random() * 500, 'spark').setScale(Phaser.Math.Between(1, 2)).setAlpha(0.2);
            this.tweens.add({ targets: s, alpha: 1, duration: Phaser.Math.Between(600, 2200), yoyo: true, repeat: -1, delay: Math.random() * 2000 });
        }
        this.title = VB.ui.text(this, 450, 130, 'Voyage Beyond', 74, '#ffffff', { ox: 0.5, oy: 0.5, stroke: '#2a1a7a', st: 10 });
        VB.ui.text(this, 450, 190, 'A SPACE SURVIVAL ADVENTURE FOR YOUNG ASTRONAUTS', 15, '#ffd23f', { ox: 0.5 });

        // The four crew portraits float along the bottom.
        this.faces = [];
        ['cmd', 'eng', 'sci', 'orbi'].forEach((k, i) => {
            const c = VB.CREW[k], x = 190 + i * 173;
            const f = this.add.graphics(); VB.ui.box(f, x - 52, 392, 104, 104, 0x000000, 0xffffff);
            const im = this.add.image(x, 444, c.base).setScale(2);
            this.faces.push(im, f);
            this.tweens.add({ targets: im, y: 438, yoyo: true, repeat: -1, duration: 900 + i * 150, ease: 'Sine.easeInOut' });
        });

        VB.ui.button(this, 450, 262, 260, 52, 'PLAY', () => { VB.audio.init(); VB.go(this, 'Intro'); }, { size: 28, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8 });
        VB.ui.button(this, 450, 326, 260, 40, 'NASA DATA & CREDITS', () => this.showData(), { size: 15 });

        // live data ticker
        this.tick = VB.ui.text(this, 450, 374, '', 13, '#ffffff', { ox: 0.5, w: 860, align: 'center' });
        this.refresh();
        this.timer = this.time.addEvent({ delay: 700, loop: true, callback: () => this.refresh() });
        VB.audio.setMood('menu');
        this.input.once('pointerdown', () => VB.audio.init());
        VB.ui.text(this, 890, 488, 'v' + VB.VERSION + '  |  press M to mute music', 11, '#6f6bd6', { ox: 1 }).setDepth(5);
    }
    refresh() {
        const n = VB.nasa, f = n.flares[0];
        let s = n.badge();
        if (f) s += '   |   Latest flare: ' + f.cls + (f.time ? ' (' + f.time + ')' : '');
        this.tick.setText(s).setColor(n.badgeColor());
    }
    showData() {
        const n = VB.nasa;
        VB.ui.modal(this, {
            title: 'REAL NASA DATA IN THIS GAME', w: 800, h: 440, size: 14,
            body:
                'DONKI (Space Weather): live solar flares & coronal mass ejections power the Storm Watch game.  Status: ' + n.status.donki.toUpperCase() + '\n\n' +
                'OSDR (Open Science Data Repository): real plant-growth studies from the ISS inspire the Garden.  Status: ' + n.status.osdr.toUpperCase() + '\n\n' +
                'RadLab / NSRL ground experiments: heavy-ion radiation research shapes the Shield Lab and its dose numbers.\n\n' +
                'Mars Trek: real Mars map imagery and landing-site coordinates in Landing Site Selection.\n\n' +
                'ART: Warped Portraits by Luis Zuno (@ansimuz, public domain). Built with Phaser 3. Inspired by NASA and Canadian Space Agency research.',
            buttons: [{ label: 'CLOSE' }]
        });
    }
    update() { this.bg.tilePositionX += 0.5; this.title.y = 130 + Math.sin(this.time.now * 0.002) * 6; }
};
