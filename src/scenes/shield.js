/* Shield Lab - design a radiation shield, then test it with a beam, like NASA's ground radiation experiments
 * (NSRL beams that OSDR RadLab data describe). Hydrogen-rich materials work best per unit mass. */
VB.MATERIALS = {
    reg: { name: 'REGOLITH', cost: 1, color: 0xb59a7a, stop: { p: 0.45, i: 0.12, n: 0.25 }, note: 'Cheap local moon/Mars soil in bags. Decent all-rounder.' },
    alu: { name: 'ALUMINUM', cost: 2, color: 0xaab0c4, stop: { p: 0.50, i: 0.08, n: 0.15 }, note: 'Spacecraft metal. Weak vs cosmic rays and can create extra particles (secondaries)!' },
    wat: { name: 'WATER', cost: 2, color: 0x58a8ff, stop: { p: 0.60, i: 0.25, n: 0.45 }, note: 'Hydrogen-rich! Great shield, and the crew can drink it too.' },
    pol: { name: 'POLYETHYLENE', cost: 3, color: 0xf0f0ff, stop: { p: 0.70, i: 0.33, n: 0.55 }, note: 'Hydrogen-rich plastic. The best shield per kilogram, but costs the most.' }
};
VB.SHIELD_LANES = [
    { k: 'p', name: 'SOLAR PROTONS', sub: 'from solar storms', color: 0xffd23f, n: 30, w: 1 },
    { k: 'i', name: 'COSMIC RAYS', sub: 'fast iron ions', color: 0xff5a5a, n: 18, w: 3 },
    { k: 'n', name: 'NEUTRONS', sub: 'secondary particles', color: 0x9aff9a, n: 24, w: 2 }
];

