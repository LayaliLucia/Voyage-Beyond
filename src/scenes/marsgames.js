/* Mars-only mini-games. The Mars outpost uses these instead of the Moon games:
 *   MarsOxygen  - MOXIE Reactor     (hold to heat, keep the marker in the moving green band)
 *   MarsSolar   - Rover Cleaner     (drive a rover over dusty panels, dodge dust devils)
 *   MarsGarden  - Water Loop        (rotate pipes so recycled water reaches the plants)
 *   MarsShield  - Regolith Wall     (time the crane to stack bags over the habitat)
 *   MarsStorm   - Siren Watch       (place the CME arrival on a timeline, then repeat the airlock code)
 */
VB.ui.marsBg = function (s, flat) {
    s.add.rectangle(450, 250, 900, 500, 0x7a3524);
    if (flat) {
        const g = s.add.graphics(), r = VB.gfx.rng(5);
        for (let i = 0; i < 420; i++) { g.fillStyle(r() < 0.5 ? 0x8d3f2a : 0x6a2c1d, 1).fillRect(r() * 900 | 0, r() * 500 | 0, 6 + r() * 14 | 0, 3); }
    } else { s.add.image(0, 0, 'bg_mars').setOrigin(0).setScale(4); s.add.rectangle(450, 396, 900, 208, 0x7a3524); }
};

