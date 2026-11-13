VB.IntroScene = class extends Phaser.Scene {
    constructor() { super('Intro'); }
    create() {
        this.launching = false; VB.audio.setMood('menu');
        this.cameras.main.fadeIn(300, 0, 0, 0);
        VB.ui.space(this, true);
        this.introTxt = [VB.ui.text(this, 450, 100, 'YEAR 2041', 40, '#ffd23f', { ox: 0.5, stroke: '#000', st: 6 }),
        VB.ui.text(this, 450, 150, 'Humans are returning to the Moon.\nThe plan: learn to live there, then go on to Mars.', 18, '#ffffff', { ox: 0.5, align: 'center' })];
        this.time.delayedCall(500, () => VB.ui.dialog(this, [
            { who: 'orbi', t: 'Beep boop! I am ORBI, the outpost AI. Welcome to the Voyage Beyond program!' },
            { who: 'cmd', t: "I'm Commander Aria Vance. Out here, every choice matters. We must balance air, power, food and protection from radiation." },
            { who: 'eng', t: "Jax here. I'm the engineer. I keep the lights on, the rovers rolling... and the oxygen flowing." },
            { who: 'sci', t: "And I'm Dr. Sage Okoro. I grow our food and study space radiation. We use real NASA data every day." },
            { who: 'orbi', t: 'There is room for one more crew member. Who will YOU be?' }
        ], () => this.pick()));
    }
    pick() {
        this.introTxt.forEach(t => t.destroy());
        VB.ui.text(this, 450, 30, 'CHOOSE YOUR ROLE', 30, '#ffd23f', { ox: 0.5, stroke: '#000', st: 6 });
        this.sel = 'cmd';
        this.cards = {};
        ['cmd', 'eng', 'sci'].forEach((k, i) => {
            const c = VB.CREW[k], x = 160 + i * 290;
            const g = this.add.graphics();
            const img = this.add.image(x, 190, c.base).setScale(3);
            const nm = VB.ui.text(this, x, 275, c.name, 15, c.color, { ox: 0.5 });
            const rl = VB.ui.text(this, x, 296, c.role, 17, '#ffffff', { ox: 0.5 });
            const pk = VB.ui.text(this, x, 322, 'PERK: ' + c.perk, 13, '#6fe06f', { ox: 0.5, w: 250, align: 'center' });
            const hit = this.add.zone(x, 200, 260, 270).setInteractive({ useHandCursor: true });
            hit.on('pointerdown', () => { VB.audio.click(); this.select(k); });
            this.cards[k] = { g, x };
        });
        this.select('cmd');
        VB.ui.text(this, 450, 372, 'YOUR CALLSIGN (optional):', 14, '#a9a7d8', { ox: 0.5 });
        this.input_ = this.add.dom(450, 405, 'input', 'width:220px;height:30px;font:18px BlockBlueprint,monospace;text-align:center;background:#0d0c22;color:#fff;border:3px solid #7773ff;outline:none;', '');
        this.input_.node.maxLength = 10; this.input_.node.placeholder = 'Cadet';
        this.input_.node.addEventListener('keydown', e => e.stopPropagation());
        VB.ui.button(this, 450, 462, 300, 44, 'LAUNCH MISSION', () => {
            if (this.launching) return; this.launching = true;
            VB.audio.init();
            VB.newGame(this.sel, this.input_.node.value.trim() || 'Cadet');
            VB.rollAlert();
            this.input_.destroy();
            VB.go(this, 'Outpost', { intro: true });
        }, { size: 20, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8 });
    }
    select(k) {
        this.sel = k;
        Object.keys(this.cards).forEach(id => {
            const { g, x } = this.cards[id]; g.clear();
            if (id === k) VB.ui.box(g, x - 130, 100, 260, 250, 0x1c1b3d, 0xffd23f);
            else VB.ui.box(g, x - 130, 100, 260, 250, 0x0f0e24, 0x3a37a8);
        });
    }
};