VB.ShieldScene = class extends Phaser.Scene {
    constructor() { super('Shield'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        VB.ui.space(this, true);
        this.budget = 12; this.sel = 'reg'; this.tries = 3; this.best = -1; this.running = false;
        this.slots = [[], [], []]; this.layers = [[], [], []]; this.parts = [];
        VB.mini.hud(this, 'SHIELD LAB - RADLAB TEST BEAM');
        this.budgetTxt = VB.ui.text(this, 888, 8, '', 18, '#ffd23f', { ox: 1, stroke: '#000', st: 4 });
        this.lx = [160, 450, 740];
        VB.SHIELD_LANES.forEach((ln, i) => {
            const x = this.lx[i];
            VB.ui.text(this, x, 34, ln.name, 14, '#' + ln.color.toString(16).padStart(6, '0'), { ox: 0.5 });
            VB.ui.text(this, x, 50, ln.sub, 11, '#a9a7d8', { ox: 0.5 });
            this.add.rectangle(x, 74, 120, 10, ln.color).setStrokeStyle(2, 0xffffff);
            for (let s = 0; s < 4; s++) {
                const y = 108 + s * 40;
                const r = this.add.rectangle(x, y, 170, 34, 0x15142b).setStrokeStyle(2, 0x5a56c8).setInteractive({ useHandCursor: true });
                r.on('pointerdown', () => this.place(i, s));
                this.slots[i].push(r); this.layers[i].push(null);
            }
            // dose bar for lane
            VB.ui.text(this, x - 100, 292, 'DOSE', 11, '#ff9a3c');
            this.add.rectangle(x + 10, 299, 160, 12, 0x000000, 0.6).setStrokeStyle(1, 0xffffff, 0.3);
            this['db' + i] = this.add.rectangle(x - 70, 299, 0, 8, 0xff9a3c).setOrigin(0, 0.5);
        });
        const mod = this.add.graphics(); VB.ui.box(mod, 60, 262, 780, 24, 0x2a2a45, 0x8f94a8);
        VB.ui.text(this, 450, 266, 'CREW HABITAT', 13, '#cfd4e4', { ox: 0.5 });
        this.res = VB.ui.text(this, 450, 322, 'Place layers in the slots, then press RUN TEST.', 15, '#ffffff', { ox: 0.5, stroke: '#000', st: 4 });

        // material palette
        this.matBtns = {};
        Object.keys(VB.MATERIALS).forEach((k, i) => {
            const m = VB.MATERIALS[k], x = 120 + i * 220;
            const b = VB.ui.button(this, x, 372, 206, 44, m.name + '  (' + m.cost + ')', () => { this.sel = k; this.paintPalette(); }, { size: 14, fill: 0x2a2850 });
            b.sw = this.add.rectangle(x - 90, 372, 14, 26, m.color).setStrokeStyle(2, 0xffffff).setDepth(5);
            this.matBtns[k] = b;
        });
        this.info = VB.ui.text(this, 450, 404, '', 14, '#dcdcff', { ox: 0.5, w: 840, align: 'center' });
        this.paintPalette();
        this.runBtn = VB.ui.button(this, 250, 462, 300, 44, 'RUN TEST BEAM', () => this.run(), { size: 17, fill: 0x8a2d2d, hi: 0xc04545 });
        this.lockBtn = VB.ui.button(this, 600, 462, 300, 44, 'LOCK DESIGN', () => this.lock(), { size: 17, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8 });
        this.lockBtn.setEnabled(false);
        this.triesTxt = VB.ui.text(this, 450, 492, '', 12, '#a9a7d8', { ox: 0.5 });
        this.updateBudget();

        VB.mini.intro(this, {
            title: 'SHIELD LAB', who: 'sci',
            sub: 'Design a radiation shield on a weight budget, then test it.',
            how: 'Pick a MATERIAL, then click slots to stack up to 4 layers per beam. You have 12 mass points. Press RUN TEST BEAM to fire particles and measure the dose. You get 3 tests, then LOCK your best design.',
            data: 'NASA OSDR RadLab + NSRL beam experiments',
            science: 'At NASA\'s Space Radiation Laboratory, scientists fire iron ions and protons at cells, plants and shielding to copy space radiation. OSDR RadLab shares this data. Real finding: hydrogen-rich materials (water, plastic) stop more than metal.',
            start: () => { }
        });
    }
    paintPalette() {
        Object.keys(this.matBtns).forEach(k => {
            const b = this.matBtns[k]; b.label.setColor(k === this.sel ? '#ffd23f' : '#ffffff');
            b.setScale(k === this.sel ? 1.06 : 1);
        });
        const m = VB.MATERIALS[this.sel];
        this.info.setText(m.name + ': ' + m.note + '   Stops P ' + Math.round(m.stop.p * 100) + '% | ION ' + Math.round(m.stop.i * 100) + '% | N ' + Math.round(m.stop.n * 100) + '%');
    }
    used() { let u = 0; this.layers.forEach(l => l.forEach(k => { if (k) u += VB.MATERIALS[k].cost; })); return u; }
    updateBudget() { const left = this.budget - this.used(); this.budgetTxt.setText('MASS LEFT: ' + left + '/' + this.budget).setColor(left === 0 ? '#ff7a7a' : '#ffd23f'); this.triesTxt.setText('Tests left: ' + this.tries + (this.best >= 0 ? '   |   Best protection: ' + Math.round(this.best * 100) + '%' : '')); }
    place(lane, s) {
        if (this.running) return;
        const cur = this.layers[lane][s], m = VB.MATERIALS[this.sel];
        if (cur === this.sel) this.layers[lane][s] = null;
        else {
            const free = this.budget - this.used() + (cur ? VB.MATERIALS[cur].cost : 0);
            if (m.cost > free) { VB.audio.bad(); VB.ui.toast(this, 'Not enough mass! Remove a layer first.', '#ff7a7a', 250); return; }
            this.layers[lane][s] = this.sel; VB.audio.coin();
        }
        const k = this.layers[lane][s];
        this.slots[lane][s].setFillStyle(k ? VB.MATERIALS[k].color : 0x15142b);
        this.updateBudget();
    }
    run() {
        if (this.running || this.tries <= 0) return;
        this.tries--; this.running = true; this.runBtn.setEnabled(false); this.lockBtn.setEnabled(false);
        this.dose = [0, 0, 0]; this.unsh = VB.SHIELD_LANES.map(l => l.n * l.w); this.pending = 0;
        this.res.setText('Beam on!'); this.updateBudget();
        for (let i = 0; i < 3; i++) this['db' + i].width = 0;
        VB.SHIELD_LANES.forEach((ln, i) => {
            for (let k = 0; k < ln.n; k++) {
                this.pending++;
                this.time.delayedCall(200 + k * (6000 / ln.n) + Math.random() * 120, () => this.fire(i, ln.k, ln.w));
            }
        });
    }
    fire(lane, kind, w) {
        const ln = VB.SHIELD_LANES[lane];
        const p = this.add.rectangle(this.lx[lane] + Phaser.Math.Between(-60, 60), 80, kind === 'i' ? 7 : 5, kind === 'i' ? 7 : 5, ln.color).setDepth(6);
        p.kind = kind; p.lane = lane; p.w = w; p.nextSlot = 0;
        this.parts.push(p);
    }
    update(_, dt) {
        const s = dt / 1000;
        for (let i = this.parts.length - 1; i >= 0; i--) {
            const p = this.parts[i]; p.y += 175 * s;
            const sy = 108 + p.nextSlot * 40;
            if (p.nextSlot < 4 && p.y >= sy - 17) {
                const mk = this.layers[p.lane][p.nextSlot]; p.nextSlot++;
                if (mk) {
                    const m = VB.MATERIALS[mk];
                    if (Math.random() < m.stop[p.kind]) { this.pop(p, 0xffffff); this.finish(i, p, false); continue; }
                    // metal can make secondary neutrons when a fast ion goes through it
                    if (mk === 'alu' && p.kind === 'i' && Math.random() < 0.3) {
                        const c = this.add.rectangle(p.x, p.y, 5, 5, 0x9aff9a).setDepth(6); c.kind = 'n'; c.lane = p.lane; c.w = 2; c.nextSlot = p.nextSlot; c.child = true;
                        this.parts.push(c); this.pending++; this.pop(p, 0x9aff9a);
                    }
                }
            }
            if (p.y >= 262) {
                this.dose[p.lane] += p.w; this.flashHab(); this.finish(i, p, true);
            }
        }
    }
    flashHab() { this.cameras.main.shake(40, 0.002); }
    pop(p, col) { for (let k = 0; k < 4; k++) { const sp = this.add.image(p.x, p.y, 'spark').setTint(col).setDepth(7); this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-18, 18), y: sp.y + Phaser.Math.Between(-12, 12), alpha: 0, duration: 260, onComplete: () => sp.destroy() }); } }
    finish(idx, p, hit) {
        p.destroy(); this.parts.splice(idx, 1); this.pending--;
        for (let i = 0; i < 3; i++) this['db' + i].width = VB.clamp(this.dose[i] / this.unsh[i], 0, 1.3) * 160;
        if (this.running && this.pending <= 0) this.done();
    }
    done() {
        this.running = false;
        const tot = this.dose.reduce((a, b) => a + b, 0), un = this.unsh.reduce((a, b) => a + b, 0);
        const prot = VB.clamp(1 - tot / un, 0, 1);
        this.best = Math.max(this.best, prot);
        this.res.setText('Dose blocked: ' + Math.round(prot * 100) + '%   (without a shield: 0%)');
        this.res.setColor(prot > 0.5 ? '#6fe06f' : '#ffd23f');
        VB.audio[prot > 0.45 ? 'good' : 'bad']();
        this.runBtn.setEnabled(this.tries > 0); this.lockBtn.setEnabled(true); this.updateBudget();
        if (this.tries <= 0) this.res.setText(this.res.text + '   No tests left - LOCK your design!');
    }
    lock() {
        if (this.running || this.best < 0) return;
        const score = this.best / 0.62;
        const tip = this.best > 0.55 ? 'Excellent! You put the best materials where the most dangerous particles come from.' : 'Tip: cosmic-ray iron ions are the hardest to stop. Put hydrogen-rich water or polyethylene in that lane!';
        VB.mini.end(this, { type: 'shield', score, summary: 'Your shield blocked ' + Math.round(this.best * 100) + '% of the radiation dose.',
            factTitle: 'REAL RADIATION NUMBERS (mSv per day)',
            fact: VB.snapshot.radiation.map(r => r.label + ': ' + r.msvDay).join('\n') + '\n' + tip });
    }
};
