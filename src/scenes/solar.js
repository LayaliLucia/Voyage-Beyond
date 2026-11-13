/* Solar Array mini-game: track the Sun and wipe off dust. */
VB.SolarScene = class extends Phaser.Scene {
    constructor() { super('Solar'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        const mars = VB.S.chapter === 'mars';
        this.running = false; this.t = 0; this.dur = 36; this.acc = 0; this.angle = 0;
        if (!mars) this.add.tileSprite(450, 146, 900, 292, 'space');
        this.add.image(0, 0, mars ? 'bg_mars' : 'bg_moon').setOrigin(0).setScale(4);
        this.add.rectangle(450, 396, 900, 208, mars ? 0x7a3524 : 0x5a5a67);
        VB.gfx.tex(this, 'sunTex', 24, 24, (c) => { VB.gfx.disc(c, 12, 12, 11, 'rgba(255,230,120,0.35)'); VB.gfx.disc(c, 12, 12, 8, '#ffe14a'); VB.gfx.disc(c, 10, 10, 3, '#fff8c0'); });
        this.sun = this.add.image(450, 120, 'sunTex').setScale(4);
        this.rays = this.add.graphics();
        this.hudT = VB.mini.hud(this, 'SOLAR ARRAY');

        this.panels = [];
        for (let i = 0; i < 5; i++) {
            const x = 130 + i * 160, y = 400;
            this.add.rectangle(x, y + 36, 8, 56, 0x8f94a8);
            const c = this.add.container(x, y);
            const body = this.add.rectangle(0, 0, 110, 16, 0x2f5fd0).setStrokeStyle(3, 0xcfd4e4);
            const cells = this.add.graphics(); for (let k = -44; k <= 44; k += 22) cells.fillStyle(0x6d95ff, 1).fillRect(k - 1, -6, 2, 12);
            const dust = this.add.graphics();
            c.add([body, cells, dust]);
            const zone = this.add.zone(x, y, 130, 90).setInteractive({ useHandCursor: true });
            const pn = { c, dust, x, y, d: 0 };
            zone.on('pointerdown', () => this.wipe(pn));
            this.panels.push(pn);
        }
        this.meter = VB.ui.bar(this, 20, 462, 400, 18, VB.COL.energy);
        VB.ui.text(this, 20, 442, 'POWER OUTPUT', 12, '#ffd23f');
        this.alignTxt = VB.ui.text(this, 450, 330, '', 18, '#ffffff', { ox: 0.5, stroke: '#000', st: 5 });
        VB.ui.text(this, 890, 424, 'MOVE the mouse/finger or use < > to tilt panels.\nCLICK a dusty panel to wipe it clean.', 12, '#ffffff', { ox: 1, align: 'right', stroke: '#000', st: 3 });
        this.keys = this.input.keyboard.createCursorKeys();
        this.input.on('pointermove', p => { if (this.running) this.angle = VB.clamp((p.x - 450) / 450 * 65, -65, 65); });

        VB.mini.intro(this, {
            title: 'SOLAR ARRAY', who: 'eng',
            sub: 'Power runs the oxygen machines, heaters and lights.',
            how: 'The Sun crosses the sky. TILT the panels (move your mouse or finger left and right) to face it. Dust sticks to the panels, so CLICK a dusty panel to wipe it clean. You have 36 seconds.',
            data: 'NASA Mars Trek + mission records',
            science: mars ? 'On Mars, dust coats solar panels. NASA\'s Spirit and Opportunity rovers sometimes got a free cleaning when wind gusts ("dust devils") swept their panels. Mars also gets only about 43% of the sunlight Earth gets.'
                          : 'Near the Moon\'s south pole some peaks get sunlight almost all the time, so they are great places for solar panels. But Moon dust is sharp and sticky, and it clings to everything!',
            start: () => { this.running = true; }
        });
    }
    wipe(p) {
        if (!this.running || p.d < 0.05) return;
        p.d = Math.max(0, p.d - 0.6); VB.audio.coin();
        for (let i = 0; i < 6; i++) { const sp = this.add.image(p.x + Phaser.Math.Between(-50, 50), p.y - 8, 'spark').setScale(2).setTint(0xffe9a0); this.tweens.add({ targets: sp, y: sp.y - 30, alpha: 0, duration: 400, onComplete: () => sp.destroy() }); }
    }
    update(_, dt) {
        if (!this.running) return;
        const s = dt / 1000; this.t += s;
        this.hudT.setText(Math.max(0, Math.ceil(this.dur - this.t)) + 's');
        if (this.keys.left.isDown) this.angle = Math.max(-65, this.angle - 70 * s);
        if (this.keys.right.isDown) this.angle = Math.min(65, this.angle + 70 * s);
        // Sun arcs across the sky (with a small wobble so it is not too predictable)
        const th = -58 + 116 * (this.t / this.dur) + Math.sin(this.t * 1.7) * 4;
        this.sun.x = 450 + Math.sin(th * Math.PI / 180) * 380; this.sun.y = 190 - Math.cos(th * Math.PI / 180) * 80;
        const diff = Math.abs(th - this.angle), align = Math.max(0, 1 - diff / 22);
        const dustRate = VB.S.chapter === 'mars' ? 0.075 : 0.055;
        let eff = 0;
        this.rays.clear().lineStyle(2, 0xffe14a, 0.25 + 0.4 * align);
        this.panels.forEach(p => {
            p.d = Math.min(1, p.d + dustRate * s * (0.6 + Math.random() * 0.8));
            p.c.setAngle(this.angle);
            p.dust.clear().fillStyle(0x6b5238, 0.8 * p.d);
            for (let k = 0; k < 14; k++) p.dust.fillRect(-50 + ((k * 37) % 100), -6 + ((k * 11) % 10), 6, 3);
            eff += align * (1 - 0.75 * p.d);
            this.rays.lineBetween(this.sun.x, this.sun.y + 30, p.x, p.y - 10);
        });
        this.acc += eff * s; this.meter.set(eff / 5, align > 0.7 ? VB.COL.good : VB.COL.energy);
        this.alignTxt.setText(align > 0.85 ? 'PERFECT ALIGNMENT!' : align > 0.5 ? 'close... keep tilting' : 'TILT TOWARD THE SUN!').setColor(align > 0.85 ? '#6fe06f' : align > 0.5 ? '#ffd23f' : '#ff7a7a');
        if (this.t >= this.dur) {
            this.running = false;
            const score = this.acc / (this.dur * 5 * 0.72);
            VB.mini.end(this, { type: 'solar', score, summary: 'Your array collected ' + Math.round(VB.clamp(score, 0, 1) * 100) + '% of the possible power.',
                factTitle: 'DID YOU KNOW?', fact: VB.S.chapter === 'mars' ? 'NASA\'s Opportunity rover was designed to last 90 days but kept working for almost 15 years, thanks partly to lucky wind cleanings of its solar panels.' : 'The Moon turns once every 27 days, so most places have about 14 days of sunlight, then 14 days of darkness. Peaks near the south pole can stay lit much longer.' });
        }
    }
};
