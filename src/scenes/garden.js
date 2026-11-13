/* Garden mini-game - inspired by NASA OSDR plant-growth studies (ISS Veggie / Advanced Plant Habitat). */
VB.GardenScene = class extends Phaser.Scene {
    constructor() { super('Garden'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        this.running = false; this.t = 0; this.dur = 40;
        const mars = VB.S.chapter === 'mars';
        this.add.rectangle(450, 250, 900, 500, 0x0d1a18);
        // chamber walls + LED strip
        const g = this.add.graphics();
        g.fillStyle(0x1c2e2a, 1).fillRect(0, 0, 900, 40); g.fillStyle(0x16231f, 1).fillRect(0, 300, 900, 200);
        for (let x = 10; x < 900; x += 18) g.fillStyle(((x / 18) | 0) % 2 ? 0xff3fd0 : 0x4a7bff, 1).fillRect(x, 30, 12, 6);
        this.hudT = VB.mini.hud(this, 'SPACE GARDEN');
        VB.ui.text(this, 450, 54, 'Keep BOTH bars in the green zone to grow food!', 14, '#a9ffd0', { ox: 0.5 });

        this.pots = [];
        for (let i = 0; i < 4; i++) {
            const x = 135 + i * 210, rate = [4.2, 5.6, 4.8, 6.2][i], lr = [3.6, 4.4, 5.2, 3.9][i];
            const glow = this.add.rectangle(x, 50, 118, 230, 0xff3fd0, 0.0).setOrigin(0.5, 0);
            const lamp = this.add.rectangle(x, 46, 110, 8, 0xaaaaaa);
            const plant = this.add.image(x, 280, 'plant0').setOrigin(0.5, 1).setScale(8);
            const pot = { x, w: 60 + i * 3, l: 62 - i * 4, grow: 0, wr: rate, lr, glow, lamp, plant, bad: 0 };
            // bars
            VB.ui.text(this, x - 62, 296, 'WATER', 12, '#58c8ff');
            VB.ui.text(this, x - 62, 336, 'LIGHT', 12, '#ffd23f');
            pot.wb = VB.ui.bar(this, x - 62, 312, 124, 14, VB.COL.o2);
            pot.lb = VB.ui.bar(this, x - 62, 352, 124, 14, VB.COL.energy);
            [312, 352].forEach(y => this.add.rectangle(x - 62 + 124 * 0.575, y + 7, 124 * 0.45, 14, 0x6fe06f, 0.22).setStrokeStyle(2, 0x6fe06f, 0.9));
            pot.gb = VB.ui.bar(this, x - 62, 380, 124, 8, 0x6fe06f);
            pot.wBtn = VB.ui.button(this, x - 31, 412, 58, 34, 'WATER', () => this.give(pot, 'w'), { size: 11, fill: 0x1d5d8a, hi: 0x2d85c0 });
            pot.lBtn = VB.ui.button(this, x + 31, 412, 58, 34, 'LIGHT', () => this.give(pot, 'l'), { size: 11, fill: 0x8a6d1d, hi: 0xc09a2d });
            this.pots.push(pot);
        }
        VB.ui.text(this, 450, 462, 'Too dry = wilting. Too wet = no air for roots. Too much light = scorched leaves!', 13, '#8fb8a8', { ox: 0.5 });

        VB.mini.intro(this, {
            title: 'TEND THE GARDEN', who: 'sci',
            sub: 'Fresh food keeps the crew healthy and happy.',
            how: 'Press WATER and LIGHT under each plant to keep both bars in the GREEN ZONE. Bars slowly drain, so keep checking all 4 plants for 40 seconds. Plants only grow when both bars are in the zone!',
            data: 'NASA OSDR (Open Science Data Repository)',
            science: 'On the ISS, astronauts grew red romaine lettuce, zinnias and Hatch chile peppers in the Veggie and Advanced Plant Habitat chambers, under red and blue LED light. OSDR stores the data from these space-biology experiments for anyone to study.',
            start: () => { this.running = true; }
        });
    }
    give(p, k) {
        if (!this.running) return;
        p[k] = Math.min(100, p[k] + 24); VB.audio.coin();
    }
    update(_, dt) {
        if (!this.running) return;
        const s = dt / 1000; this.t += s;
        this.hudT.setText(Math.max(0, Math.ceil(this.dur - this.t)) + 's');
        let tot = 0;
        this.pots.forEach(p => {
            p.w = Math.max(0, p.w - p.wr * s); p.l = Math.max(0, p.l - p.lr * s);
            const wOk = p.w >= 35 && p.w <= 80, lOk = p.l >= 35 && p.l <= 80;
            if (wOk && lOk) p.grow = Math.min(1, p.grow + s / (this.dur * 0.78));
            else if (p.w < 10 || p.w > 92 || p.l < 10 || p.l > 92) p.grow = Math.max(0, p.grow - s * 0.01);
            p.wb.set(p.w / 100, wOk ? VB.COL.good : (p.w < 35 ? 0xff9a3c : VB.COL.danger));
            p.lb.set(p.l / 100, lOk ? VB.COL.good : (p.l < 35 ? 0xff9a3c : VB.COL.danger));
            p.gb.set(p.grow);
            const stage = Math.min(4, Math.floor(p.grow * 4.99));
            const stressed = !(wOk && lOk);
            p.plant.setTexture(stressed && p.grow < 0.05 ? 'wilt' : 'plant' + stage);
            p.plant.setTint(stressed ? 0xbbbb88 : 0xffffff);
            const lc = lOk ? 0xff3fd0 : (p.l < 35 ? 0x555566 : 0xffffff);
            p.lamp.setFillStyle(lc); p.glow.setFillStyle(lc, lOk ? 0.13 : (p.l < 35 ? 0.02 : 0.2));
            tot += p.grow;
        });
        if (this.t >= this.dur) this.finish(tot / 4);
    }
    finish(avg) {
        this.running = false;
        const list = VB.nasa.osdr, o = list[Math.floor(Math.random() * list.length)];
        const live = VB.nasa.status.osdr === 'live';
        VB.mini.end(this, {
            type: 'garden', score: avg / 0.78,
            summary: 'Your plants reached ' + Math.round(avg / 0.78 * 100) + '% of their growth goal.',
            factTitle: live ? 'LIVE FROM NASA OSDR' : 'SPACE BIOLOGY (NASA OSDR)',
            fact: o.title + (o.id ? ' [' + o.id + ']' : '') + (o.note ? '\n' + o.note : '')
        });
    }
};
