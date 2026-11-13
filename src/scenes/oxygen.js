/* Oxygen refinery mini-game: catch oxygen, avoid dust. (ISRU - making oxygen from local resources.) */
VB.OxygenScene = class extends Phaser.Scene {
    constructor() { super('Oxygen'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        const mars = this.mars = VB.S.chapter === 'mars';
        this.running = false; this.t = 0; this.dur = 32; this.pts = 0; this.goal = 24; this.items = []; this.spawnT = 0;
        VB.ui.space(this, true);
        const g = this.add.graphics();
        // pipes + machinery
        g.fillStyle(0x1b1b2f, 1).fillRect(0, 0, 900, 40); g.fillStyle(0x2a2a45, 1).fillRect(0, 468, 900, 32);
        for (let x = 40; x < 900; x += 120) { g.fillStyle(0x3a3a5e, 1).fillRect(x, 40, 16, 120); g.fillStyle(0x6a6f84, 1).fillRect(x - 4, 150, 24, 14); }
        this.hudT = VB.mini.hud(this, mars ? 'MOXIE OXYGEN MAKER' : 'REGOLITH REFINERY');
        // legend
        const lg = [[mars ? 'atom_c' : 'atom_o', mars ? 'CO2 +1' : 'OXYGEN +1', '#ff9aa8'], ['ice', 'ICE +3', '#7fe3ff'], ['dust', 'DUST -2', '#c9a88a']];
        lg.forEach((l, i) => { this.add.image(250 + i * 150, 22, l[0]).setScale(1.5); VB.ui.text(this, 268 + i * 150, 14, l[1], 13, l[2]); });
        this.tank = this.add.image(450, 440, 'tank').setScale(2).setDepth(5);
        this.tgt = 450;
        this.input.on('pointermove', p => { if (this.running) this.tgt = VB.clamp(p.x, 40, 860); });
        this.keys = this.input.keyboard.createCursorKeys();
        this.gauge = VB.ui.bar(this, 20, 70, 20, 280, VB.COL.o2); this.gauge.set(0);
        VB.ui.text(this, 30, 358, 'O2', 14, '#58c8ff', { ox: 0.5 });
        this.fill = this.add.graphics();
        this.scoreTxt = VB.ui.text(this, 450, 56, '', 20, '#ffffff', { ox: 0.5, stroke: '#000', st: 5 });
        this.flash = this.add.rectangle(450, 250, 900, 500, 0xff0000, 0).setDepth(20);

        VB.mini.intro(this, {
            title: mars ? 'MAKE OXYGEN ON MARS' : 'REGOLITH REFINERY', who: 'eng',
            sub: 'Astronauts cannot carry all the air they need from Earth.',
            how: mars ? 'Slide the TANK left and right (mouse, finger or arrow keys) to catch falling CO2 molecules and ICE. AVOID the sharp DUST! Fill the tank to the top in 32 seconds.'
                      : 'Slide the TANK left and right (mouse, finger or arrow keys) to catch OXYGEN released from moon rock, plus rare water ICE. AVOID the sharp DUST! Fill the tank to the top in 32 seconds.',
            data: mars ? 'NASA Perseverance MOXIE experiment' : 'NASA LCROSS + lunar regolith research',
            science: mars ? 'Mars air is 95% carbon dioxide. In 2021 the MOXIE instrument on Perseverance made breathable oxygen from it, the first time oxygen was made on another planet!'
                          : 'Moon rock (regolith) is about 40-45% oxygen by weight, locked inside minerals. NASA\'s LCROSS mission also found water ice in a shadowed crater near the south pole in 2009.',
            start: () => { this.running = true; }
        });
    }
    spawn() {
        const r = Math.random(), kind = r < 0.12 ? 'ice' : r < 0.44 ? 'dust' : (this.mars ? 'atom_c' : 'atom_o');
        const it = this.add.image(Phaser.Math.Between(50, 850), 50, kind).setScale(2.4).setDepth(3);
        it.kind = kind; it.vy = Phaser.Math.Between(120, 190) + this.t * 3; it.spin = Phaser.Math.FloatBetween(-2, 2);
        this.items.push(it);
    }
    update(_, dt) {
        if (!this.running) return;
        const s = dt / 1000; this.t += s;
        this.hudT.setText(Math.max(0, Math.ceil(this.dur - this.t)) + 's');
        if (this.keys.left.isDown) this.tgt -= 520 * s; if (this.keys.right.isDown) this.tgt += 520 * s;
        this.tgt = VB.clamp(this.tgt, 40, 860);
        this.tank.x += (this.tgt - this.tank.x) * Math.min(1, s * 14);
        this.spawnT -= s; if (this.spawnT <= 0) { this.spawn(); this.spawnT = Math.max(0.28, 0.62 - this.t * 0.01); }
        for (let i = this.items.length - 1; i >= 0; i--) {
            const it = this.items[i]; it.y += it.vy * s; it.rotation += it.spin * s;
            if (it.y > 418 && it.y < 462 && Math.abs(it.x - this.tank.x) < 44) {
                if (it.kind === 'dust') { this.pts = Math.max(0, this.pts - 2); VB.audio.bad(); this.flash.setAlpha(0.35); this.tweens.add({ targets: this.flash, alpha: 0, duration: 250 }); }
                else { this.pts += it.kind === 'ice' ? 3 : 1; VB.audio.coin(); }
                for (let k = 0; k < 5; k++) { const sp = this.add.image(it.x, it.y, 'spark').setScale(2).setTint(it.kind === 'dust' ? 0xaa6644 : 0x9fe6ff); this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-30, 30), y: sp.y - Phaser.Math.Between(10, 40), alpha: 0, duration: 350, onComplete: () => sp.destroy() }); }
                it.destroy(); this.items.splice(i, 1);
            } else if (it.y > 520) { it.destroy(); this.items.splice(i, 1); }
        }
        const f = VB.clamp(this.pts / this.goal, 0, 1);
        this.fill.clear().fillStyle(0x58c8ff, 1).fillRect(22, 350 - 278 * f, 16, 278 * f);
        this.scoreTxt.setText('TANK: ' + Math.round(f * 100) + '%');
        if (this.t >= this.dur || f >= 1) {
            this.running = false; this.items.forEach(i => i.destroy());
            VB.mini.end(this, { type: 'oxygen', score: f, summary: 'You filled the oxygen tank to ' + Math.round(f * 100) + '%.',
                factTitle: this.mars ? 'MARS FACT' : 'MOON FACT',
                fact: this.mars ? 'MOXIE heated Mars air to about 800 degrees C and split carbon dioxide into oxygen and carbon monoxide. A future version could make enough oxygen for astronauts to breathe AND for rocket fuel.' : 'Making oxygen on the Moon from rock means rockets would carry less weight from Earth. This idea is called ISRU: In-Situ Resource Utilization.' });
        }
    }
};
