/* Storm Watch - read a real NASA DONKI coronal-mass-ejection report, predict arrival time, then shelter the crew. */
VB.StormScene = class extends Phaser.Scene {
    constructor() { super('Storm'); }
    create() {
        this.cameras.main.fadeIn(250, 0, 0, 0);
        const S = VB.S; this.planet = S.chapter;
        VB.ui.space(this, true);
        this.round = 0; this.correct = 0; this.sheltered = 0; this.mode = null; this.drillOn = false; this.answered = false; this.ui = null;
        // pick 3 distinct events; the active alert comes first
        let pool = VB.nasa.cmes.slice();
        const first = S.alert && S.alert.type === 'cme' ? S.alert.ev : null;
        pool = pool.filter(e => !first || e.id !== first.id).sort(() => Math.random() - 0.5);
        this.cmeList = [first].concat(pool).filter(Boolean).slice(0, 3);
        while (this.cmeList.length < 3) this.cmeList.push(this.cmeList[this.cmeList.length - 1] || VB.snapshot.cmes[0]);
        this.hudT = VB.mini.hud(this, 'STORM WATCH');
        VB.mini.intro(this, {
            title: 'STORM WATCH', who: 'cmd',
            sub: 'Space weather can harm astronauts and electronics.',
            how: 'Read 3 real CME reports from NASA DONKI. For each one, pick HOW MANY HOURS it takes to reach the outpost (time = distance / speed). Every correct answer gives the crew more time in the SHELTER DRILL that follows!',
            data: VB.nasa.badge() + ' (DONKI at api.nasa.gov)',
            science: 'A coronal mass ejection (CME) is a giant cloud of charged particles thrown from the Sun. NASA\'s DONKI database records every CME with its launch time and speed. Fast CMEs (over 1,000 km/s) can arrive in less than two days.',
            start: () => this.nextRound()
        });
    }
    nextRound() {
        if (this.ui) this.ui.forEach(o => o.destroy()); this.ui = [];
        if (this.round >= 3) return this.drill();
        const e = this.cmeList[this.round], ch = VB.CHAPTERS[this.planet];
        const add = o => { this.ui.push(o); return o; };
        const g = add(this.add.graphics()); VB.ui.box(g, 20, 44, 560, 300, 0x0d0c22, 0x3a37a8);
        add(VB.ui.text(this, 36, 54, 'NASA DONKI - CME REPORT ' + (this.round + 1) + '/3', 17, '#58c8ff'));
        add(VB.ui.text(this, 564, 56, e.live ? 'LIVE' : 'REFERENCE', 13, e.live ? '#6fe06f' : '#ff9a3c', { ox: 1 }));
        const rows = [['EVENT ID', e.id], ['LAUNCHED', (e.time || '').replace('T', ' ')], ['SUN LOCATION', e.src || '?'], ['TYPE', e.type + (e.approx ? ' (approx.)' : '')],
                      ['SPEED', VB.fmt(e.speed) + ' km/s'], ['WIDTH (half-angle)', (e.half || '?') + ' deg']];
        rows.forEach((r, i) => { add(VB.ui.text(this, 36, 88 + i * 26, r[0], 14, '#a9a7d8')); add(VB.ui.text(this, 250, 88 + i * 26, String(r[1]), 15, i === 4 ? '#ffd23f' : '#ffffff', { w: 320 })); });
        add(VB.ui.text(this, 36, 250, e.note || 'No notes for this event.', 13, '#dcdcff', { w: 530, ls: 5 }));
        // right: crew advice + question
        const f = add(this.add.graphics()); VB.ui.box(f, 600, 44, 280, 300, 0x0d0c22, 0x3a37a8);
        add(this.add.image(612, 56, 'b3').setOrigin(0).setScale(1.5));
        add(VB.ui.text(this, 700, 58, 'DR. SAGE', 14, VB.CREW.sci.color));
        add(VB.ui.text(this, 700, 80, 'The outpost is ' + (ch.sunDist / 1e6).toFixed(1) + ' million km from the Sun.', 12, '#ffffff', { w: 176, ls: 4 }));
        add(VB.ui.text(this, 614, 140, 'How many HOURS until this CME reaches us?\n\nHint: time = distance / speed\n(1 hour = 3,600 seconds)', 14, '#ffffff', { w: 250, ls: 6 }));
        // choices
        const t = Math.round(VB.cmeEtaHours(e.speed, this.planet));
        this.correctH = t;
        let opts = [t, Math.max(2, Math.round(t * 0.5)), Math.round(t * 2)];
        if (opts[1] === t) opts[1] = t + 12; opts = opts.sort(() => Math.random() - 0.5);
        opts.forEach((h, i) => add(VB.ui.button(this, 160 + i * 290, 410, 240, 54, '~' + h + ' hours', () => this.answer(h, e, add), { size: 20 })));
        this.hudT.setText('');
    }
    answer(h, e, add) {
        if (this.answered) return; this.answered = true;
        const ok = h === this.correctH, ch = VB.CHAPTERS[this.planet];
        if (ok) { this.correct++; VB.audio.good(); } else VB.audio.bad();
        const secs = Math.round(ch.sunDist / e.speed);
        VB.ui.modal(this, { title: ok ? 'CORRECT!' : 'NOT QUITE', color: ok ? '#6fe06f' : '#ff7a7a', w: 660, h: 280, size: 17,
            body: VB.fmt(ch.sunDist) + ' km  /  ' + VB.fmt(e.speed) + ' km/s  =  ' + VB.fmt(secs) + ' seconds\n= about ' + this.correctH + ' hours (' + (this.correctH / 24).toFixed(1) + ' days).\n\nReal CMEs speed up or slow down on the way, so forecasters keep updating their predictions.',
            buttons: [{ label: this.round < 2 ? 'NEXT REPORT' : 'SHELTER DRILL!', cb: () => { this.answered = false; this.round++; this.nextRound(); } }] });
    }
    drill() {
        VB.audio.alarm(); VB.audio.setMood('storm');
        this.mode = 'drill'; const S = VB.S;
        const mars = this.planet === 'mars';
        this.ui.forEach(o => o.destroy()); this.ui = [];
        this.add.rectangle(450, 250, 900, 500, 0x1a0a14).setDepth(0);
        this.add.image(0, 0, mars ? 'bg_mars' : 'bg_moon').setOrigin(0).setScale(4).setDepth(1);
        this.add.rectangle(450, 396, 900, 208, mars ? 0x7a3524 : 0x5a5a67).setDepth(1);
        this.warn = this.add.rectangle(450, 250, 900, 500, 0xff2020, 0).setDepth(30);
        this.tweens.add({ targets: this.warn, alpha: 0.18, yoyo: true, repeat: -1, duration: 400 });
        this.dome = this.add.image(780, 400, 'dome').setOrigin(0.5, 1).setScale(5).setDepth(3);
        VB.ui.text(this, 450, 20, 'SHELTER DRILL: CLICK EACH ASTRONAUT TO SEND THEM INSIDE!', 18, '#ffffff', { ox: 0.5, d: 40, stroke: '#000', st: 5 });
        this.drillTime = 7 + this.correct * 3; this.left = this.drillTime;
        this.timerBar = VB.ui.bar(this, 200, 56, 500, 14, VB.COL.danger); this.timerBar.g.setDepth(40);
        this.crewSp = [];
        ['cmd', 'eng', 'sci', 'cmd'].forEach((k, i) => {
            const sp = this.add.image(120 + i * 130, 380 + (i % 2) * 18, VB.CREW[k].tex).setOrigin(0.5, 1).setScale(4).setDepth(10).setInteractive({ useHandCursor: true });
            sp.safe = false; sp.vx = Phaser.Math.Between(20, 50) * (i % 2 ? 1 : -1);
            sp.on('pointerdown', () => this.send(sp));
            this.crewSp.push(sp);
        });
        this.countTxt = VB.ui.text(this, 450, 82, '', 15, '#ffd23f', { ox: 0.5, d: 40, stroke: '#000', st: 4 });
        this.drillOn = true;
    }
    send(sp) {
        if (!this.drillOn || sp.safe) return; sp.safe = true; VB.audio.coin();
        this.tweens.add({ targets: sp, x: 780, y: 396, duration: 900, onComplete: () => { sp.setVisible(false); this.sheltered++; this.checkDrill(); } });
    }
    checkDrill() { if (this.sheltered >= 4) this.endDrill(); }
    update(_, dt) {
        if (this.mode !== 'drill' || !this.drillOn) return;
        const s = dt / 1000; this.left -= s;
        this.timerBar.set(this.left / this.drillTime);
        this.countTxt.setText('CME ARRIVES IN ' + Math.max(0, this.left).toFixed(1) + 's   (sheltered ' + this.sheltered + '/4)   bonus time from correct answers: +' + this.correct * 3 + 's');
        this.crewSp.forEach(sp => { if (!sp.safe) { sp.x += sp.vx * s; if (sp.x < 60 || sp.x > 560) sp.vx *= -1; sp.setFlipX(sp.vx < 0); } });
        if (this.left <= 0) this.endDrill();
    }
    endDrill() {
        if (!this.drillOn) return; this.drillOn = false;
        const score = 0.5 * (this.correct / 3) + 0.5 * (this.sheltered / 4);
        const hit = 4 - this.sheltered; VB.audio.setMood(VB.S.chapter);
        this.time.delayedCall(600, () => VB.mini.end(this, { type: 'storm', score,
            summary: this.correct + '/3 arrival times right. ' + this.sheltered + '/4 crew sheltered' + (hit ? ' - ' + hit + ' caught outside!' : '.'),
            factTitle: 'REAL SPACE WEATHER',
            fact: 'DONKI is run by NASA\'s Community Coordinated Modeling Center (CCMC). Forecasters there combine satellite images and computer models to warn astronauts, airlines and power grids. In March 1989 a solar storm blacked out Quebec\'s power grid for 9 hours.' }));
    }
};