/* ============================================================ MOXIE REACTOR */
VB.MarsOxygenScene = class extends Phaser.Scene {
    constructor() { super('MarsOxygen'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        VB.ui.marsBg(this, true);
        this.running = false; this.t = 0; this.dur = 36; this.m = 15; this.v = 0; this.c = 50; this.good = 0; this.hold = false; this.molT = 0;
        this.hudT = VB.mini.hud(this, 'MOXIE REACTOR');
        const g = this.add.graphics();
        // thermometer
        VB.ui.box(g, 100, 70, 90, 350, 0x15142b, 0x8f94a8);
        this.tube = this.add.graphics(); this.fx = this.add.graphics().setDepth(5);
        VB.ui.text(this, 145, 428, 'REACTOR TEMP', 11, '#cfd4e4', { ox: 0.5 });
        this.temp = VB.ui.text(this, 145, 446, '', 16, '#ffd23f', { ox: 0.5 });
        // reactor box
        VB.ui.box(g, 300, 120, 300, 260, 0x2a2a45, 0x8f94a8);
        this.glow = this.add.rectangle(450, 250, 260, 220, 0x3a6bff, 0.5);
        VB.ui.text(this, 450, 132, 'MOXIE', 20, '#ffffff', { ox: 0.5 });
        this.add.rectangle(250, 250, 70, 16, 0x6a6f84).setStrokeStyle(2, 0x1b1b2f); VB.ui.text(this, 250, 276, 'CO2 IN', 12, '#9fe6b0', { ox: 0.5 });
        this.add.rectangle(650, 250, 70, 16, 0x6a6f84).setStrokeStyle(2, 0x1b1b2f); VB.ui.text(this, 650, 276, 'O2 OUT', 12, '#ff9aa8', { ox: 0.5 });
        // output tank
        VB.ui.box(g, 760, 90, 60, 300, 0x15142b, 0x8f94a8); VB.ui.text(this, 790, 398, 'O2 TANK', 12, '#58c8ff', { ox: 0.5 });
        this.tank = this.add.graphics();
        this.mols = [];
        this.tip = VB.ui.text(this, 450, 62, '', 17, '#ffffff', { ox: 0.5, stroke: '#000', st: 5 });
        VB.ui.text(this, 450, 470, 'HOLD mouse / finger / SPACE to heat up. Let go to cool down.', 14, '#ffffff', { ox: 0.5, stroke: '#000', st: 4 });
        this.input.on('pointerdown', () => { this.hold = true; }); this.input.on('pointerup', () => { this.hold = false; });
        this.sp = this.input.keyboard.addKey('SPACE'); this.up = this.input.keyboard.addKey('UP');
        VB.mini.intro(this, {
            title: 'MOXIE REACTOR', who: 'eng',
            sub: 'Make oxygen from the carbon dioxide in Mars air.',
            how: 'The reactor must stay at the right temperature. The white marker is your temperature. HOLD to heat it up, let go to cool down, and keep it inside the moving GREEN BAND. Oxygen is made only while you are inside the band!',
            data: 'NASA Perseverance MOXIE (Mars Oxygen In-Situ Resource Utilization Experiment)',
            science: 'MOXIE heats Mars air to about 800 degrees C and splits carbon dioxide into oxygen. It ran 16 times on Mars and made about 122 grams of oxygen in total, roughly what a small dog breathes in 10 hours. A bigger version could supply a whole crew.',
            start: () => { this.running = true; }
        });
    }
    Y(v) { return 410 - v / 100 * 330; }
    update(_, dt) {
        const s = dt / 1000, half = Math.max(7, 12 - this.t * 0.14);
        if (this.running) {
            this.t += s; this.hudT.setText(Math.max(0, Math.ceil(this.dur - this.t)) + 's');
            const heat = this.hold || this.sp.isDown || this.up.isDown;
            this.v = VB.clamp(this.v + (heat ? 230 : -190) * s, -60, 60); this.m += this.v * s;
            if (this.m < 0) { this.m = 0; this.v = 0; } if (this.m > 100) { this.m = 100; this.v = 0; }
            this.c = 50 + 27 * Math.sin(this.t * 0.75) + 11 * Math.sin(this.t * 2.1 + 1);
            const inb = Math.abs(this.m - this.c) <= half;
            if (inb) this.good += s;
            this.molT -= s;
            if (this.molT <= 0) { this.molT = 0.3; const mo = this.add.image(215, 250 + Phaser.Math.Between(-4, 4), 'atom_c').setScale(1.6); mo.out = false; this.mols.push(mo); }
            this.mols.forEach(mo => {
                if (!mo.out) { mo.x += 120 * s; if (mo.x >= 450) { mo.out = true; if (this.inb) mo.setTexture('atom_o'); else mo.setAlpha(0.25); } }
                else { mo.x += 130 * s; if (mo.alpha > 0.5) mo.y += Math.sin(mo.x * 0.05) * 0.4; }
            });
            this.mols = this.mols.filter(mo => { if (mo.x > 760) { mo.destroy(); return false; } return true; });
            this.inb = inb;
            const f = VB.clamp(this.good / (this.dur * 0.75), 0, 1);
            this.tank.clear().fillStyle(0x58c8ff, 1).fillRect(770, 386 - 290 * f, 40, 290 * f).fillStyle(0xbfeaff, 1).fillRect(774, 386 - 290 * f, 6, 290 * f);
            this.tip.setText(inb ? 'IN THE BAND - making oxygen!' : (this.m < this.c ? 'TOO COLD - heat up!' : 'TOO HOT - let it cool!')).setColor(inb ? '#6fe06f' : '#ff9a7a');
            if (this.t >= this.dur) { this.running = false; this.finish(f); }
        }
        // draw thermometer
        const g = this.tube; g.clear();
        for (let y = 80; y < 410; y += 22) { g.fillStyle(0x6a6f84, 1).fillRect(106, y, 10, 2); }
        g.fillStyle(0x2c8f4a, 0.9).fillRect(120, this.Y(this.c + half), 56, this.Y(this.c - half) - this.Y(this.c + half));
        g.lineStyle(2, 0x6fe06f, 1).strokeRect(120, this.Y(this.c + half), 56, this.Y(this.c - half) - this.Y(this.c + half));
        g.fillStyle(0xffffff, 1).fillRect(116, this.Y(this.m) - 4, 64, 8); g.fillStyle(0xffd23f, 1).fillTriangle(104, this.Y(this.m) - 8, 104, this.Y(this.m) + 8, 116, this.Y(this.m));
        this.temp.setText(Math.round(600 + this.m * 3) + ' C');
        const k = this.m / 100; this.glow.setFillStyle(Phaser.Display.Color.GetColor(58 + k * 197, 107 - k * 40, 255 - k * 215), 0.35 + k * 0.4);
    }
    finish(f) {
        VB.mini.end(this, { type: 'oxygen', score: f, summary: 'You kept the reactor in the sweet spot for ' + Math.round(this.good / this.dur * 100) + '% of the time.',
            factTitle: 'MARS FACT', fact: 'Mars air is about 95% carbon dioxide, but it is very thin: less than 1% of Earth air pressure. MOXIE had to squeeze it first. Making oxygen on Mars means a future crew would not have to carry all of it from Earth.' });
    }
};

/* ============================================================ ROVER CLEANER */
VB.MarsSolarScene = class extends Phaser.Scene {
    constructor() { super('MarsSolar'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        VB.ui.marsBg(this, true);
        this.running = false; this.t = 0; this.dur = 36; this.accEff = 0; this.slow = 0; this.lastT = null; this.tx = 450; this.ty = 400;
        this.hudT = VB.mini.hud(this, 'ROVER CLEANER');
        this.panels = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) this.panels.push({ x: 215 + c * 155, y: 140 + r * 105, w: 130, h: 70, d: Math.random() * 0.25, cool: 0, rate: 0.04 + Math.random() * 0.025, g: this.add.graphics().setDepth(3) });
        this.rv = this.add.container(450, 420).setDepth(10);
        const rg = this.add.graphics();
        [[-20, -16], [20, -16], [-20, 16], [20, 16]].forEach(w => rg.fillStyle(0x1b1b2f, 1).fillRect(w[0] - 6, w[1] - 5, 12, 10));
        rg.fillStyle(0x2a2a45, 1).fillRect(-24, -16, 48, 32); rg.fillStyle(0xe8e8f0, 1).fillRect(-22, -14, 44, 28); rg.fillStyle(0xff8a3d, 1).fillRect(-22, -4, 44, 8); rg.fillStyle(0x4ac3ff, 1).fillRect(10, -12, 10, 6);
        this.rv.add(rg);
        this.devils = [];
        for (let i = 0; i < 3; i++) { const d = { x: Phaser.Math.Between(150, 750), y: Phaser.Math.Between(100, 400), a: Math.random() * 6.28, g: this.add.graphics().setDepth(8), ph: Math.random() * 6 }; this.devils.push(d); }
        this.trail = this.add.graphics().setDepth(1);
        this.eff = VB.ui.bar(this, 20, 466, 380, 16, VB.COL.energy); VB.ui.text(this, 20, 446, 'POWER OUTPUT', 12, '#ffd23f');
        VB.ui.text(this, 890, 424, 'MOVE the mouse / finger (or arrows / WASD) to drive.\nDrive over a panel to wipe it. Dodge the DUST DEVILS!', 12, '#ffffff', { ox: 1, align: 'right', stroke: '#000', st: 3 });
        this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
        this.input.on('pointermove', p => { if (this.running) { this.tx = p.x; this.ty = p.y; this.usePtr = true; } });
        this.input.on('pointerdown', p => { if (this.running) { this.tx = p.x; this.ty = p.y; this.usePtr = true; } });
        VB.mini.intro(this, {
            title: 'ROVER CLEANER', who: 'eng',
            sub: 'Dust makes solar panels weak. The rover wipes them clean.',
            how: 'You drive the little cleaning rover. Move your mouse or finger (or use the arrow keys) and roll over the dusty panels to clean them. Swirling DUST DEVILS drop dust on panels and spin the rover. Keep the power output high for 36 seconds!',
            data: 'NASA Mars rover records: Spirit, Opportunity and InSight',
            science: 'Dust on Mars panels reduces power. Spirit and Opportunity were sometimes cleaned for free by wind gusts. In 2018 a planet-wide dust storm blocked so much sunlight that Opportunity went silent, and InSight lost power as dust built up on its panels.',
            start: () => { this.running = true; }
        });
    }
    update(_, dt) {
        const s = dt / 1000;
        if (this.running) {
            this.t += s; this.hudT.setText(Math.max(0, Math.ceil(this.dur - this.t)) + 's');
            const k = this.keys; let ax = (k.RIGHT.isDown || k.D.isDown) - (k.LEFT.isDown || k.A.isDown), ay = (k.DOWN.isDown || k.S.isDown) - (k.UP.isDown || k.W.isDown);
            if (ax || ay) { this.usePtr = false; this.tx = VB.clamp(this.rv.x + ax * 100, 40, 860); this.ty = VB.clamp(this.rv.y + ay * 100, 90, 440); }
            this.slow = Math.max(0, this.slow - s);
            const dx = this.tx - this.rv.x, dy = this.ty - this.rv.y, dist = Math.hypot(dx, dy);
            if (dist > 4) { const sp = Math.min(dist, (this.slow > 0 ? 80 : 280) * s); this.rv.x += dx / dist * sp; this.rv.y += dy / dist * sp; this.rv.rotation = this.slow > 0 ? this.rv.rotation + 12 * s : 0; if (this.slow <= 0 && Math.abs(dx) > 8) this.rv.setScale(dx < 0 ? -1 : 1, 1); }
            this.rv.y = VB.clamp(this.rv.y, 85, 450);
            if (!this.lastT || Math.hypot(this.rv.x - this.lastT.x, this.rv.y - this.lastT.y) > 12) { this.lastT = { x: this.rv.x, y: this.rv.y }; this.trail.fillStyle(0x4d1c10, 0.5).fillRect(this.rv.x - 18, this.rv.y + 14, 4, 2).fillRect(this.rv.x + 14, this.rv.y + 14, 4, 2); }
            this.devils.forEach(d => {
                d.a += (Math.random() - 0.5) * 2.2 * s; d.x += Math.cos(d.a) * 70 * s; d.y += Math.sin(d.a) * 55 * s; d.ph += s * 9;
                if (d.x < 60 || d.x > 840) d.a = Math.PI - d.a; if (d.y < 90 || d.y > 440) d.a = -d.a;
                d.x = VB.clamp(d.x, 40, 860); d.y = VB.clamp(d.y, 85, 450);
                d.g.clear(); for (let i = 0; i < 6; i++) { const w = 8 + i * 5, yy = d.y - i * 9; d.g.fillStyle(0xd9a27a, 0.65 - i * 0.07).fillRect(d.x - w / 2 + Math.sin(d.ph + i) * 4, yy, w, 5); }
                if (Math.hypot(d.x - this.rv.x, d.y - this.rv.y) < 30 && this.slow <= 0) { this.slow = 1.3; VB.audio.bad(); }
            });
            let tot = 0;
            this.panels.forEach(p => {
                p.d = Math.min(1, p.d + p.rate * s); p.cool = Math.max(0, p.cool - s);
                const near = Math.abs(this.rv.x - p.x) < p.w / 2 + 12 && Math.abs(this.rv.y - p.y) < p.h / 2 + 12;
                if (near && this.slow <= 0) p.d = Math.max(0, p.d - 1.2 * s);
                this.devils.forEach(d => { if (p.cool <= 0 && Math.abs(d.x - p.x) < p.w / 2 && Math.abs(d.y - p.y) < p.h / 2) { p.d = Math.min(1, p.d + 0.25); p.cool = 2.5; } });
                tot += 1 - 0.85 * p.d;
                const g = p.g; g.clear(); g.fillStyle(0x1b1b2f, 1).fillRect(p.x - p.w / 2 - 3, p.y - p.h / 2 - 3, p.w + 6, p.h + 6);
                g.fillStyle(0x2f5fd0, 1).fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
                for (let i = 1; i < 4; i++) g.fillStyle(0x6d95ff, 1).fillRect(p.x - p.w / 2 + i * p.w / 4 - 1, p.y - p.h / 2, 2, p.h);
                g.fillStyle(0xb98a62, 0.88 * p.d).fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
            });
            const e = tot / this.panels.length; this.accEff += e * s; this.eff.set(e, e > 0.65 ? VB.COL.good : VB.COL.energy);
            if (this.t >= this.dur) {
                this.running = false; const avg = this.accEff / this.dur, score = VB.clamp((avg - 0.28) / 0.32, 0, 1);
                VB.mini.end(this, { type: 'solar', score, summary: 'Average power output: ' + Math.round(avg * 100) + '% of a spotless array.',
                    factTitle: 'MARS FACT', fact: 'Mars gets only about 43% of the sunlight Earth does. Future bases may use solar panels AND small nuclear reactors, like NASA\'s Kilopower tests, so dust storms cannot turn the lights off.' });
            }
        }
    }
};

/* ============================================================ WATER LOOP (pipe puzzle) */
VB.MarsGardenScene = class extends Phaser.Scene {
    constructor() { super('MarsGarden'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        this.add.rectangle(450, 250, 900, 500, 0x10201c);
        this.running = false; this.t = 0; this.dur = 60; this.solved = 0; this.C = 7; this.R = 4; this.cs = 80; this.x0 = 140; this.y0 = 96; this.partial = 0;
        this.hudT = VB.mini.hud(this, 'WATER LOOP');
        VB.ui.text(this, 450, 56, 'Rotate the pipes so the recycled water reaches all 3 plants!', 14, '#a9ffd0', { ox: 0.5 });
        this.pg = this.add.graphics(); this.zones = [];
        for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
            const z = this.add.zone(this.x0 + c * this.cs + this.cs / 2, this.y0 + r * this.cs + this.cs / 2, this.cs, this.cs).setInteractive({ useHandCursor: true });
            z.on('pointerdown', () => this.rotate(c, r)); this.zones.push(z);
        }
        this.plants = [0, 1, 2].map(() => this.add.image(760, 0, 'wilt').setScale(5).setOrigin(0.5, 0.5));
        this.score = VB.ui.text(this, 20, 466, '', 16, '#ffd23f');
        VB.ui.text(this, 890, 440, 'CLICK a pipe to turn it.', 13, '#cfd4e4', { ox: 1 });
        VB.mini.intro(this, {
            title: 'WATER LOOP', who: 'sci',
            sub: 'Every drop of water counts on Mars.',
            how: 'Water flows in from the TANK on the left. Click a pipe piece to turn it a quarter turn. Connect the tank to all 3 plants on the right so they get watered. When all 3 drink, a new puzzle appears. Solve as many as you can in 60 seconds!',
            data: 'NASA ISS Environmental Control and Life Support System (ECLSS)',
            science: 'The ISS recycles about 98% of its water, including sweat and breath moisture, into clean drinking water. Mars crews will need the same trick, plus water ice dug from the ground, because shipping water from Earth is far too heavy.',
            start: () => { this.running = true; this.gen(); }
        });
    }
    gen() {
        const C = this.C, R = this.R, D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
        const mk = (c, r) => r * C + c, mask = new Array(C * R).fill(0);
        this.src = Phaser.Math.Between(0, R - 1);
        const sinkRows = Phaser.Utils.Array.Shuffle([0, 1, 2, 3]).slice(0, 3).sort(); this.sinkRows = sinkRows;
        const tree = new Set([mk(0, this.src)]);
        sinkRows.forEach(sr => {
            const goal = mk(C - 1, sr); if (tree.has(goal)) return;
            const prev = new Map(); tree.forEach(k => prev.set(k, null)); const q = [...tree]; let found = false;
            while (q.length && !found) {
                const cur = q.shift(), cc = cur % C, cr = (cur / C) | 0;
                for (const d of Phaser.Utils.Array.Shuffle(D.slice())) {
                    const nc = cc + d[0], nr = cr + d[1]; if (nc < 0 || nr < 0 || nc >= C || nr >= R) continue;
                    const k = mk(nc, nr); if (prev.has(k)) continue; prev.set(k, cur); q.push(k); if (k === goal) { found = true; break; }
                }
            }
            let cur = goal; tree.add(goal);
            while (prev.get(cur) !== null && prev.get(cur) !== undefined) {
                const p = prev.get(cur), dc = (cur % C) - (p % C), dr = ((cur / C) | 0) - ((p / C) | 0);
                const d = D.find(x => x[0] === dc && x[1] === dr); mask[p] |= d[2]; mask[cur] |= d[3]; tree.add(cur); cur = p;
            }
        });
        mask[mk(0, this.src)] |= 8; sinkRows.forEach(sr => { mask[mk(C - 1, sr)] |= 2; });
        for (let i = 0; i < mask.length; i++) if (!mask[i]) mask[i] = [5, 10, 3, 6, 12, 9][Phaser.Math.Between(0, 5)];
        this.sol = mask.slice(); let tries = 0;
        do { for (let i = 0; i < mask.length; i++) for (let k = Phaser.Math.Between(0, 3); k > 0; k--) mask[i] = ((mask[i] << 1) | (mask[i] >> 3)) & 15; this.mask = mask; tries++; } while (this.flow().sinks >= 2 && tries < 30);
        this.mask = mask; this.lock = false; this.draw();
    }
    flow() {
        const C = this.C, R = this.R, lit = new Set(), D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
        const s = this.src * C; if (this.mask[s] & 8) { lit.add(s); const q = [s]; while (q.length) { const cur = q.shift(), c = cur % C, r = (cur / C) | 0; D.forEach(d => { if (!(this.mask[cur] & d[2])) return; const nc = c + d[0], nr = r + d[1]; if (nc < 0 || nr < 0 || nc >= C || nr >= R) return; const k = nr * C + nc; if (lit.has(k) || !(this.mask[k] & d[3])) return; lit.add(k); q.push(k); }); } }
        let sinks = 0; this.sinkRows.forEach(sr => { if (lit.has(sr * C + C - 1) && (this.mask[sr * C + C - 1] & 2)) sinks++; });
        return { lit, sinks };
    }
    rotate(c, r) {
        if (!this.running || this.lock) return; const i = r * this.C + c; this.mask[i] = ((this.mask[i] << 1) | (this.mask[i] >> 3)) & 15; VB.audio.click(); this.draw();
        const f = this.flow(); if (f.sinks === 3) { this.solved++; this.lock = true; VB.audio.good(); this.cameras.main.flash(200, 80, 200, 255); this.time.delayedCall(550, () => { if (this.running) this.gen(); }); }
    }
    draw() {
        const g = this.pg, f = this.flow(); g.clear();
        g.fillStyle(0x3a8fe0, 1).fillRect(this.x0 - 60, this.y0 + this.src * this.cs + 12, 56, this.cs - 24); g.fillStyle(0xbfeaff, 1).fillRect(this.x0 - 56, this.y0 + this.src * this.cs + 16, 14, this.cs - 32);
        for (let r = 0; r < this.R; r++) for (let c = 0; c < this.C; c++) {
            const i = r * this.C + c, m = this.mask[i], cx = this.x0 + c * this.cs + this.cs / 2, cy = this.y0 + r * this.cs + this.cs / 2, on = f.lit.has(i);
            g.fillStyle(0x1c2e2a, 1).fillRect(cx - 38, cy - 38, 76, 76); g.lineStyle(1, 0x2c463f, 1).strokeRect(cx - 38, cy - 38, 76, 76);
            const col = on ? 0x58c8ff : 0x6a6f84, core = on ? 0xbfeaff : 0x8f94a8;
            const arm = (x, y, w, h) => { g.fillStyle(col, 1).fillRect(x, y, w, h); };
            arm(cx - 7, cy - 7, 14, 14);
            if (m & 1) arm(cx - 7, cy - 38, 14, 31); if (m & 2) arm(cx + 7, cy - 7, 31, 14); if (m & 4) arm(cx - 7, cy + 7, 14, 31); if (m & 8) arm(cx - 38, cy - 7, 31, 14);
            g.fillStyle(core, 1).fillRect(cx - 3, cy - 3, 6, 6);
        }
        this.sinkRows.forEach((sr, k) => {
            const cy = this.y0 + sr * this.cs + this.cs / 2, got = f.lit.has(sr * this.C + this.C - 1);
            g.fillStyle(got ? 0x58c8ff : 0x6a6f84, 1).fillRect(this.x0 + this.C * this.cs - 2, cy - 7, 36, 14);
            this.plants[k].setPosition(this.x0 + this.C * this.cs + 80, cy).setTexture(got ? 'plant4' : 'wilt').setVisible(true);
        });
        this.partial = f.sinks;
        this.score.setText('PUZZLES SOLVED: ' + this.solved + '    PLANTS WATERED: ' + f.sinks + '/3');
    }
    update(_, dt) {
        if (!this.running) return;
        this.t += dt / 1000; this.hudT.setText(Math.max(0, Math.ceil(this.dur - this.t)) + 's');
        if (this.t >= this.dur) {
            this.running = false; const score = VB.clamp((this.solved + this.partial / 3 * 0.5) / 2, 0, 1);
            VB.mini.end(this, { type: 'garden', score, summary: 'You solved ' + this.solved + ' water-loop puzzle' + (this.solved === 1 ? '' : 's') + '.',
                factTitle: 'SPACE FACT', fact: 'Mars soil contains perchlorates, salts that are toxic to people and plants. Mars farmers will wash the soil, or grow plants in water with nutrients (hydroponics) and recycle every drop, just like this puzzle.' });
        }
    }
};

/* ============================================================ REGOLITH WALL (stacking) */
VB.MarsShieldScene = class extends Phaser.Scene {
    constructor() { super('MarsShield'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        VB.ui.marsBg(this, false);
        this.running = false; this.base = 260; this.layers = []; this.cur = null; this.dropping = false; this.n = 0; this.max = 9; this.sumW = 0; this.perfect = 0; this.dir = 1; this.cx = 150;
        this.hudT = VB.mini.hud(this, 'REGOLITH WALL');
        this.add.image(450, 432, 'dome').setOrigin(0.5, 1).setScale(8).setDepth(1).setAlpha(0.9);
        this.ground = this.add.rectangle(450, 460, 900, 70, 0x6a2c1d).setDepth(2);
        this.add.rectangle(450, 432, this.base, 24, 0xc08a5a).setStrokeStyle(2, 0x5a3a22).setDepth(3);
        this.layers.push({ x: 450, w: this.base });
        this.crane = this.add.graphics().setDepth(6);
        this.info = VB.ui.text(this, 450, 60, '', 18, '#ffffff', { ox: 0.5, stroke: '#000', st: 5 });
        VB.ui.text(this, 450, 478, 'CLICK / TAP / SPACE to drop the bag. Line it up with the wall below!', 14, '#ffffff', { ox: 0.5, stroke: '#000', st: 4, d: 20 });
        this.input.on('pointerdown', () => this.drop()); this.input.keyboard.addKey('SPACE').on('down', () => this.drop());
        VB.mini.intro(this, {
            title: 'REGOLITH WALL', who: 'sci',
            sub: 'Dirt makes a great radiation shield.',
            how: 'A crane swings a bag of Mars soil (regolith) side to side. CLICK or press SPACE to drop it on the wall. Any part that hangs over falls off, so line the bags up well! A thick wall over the habitat blocks more radiation. Stack up to 9 layers.',
            data: 'NASA Curiosity RAD radiation measurements on Mars',
            science: 'Curiosity\'s RAD instrument measured about 0.67 mSv of radiation every day on the surface of Mars. Piling soil on top of a habitat soaks up cosmic rays. Some designs use 3D-printed regolith walls or hide inside lava tubes.',
            start: () => { this.running = true; this.spawn(); }
        });
    }
    spawn() {
        const last = this.layers[this.layers.length - 1]; this.cw = last.w; this.cx = 100; this.dir = 1;
        this.cur = this.add.rectangle(this.cx, 120, this.cw, 24, 0xd29a68).setStrokeStyle(2, 0x5a3a22).setDepth(5); this.dropping = false;
        this.info.setText('LAYER ' + (this.n + 1) + ' / ' + this.max + '    WALL: ' + this.n + ' layers');
    }
    drop() {
        if (!this.running || this.dropping || !this.cur) return; this.dropping = true; VB.audio.click();
        const last = this.layers[this.layers.length - 1], y = 432 - (this.n + 1) * 24 + 0;
        let l = Math.max(this.cx - this.cw / 2, last.x - last.w / 2), r = Math.min(this.cx + this.cw / 2, last.x + last.w / 2);
        const cur = this.cur; this.tweens.add({ targets: cur, y, duration: 260, ease: 'Quad.easeIn', onComplete: () => {
            if (r - l <= 6) { cur.setFillStyle(0x8a4430); this.tweens.add({ targets: cur, y: 520, alpha: 0, duration: 600 }); VB.audio.bad(); this.cur = null; return this.end(); }
            let nx = (l + r) / 2, nw = r - l;
            if (Math.abs(this.cx - last.x) < 5) { nx = last.x; nw = last.w; this.perfect++; VB.audio.good(); this.cameras.main.flash(120, 255, 255, 200); } else VB.audio.coin();
            // sliced-off piece falls away
            const cutW = this.cw - nw; if (cutW > 3) { const left = this.cx - this.cw / 2 < l; const px = left ? this.cx - this.cw / 2 + cutW / 2 : this.cx + this.cw / 2 - cutW / 2; const piece = this.add.rectangle(px, y, cutW, 24, 0xd29a68).setStrokeStyle(2, 0x5a3a22).setDepth(4); this.tweens.add({ targets: piece, y: 540, alpha: 0, angle: left ? -40 : 40, duration: 700, onComplete: () => piece.destroy() }); }
            cur.setPosition(nx, y).setSize(nw, 24).setDisplaySize(nw, 24).setFillStyle(0xc08a5a).setDepth(3);
            this.layers.push({ x: nx, w: nw }); this.n++; this.sumW += nw; this.cur = null;
            if (this.n >= this.max) return this.end(); this.spawn();
        } });
    }
    update(_, dt) {
        if (!this.running) return; const s = dt / 1000;
        this.crane.clear(); this.crane.fillStyle(0x3a3a5e, 1).fillRect(0, 30, 900, 10);
        if (this.cur && !this.dropping) {
            const sp = 190 + this.n * 22, lo = 70 + this.cw / 2, hi = 830 - this.cw / 2;
            this.cx += this.dir * sp * s; if (this.cx > hi) { this.cx = hi; this.dir = -1; } if (this.cx < lo) { this.cx = lo; this.dir = 1; }
            this.cur.x = this.cx; this.crane.fillStyle(0x6a6f84, 1).fillRect(this.cx - 3, 40, 6, 68); this.crane.fillStyle(0xffd23f, 1).fillRect(this.cx - 14, 34, 28, 10);
        }
    }
    end() {
        if (!this.running) return; this.running = false;
        const score = VB.clamp(this.sumW / (this.base * 8), 0, 1);
        this.time.delayedCall(700, () => VB.mini.end(this, { type: 'shield', score, summary: 'Your wall is ' + this.n + ' layers thick with ' + this.perfect + ' perfect drop' + (this.perfect === 1 ? '' : 's') + '.',
            factTitle: 'REAL RADIATION NUMBERS (mSv per day)', fact: VB.snapshot.radiation.map(r => r.label + ': ' + r.msvDay).join('\n') + '\nMore soil on top = less radiation reaching the crew.' }));
    }
};

/* ============================================================ SIREN WATCH (timeline + airlock code) */
VB.MarsStormScene = class extends Phaser.Scene {
    constructor() { super('MarsStorm'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        VB.ui.space(this, true);
        const S = VB.S; this.round = 0; this.acc = 0; this.ui = []; this.ended = false; this.accept = false; this.seq = null; this.pads = null; this.done = 0; this.partial = 0;
        let pool = VB.nasa.cmes.slice(); const first = S.alert && S.alert.type === 'cme' ? S.alert.ev : null;
        pool = pool.filter(e => !first || e.id !== first.id).sort(() => Math.random() - 0.5);
        this.list = [first].concat(pool).filter(Boolean).slice(0, 3); while (this.list.length < 3) this.list.push(this.list[this.list.length - 1] || VB.snapshot.cmes[0]);
        this.hudT = VB.mini.hud(this, 'SIREN WATCH');
        VB.mini.intro(this, {
            title: 'SIREN WATCH', who: 'cmd',
            sub: 'Mars has no magnetic shield. Solar storms reach the surface.',
            how: 'Part 1: read 3 real CME reports from NASA DONKI and click the TIMELINE where you think the storm will reach Mars (hours from now). Part 2: the habitat airlocks flash a lock-down code. Repeat it! Better predictions give you more time to watch the code.',
            data: VB.nasa.badge() + ' (DONKI)',
            science: 'Mars is about 227.9 million km from the Sun, 1.5 times farther than Earth, so a CME takes longer to arrive here. NASA\'s Curiosity rover measured a sharp radiation jump on the Mars surface during the September 2017 solar storm.',
            start: () => this.timeline()
        });
    }
    clear() { this.ui.forEach(o => o.destroy && o.destroy()); this.ui = []; }
    timeline() {
        this.clear(); if (this.round >= 3) return this.simon();
        const e = this.list[this.round], add = o => { this.ui.push(o); return o; };
        this.trueH = VB.cmeEtaHours(e.speed, 'mars'); this.maxH = Math.max(80, Math.ceil(this.trueH * 1.35 / 20) * 20); this.guess = null; this.locked = false;
        const g = add(this.add.graphics()); VB.ui.box(g, 20, 44, 860, 150, 0x0d0c22, 0x3a37a8);
        add(VB.ui.text(this, 36, 54, 'NASA DONKI - CME REPORT ' + (this.round + 1) + '/3   ' + (e.live ? '[LIVE]' : '[REFERENCE]'), 16, '#58c8ff'));
        add(VB.ui.text(this, 36, 84, 'ID: ' + e.id + '\nLAUNCHED: ' + (e.time || '').replace('T', ' ') + '\nSUN LOCATION: ' + (e.src || '?') + '   TYPE: ' + e.type, 14, '#ffffff', { ls: 6 }));
        add(VB.ui.text(this, 560, 70, 'SPEED', 14, '#a9a7d8')); add(VB.ui.text(this, 560, 92, VB.fmt(e.speed) + ' km/s', 32, '#ffd23f'));
        add(VB.ui.text(this, 36, 160, 'Mars is ' + (VB.CHAPTERS.mars.sunDist / 1e6).toFixed(1) + ' million km from the Sun.  Remember: time = distance / speed.', 13, '#dcdcff'));
        // timeline bar
        this.tl = { x0: 60, x1: 840, y: 290 };
        const t = add(this.add.graphics()); t.fillStyle(0x2a2850, 1).fillRect(this.tl.x0, this.tl.y - 14, this.tl.x1 - this.tl.x0, 28); t.lineStyle(2, 0x9a97ff, 1).strokeRect(this.tl.x0, this.tl.y - 14, this.tl.x1 - this.tl.x0, 28);
        for (let h = 0; h <= this.maxH; h += 20) { const x = this.px(h); t.fillStyle(0x9a97ff, 1).fillRect(x - 1, this.tl.y + 14, 2, 8); add(VB.ui.text(this, x, this.tl.y + 26, h + 'h', 12, '#cfd0ff', { ox: 0.5 })); }
        add(VB.ui.text(this, 450, 240, 'CLICK THE TIMELINE: HOURS UNTIL THE STORM ARRIVES', 15, '#ffffff', { ox: 0.5 }));
        this.mark = add(this.add.graphics());
        const hit = add(this.add.zone(450, this.tl.y, this.tl.x1 - this.tl.x0 + 20, 70).setInteractive({ useHandCursor: true }));
        hit.on('pointerdown', p => this.setGuess(p.x)); hit.on('pointermove', p => { if (p.isDown) this.setGuess(p.x); });
        this.gTxt = add(VB.ui.text(this, 450, 350, 'Your guess: (tap the bar)', 18, '#ffd23f', { ox: 0.5 }));
        this.lockBtn = add(VB.ui.button(this, 450, 430, 280, 48, 'LOCK IN', () => this.lock(), { size: 20, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8 })); this.lockBtn.setEnabled(false);
    }
    px(h) { return this.tl.x0 + (h / this.maxH) * (this.tl.x1 - this.tl.x0); }
    setGuess(x) { if (this.locked) return; this.guess = VB.clamp(Math.round((x - this.tl.x0) / (this.tl.x1 - this.tl.x0) * this.maxH), 0, this.maxH); this.paintMark(); this.gTxt.setText('Your guess: about ' + this.guess + ' hours'); this.lockBtn.setEnabled(true); VB.audio.blip(500); }
    paintMark() { const m = this.mark; m.clear(); if (this.guess !== null) { const x = this.px(this.guess); m.fillStyle(0xffd23f, 1).fillRect(x - 3, this.tl.y - 24, 6, 48).fillTriangle(x - 10, this.tl.y - 34, x + 10, this.tl.y - 34, x, this.tl.y - 22); } if (this.locked) { const x = this.px(this.trueH); m.fillStyle(0x6fe06f, 1).fillRect(x - 3, this.tl.y - 24, 6, 48).fillTriangle(x - 10, this.tl.y + 34, x + 10, this.tl.y + 34, x, this.tl.y + 22); } }
    lock() {
        if (this.locked || this.guess === null) return; this.locked = true; const rel = Math.abs(this.guess - this.trueH) / this.trueH;
        const pts = rel <= 0.08 ? 1 : rel >= 0.4 ? 0 : 1 - (rel - 0.08) / 0.32; this.acc += pts; this.paintMark(); (pts > 0.6 ? VB.audio.good : VB.audio.bad).call(VB.audio);
        const e = this.list[this.round];
        this.gTxt.setText((pts > 0.85 ? 'EXCELLENT! ' : pts > 0.4 ? 'CLOSE! ' : 'FAR OFF. ') + 'It arrives in about ' + Math.round(this.trueH) + 'h (' + VB.fmt(VB.CHAPTERS.mars.sunDist) + ' km / ' + VB.fmt(e.speed) + ' km/s)').setColor(pts > 0.6 ? '#6fe06f' : '#ff9a7a').setFontSize(14);
        this.lockBtn.destroy(); this.ui.push(VB.ui.button(this, 450, 430, 280, 48, this.round < 2 ? 'NEXT REPORT' : 'LOCK DOWN CODE!', () => { this.round++; this.timeline(); }, { size: 18 }));
    }
    simon() {
        this.clear(); VB.audio.alarm(); VB.audio.setMood('storm');
        const add = o => { this.ui.push(o); return o; }, acc = this.acc / 3; this.simonRound = 0; this.lens = [3, 4, 5]; this.done = 0; this.partial = 0;
        add(VB.ui.text(this, 450, 50, 'LOCK DOWN THE HABITAT!', 26, '#ff7a7a', { ox: 0.5, stroke: '#000', st: 6 }));
        this.sTxt = add(VB.ui.text(this, 450, 92, '', 16, '#ffffff', { ox: 0.5 }));
        this.pads = [];
        [[0xe53a3a, 'A'], [0x3a8ae5, 'B'], [0x3ae56a, 'C'], [0xe5c83a, 'D']].forEach((p, i) => {
            const x = 300 + (i % 2) * 300, y = 200 + Math.floor(i / 2) * 130, r = add(this.add.rectangle(x, y, 250, 110, p[0], 0.35).setStrokeStyle(4, 0xffffff).setInteractive({ useHandCursor: true }));
            add(VB.ui.text(this, x, y, 'AIRLOCK ' + p[1], 22, '#ffffff', { ox: 0.5, oy: 0.5 })); r.base = p[0]; r.on('pointerdown', () => this.press(i)); this.pads.push(r);
        });
        this.gap = 430 + Math.round(acc * 240); // better forecasts = more time per light
        add(VB.ui.text(this, 450, 466, 'Forecast accuracy ' + Math.round(acc * 100) + '% gives you a ' + (this.gap / 1000).toFixed(2) + 's per light.', 13, '#cfd4e4', { ox: 0.5 }));
        this.time.delayedCall(900, () => this.showSeq());
    }
    flash(i, ms) { const p = this.pads[i]; p.setFillStyle(p.base, 1); VB.audio.blip(300 + i * 140); this.time.delayedCall(ms, () => p.setFillStyle(p.base, 0.35)); }
    showSeq() {
        if (this.simonRound >= 3) return this.finish();
        const L = this.lens[this.simonRound]; this.seq = Array.from({ length: L }, () => Phaser.Math.Between(0, 3)); this.inp = 0; this.accept = false;
        this.sTxt.setText('Watch the code... (round ' + (this.simonRound + 1) + '/3, ' + L + ' lights)');
        this.seq.forEach((v, k) => this.time.delayedCall(k * this.gap, () => this.flash(v, this.gap * 0.7)));
        this.time.delayedCall(L * this.gap + 250, () => { this.accept = true; this.sTxt.setText('Now YOU repeat it!'); });
    }
    press(i) {
        if (!this.accept) return; this.flash(i, 160);
        if (i !== this.seq[this.inp]) { this.accept = false; VB.audio.bad(); this.partial = this.inp / this.seq.length; this.sTxt.setText('Wrong airlock! The code was ' + this.seq.map(v => 'ABCD'[v]).join(' ')).setColor('#ff7a7a'); return this.time.delayedCall(1400, () => this.finish()); }
        this.inp++;
        if (this.inp >= this.seq.length) { this.accept = false; this.done++; VB.audio.good(); this.sTxt.setText('Code accepted!').setColor('#6fe06f'); this.simonRound++; this.time.delayedCall(900, () => { this.sTxt.setColor('#ffffff'); this.showSeq(); }); }
    }
    finish() {
        if (this.ended) return; this.ended = true; VB.audio.setMood(VB.S.chapter);
        const score = 0.5 * (this.acc / 3) + 0.5 * ((this.done + this.partial) / 3);
        VB.mini.end(this, { type: 'storm', score, summary: 'Forecast accuracy ' + Math.round(this.acc / 3 * 100) + '%.  Airlock codes completed: ' + this.done + '/3.',
            factTitle: 'REAL SPACE WEATHER', fact: 'DONKI is run by NASA\'s Community Coordinated Modeling Center (CCMC). Missions at Mars, like MAVEN, watch the Sun too, because Mars has no global magnetic field to deflect solar particles. Crews would shelter in the most shielded part of the base.' });
    }
};
