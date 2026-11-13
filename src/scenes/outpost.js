/* The outpost hub: manage oxygen, power, food and radiation shielding, one sol at a time. */
VB.OutpostScene = class extends Phaser.Scene {
    constructor() { super('Outpost'); }

    create(data) {
        const S = VB.S; if (!S) { this.scene.start('Title'); return; }
        const ch = VB.CHAPTERS[S.chapter], mars = S.chapter === 'mars';
        this.cameras.main.fadeIn(300, 0, 0, 0);
        this.busy = false;

        /* ---- scenery ---- */
        if (!mars) this.add.tileSprite(450, 58 + 146, 900, 292, 'space');
        this.add.image(0, 58, mars ? 'bg_mars' : 'bg_moon').setOrigin(0).setScale(4);
        this.add.image(70, 332, 'flag').setOrigin(0.5, 1).setScale(3);
        [[120, 345], [790, 338], [860, 320], [30, 310]].forEach(p => this.add.image(p[0], p[1], 'rock').setScale(3).setTint(mars ? 0xd08a6a : 0xffffff));
        this.berms = [];
        for (let i = 0; i < 8; i++) {
            const b = this.add.image(140 + i * 34, 322 + (i % 2) * 3, 'berm').setOrigin(0.5, 1).setScale(3).setDepth(3);
            if (mars) b.setTint(0xe0906a);
            this.berms.push(b);
        }
        this.add.image(250, 306, 'dome').setOrigin(0.5, 1).setScale(4).setDepth(2);
        this.panels = [0, 1, 2, 3].map(i => this.add.image(452 + i * 46, 306, 'panel').setOrigin(0.5, 1).setScale(3).setDepth(2));
        this.add.image(700, 306, 'greenhouse').setOrigin(0.5, 1).setScale(4).setDepth(2);
        this.rover = this.add.image(120, 340, 'rover').setOrigin(0.5, 1).setScale(3).setDepth(5);
        this.tweens.add({ targets: this.rover, x: 800, duration: 26000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => this.rover.setFlipX(true), onRepeat: () => this.rover.setFlipX(false) });

        /* ---- crew ---- */
        this.crew = [];
        ['cmd', 'eng', 'sci'].forEach((k, i) => {
            const sp = this.add.image(320 + i * 60, 326 + (i % 2) * 8, VB.CREW[k].tex).setOrigin(0.5, 1).setScale(3).setDepth(10);
            this.crew.push(sp); this.wander(sp, k === S.role);
            if (k === S.role) {
                this.you = sp;
                this.arrow = VB.ui.text(this, sp.x, sp.y - 62, 'v ' + S.name.toUpperCase(), 12, '#ffd23f', { ox: 0.5, stroke: '#000', st: 3, d: 11 });
            }
        });
        this.orbi = this.add.image(380, 235, 'orbi').setScale(3).setDepth(12);
        this.tweens.add({ targets: this.orbi, y: 224, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });

        this.buildHud();
        this.buildActions();
        this.refresh();

        VB.audio.setMood(S.chapter);

        // Sol briefing (only once per sol).
        const stamp = S.chapter + S.sol;
        if (data && data.intro) this.briefing(true);
        else if (S.briefed !== stamp) this.briefing(false);
        S.briefed = stamp;
    }

    update() { if (this.arrow && this.you) { this.arrow.x = this.you.x; this.arrow.y = this.you.y - 52; } }

    wander(sp, isYou) {
        const go = () => {
            if (!sp.scene) return;
            const tx = Phaser.Math.Between(150, 560), dist = Math.abs(tx - sp.x);
            sp.setFlipX(tx < sp.x);
            this.tweens.add({ targets: sp, x: tx, duration: dist * 22, ease: 'Linear', onComplete: () => this.time.delayedCall(Phaser.Math.Between(400, 2200), go) });
            this.tweens.add({ targets: sp, y: sp.y - 4, yoyo: true, repeat: Math.floor(dist / 22), duration: 150 });
        };
        this.time.delayedCall(Phaser.Math.Between(0, 1200), go);
    }

    /* ---------- HUD ---------- */
    buildHud() {
        const S = VB.S, ch = VB.CHAPTERS[S.chapter];
        VB.ui.panel(this, 0, 0, 900, 58, { fill: 0x0d0c22, edge: 0x3a37a8 }).setDepth(50);
        this.solTxt = VB.ui.text(this, 12, 6, '', 17, '#ffd23f', { d: 51 });
        this.apTxt = VB.ui.text(this, 888, 6, '', 17, '#ffffff', { ox: 1, d: 51 });
        const mk = (i, icon, label, color) => {
            const x = 8 + i * 148, y = 30;
            if (icon) this.add.image(x + 2, y + 1, icon).setOrigin(0).setScale(2).setDepth(51);
            else VB.ui.text(this, x, y + 2, label, 12, '#ff9ab0', { d: 51 });
            const bar = VB.ui.bar(this, x + 22, y + 2, 92, 14, color); bar.g.setDepth(51);
            const val = VB.ui.text(this, x + 118, y + 2, '', 12, '#ffffff', { d: 51 });
            return { bar, val };
        };
        this.gO2 = mk(0, 'ic_o2', '', VB.COL.o2); this.gEn = mk(1, 'ic_energy', '', VB.COL.energy);
        this.gFd = mk(2, 'ic_food', '', VB.COL.food); this.gSh = mk(3, 'ic_shield', '', VB.COL.shield);
        this.gHp = mk(4, null, 'HP', VB.COL.hp); this.gDs = mk(5, null, 'DOSE', VB.COL.dose);
        this.alertBox = this.add.graphics().setDepth(40);
        this.alertTxt = VB.ui.text(this, 450, 82, '', 14, '#ffffff', { ox: 0.5, oy: 0.5, d: 41, w: 850, align: 'center' });
        this.tweens.add({ targets: [this.alertBox, this.alertTxt], alpha: 0.55, yoyo: true, repeat: -1, duration: 600 });
    }

    refresh() {
        const S = VB.S, ch = VB.CHAPTERS[S.chapter], R = S.res;
        this.solTxt.setText(ch.world + ' - SOL ' + Math.min(S.sol, ch.sols) + '/' + ch.sols + '  ' + ch.name);
        this.apTxt.setText('ACTIONS: ' + '#'.repeat(S.ap) + '-'.repeat(Math.max(0, 3 - S.ap)));
        const lowCol = (v, c) => v < 0.25 ? VB.COL.danger : c;
        this.gO2.bar.set(R.o2 / 100, lowCol(R.o2 / 100, VB.COL.o2)); this.gO2.val.setText(Math.round(R.o2));
        this.gEn.bar.set(R.energy / 100, lowCol(R.energy / 100, VB.COL.energy)); this.gEn.val.setText(Math.round(R.energy));
        this.gFd.bar.set(R.food / 100, lowCol(R.food / 100, VB.COL.food)); this.gFd.val.setText(Math.round(R.food));
        this.gSh.bar.set(R.shield / 100, VB.COL.shield); this.gSh.val.setText(Math.round(R.shield));
        this.gHp.bar.set(S.health / 100, lowCol(S.health / 100, VB.COL.hp)); this.gHp.val.setText(Math.round(S.health));
        this.gDs.bar.set(Math.min(1, S.dose / 100), S.dose > 75 ? VB.COL.danger : VB.COL.dose); this.gDs.val.setText(Math.round(S.dose) + 'mSv');

        this.panels.forEach((p, i) => p.setTint(R.energy > (i + 1) * 22 ? 0xffffff : 0x444466));
        const nB = Math.ceil(R.shield / 12.5);
        this.berms.forEach((b, i) => b.setVisible(i < nB));

        // alert banner
        this.alertBox.clear();
        if (S.alert && S.alert.type === 'cme') {
            const e = S.alert.ev, eta = VB.cmeEtaHours(e.speed);
            VB.ui.box(this.alertBox, 20, 66, 860, 32, 0x5a1020, 0xff5a5a);
            this.alertTxt.setText('SOLAR STORM ALERT (NASA DONKI): CME at ' + VB.fmt(e.speed) + ' km/s - arrives in about ' + Math.round(eta) + ' hours! Open ' + VB.act('storm').name + '.');
        } else if (S.alert && S.alert.type === 'dust') {
            VB.ui.box(this.alertBox, 20, 66, 860, 32, 0x5a3a10, 0xffb03c);
            this.alertTxt.setText('DUST STORM COMING: sunlight will be blocked. Use ' + VB.act('solar').name + ' to cut the loss in half.');
        } else this.alertTxt.setText('');
        this.alertBox.setVisible(!!S.alert); this.alertTxt.setVisible(!!S.alert);

        // hint
        let hint = 'Pick up to 3 ACTIONS, then press END SOL. Keep every bar healthy!';
        if (R.o2 < 30) hint = 'OXYGEN is low! Make oxygen before we run out of air.';
        else if (R.energy < 25) hint = 'POWER is low! Try ' + VB.act('solar').name + '.';
        else if (R.food < 25) hint = 'FOOD is running out. Tend the garden!';
        else if (S.alert && S.alert.type === 'cme' && !S.did.storm) hint = 'Storm incoming! Use ' + VB.act('storm').name + ' so the crew can prepare.';
        else if (S.dose > 45) hint = 'Radiation dose is climbing! Build more shield: ' + VB.act('shield').name + '.';
        else if (S.ap === 0) hint = 'No actions left. Press END SOL to start the next day.';
        this.hint.setText(hint);
        this.btns.forEach(b => { b.mark.setVisible(!!S.did[b.id]); b.btn.setEnabled(true); });
    }

    /* ---------- actions ---------- */
    buildActions() {
        VB.ui.panel(this, 0, 352, 900, 148, { fill: 0x0d0c22, edge: 0x3a37a8 }).setDepth(50);
        const f = this.add.graphics().setDepth(51); VB.ui.box(f, 12, 362, 76, 76, 0x000000, 0xffffff);
        this.add.image(14, 364, 'b4').setOrigin(0).setScale(1.5).setDepth(52);
        this.hint = VB.ui.text(this, 98, 364, '', 14, '#dcdcff', { w: 235, d: 51, ls: 5 });
        VB.ui.text(this, 14, 446, 'ORBI SAYS', 10, '#ff9ad5', { d: 51 });

        const fills = { oxygen: [0x1d5d8a, 0x2d85c0], solar: [0x8a6d1d, 0xc09a2d], garden: [0x1d6d2d, 0x2da040], shield: [0x5a2d8a, 0x8545c0], storm: [0x8a2d2d, 0xc04545] };
        const acts = ['oxygen', 'solar', 'garden', 'shield', 'storm'].map(id => {
            const a = VB.act(id); return { id, scene: a.scene, label: a.name + '\n' + a.sub, fill: fills[id][0], hi: fills[id][1] };
        });
        acts.push({ id: 'chat', scene: null, label: 'CREW CHAT\nrest + facts', fill: 0x3a37a8, hi: 0x5753e0 });
        this.btns = [];
        acts.forEach((a, i) => {
            const x = 433 + (i % 3) * 184, y = 392 + Math.floor(i / 3) * 58;
            const btn = VB.ui.button(this, x, y, 176, 52, a.label, () => this.act(a), { size: 13, fill: a.fill, hi: a.hi, d: 52 });
            const mark = this.add.rectangle(x + 78, y - 22, 10, 10, 0x6fe06f).setDepth(54).setStrokeStyle(2, 0x000000);
            this.btns.push({ id: a.id, btn, mark });
            if (a.id === 'storm') this.stormBtn = btn;
        });
        this.endBtn = VB.ui.button(this, 170, 474, 300, 34, 'END SOL  >>', () => this.askEnd(), { size: 16, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8, d: 52 });
        this.time.addEvent({ delay: 500, loop: true, callback: () => {
            if (VB.S.alert && VB.S.alert.type === 'cme' && !VB.S.did.storm && this.stormBtn) this.stormBtn.setScale(this.stormBtn.scale > 1 ? 1 : 1.06);
        } });
    }

    act(a) {
        if (this.busy) return;
        const S = VB.S;
        if (S.ap <= 0) { VB.audio.bad(); VB.ui.toast(this, 'No actions left! Press END SOL.', '#ff7a7a'); return; }
        if (a.id === 'chat') return this.chat();
        S.ap--;
        VB.go(this, a.scene);
    }

    chat() {
        const S = VB.S; this.busy = true; S.ap--;
        const facts = [
            ['cmd', "The Moon's south pole has craters that never see sunlight. NASA's LCROSS mission found water ice there in 2009!"],
            ['eng', 'The robotic arm on the ISS is Canadian-built. Canada is also making Canadarm3 for NASA-led Gateway near the Moon.'],
            ['sci', "Moon dust is sharp and sticky. With no wind or water to smooth it, it clings to suits and solar panels!"],
            ['orbi', 'A day on Mars is called a SOL: 24 hours and 39 minutes. That is why this game counts sols!'],
            ['sci', "On Earth, our air and magnetic field block most cosmic rays. The Moon and Mars have almost no protection."],
            ['eng', 'NASA Perseverance carries MOXIE, a toaster-sized machine that made oxygen from the carbon dioxide in Mars air!'],
            ['orbi', "Canada's Radi-N2 experiment used tiny bubble detectors on the ISS to measure neutron radiation."],
            ['sci', 'Water and plastic are great radiation shields because they are full of hydrogen. Metal can make extra particles.']
        ];
        const f = facts[(S.sol * 2 + S.ap) % facts.length];
        const heal = Math.min(8, 100 - S.health);
        S.health = Math.min(100, S.health + 8);
        VB.ui.dialog(this, [
            { who: f[0], t: f[1] },
            { who: 'orbi', t: 'The crew feels better after a chat! Crew health +8.' }
        ], () => { this.busy = false; S.did.chat = 1; this.refresh(); });
        VB.audio.good();
    }

    /* ---------- sol briefing ---------- */
    briefing(first) {
        const S = VB.S, ch = VB.CHAPTERS[S.chapter], lines = [];
        if (first) {
            lines.push({ who: 'orbi', t: S.name + ', welcome to ' + ch.name + '! Each SOL is about two weeks of mission time. You get 3 ACTIONS per sol.' });
            lines.push({ who: 'orbi', t: 'Every sol the crew uses OXYGEN, POWER and FOOD. Radiation (DOSE) builds up, too. Keep DOSE below 100 mSv and the crew healthy for ' + ch.sols + ' sols!' });
            lines.push({ who: 'sci', t: 'A bigger SHIELD blocks radiation. The numbers come from real measurements: about 1.4 mSv per day on the Moon, versus about 0.007 on Earth.' });
        }
        if (S.chapter === 'mars' && !S.marsHello) {
            S.marsHello = true;
            lines.push({ who: 'cmd', t: 'We made it to Mars! Welcome to ' + (S.site ? S.site.name : 'the red planet') + '. ' + (S.site ? S.site.arrival : '') });
            lines.push({ who: 'orbi', t: 'Mars is different, so our jobs are different too! We have a MOXIE REACTOR, a ROVER CLEANER, a WATER LOOP, a REGOLITH WALL and SIREN WATCH.' });
        }
        if (S.alert && S.alert.type === 'cme') {
            const e = S.alert.ev, eta = Math.round(VB.cmeEtaHours(e.speed));
            lines.push({ who: 'orbi', t: 'ALERT! NASA DONKI reports a coronal mass ejection (CME): ' + VB.fmt(e.speed) + ' km/s' + (e.live ? '' : ' (reference event)') + '. It could reach us in about ' + eta + ' hours!' });
            lines.push({ who: S.role === 'cmd' ? 'sci' : 'cmd', t: 'Use ' + VB.act('storm').name + ' to get ready. A bigger SHIELD helps, too.' });
            VB.audio.alarm();
        } else if (S.alert && S.alert.type === 'dust') {
            lines.push({ who: 'eng', t: 'Dust storm on the way! Sunlight will be blocked, and our panels will lose power. Cleaning them first (' + VB.act('solar').name + ') cuts the loss in half.' });
            VB.audio.alarm();
        }
        if (!lines.length) return;
        this.busy = true;
        VB.ui.dialog(this, lines, () => { this.busy = false; });
    }

    /* ---------- end of sol ---------- */
    askEnd() {
        if (this.busy) return;
        const S = VB.S;
        if (S.ap > 0) {
            this.busy = true;
            VB.ui.modal(this, { title: 'END THE SOL?', w: 560, h: 220, size: 17,
                body: 'You still have ' + S.ap + ' action' + (S.ap > 1 ? 's' : '') + ' left. The crew will use air, power and food tonight.',
                buttons: [{ label: 'KEEP PLAYING', cb: () => { this.busy = false; }, fill: 0x4a2a2a }, { label: 'END SOL', cb: () => this.endSol(), fill: 0x1f8f3a }] });
        } else this.endSol();
    }

    endSol() {
        this.busy = true;
        const S = VB.S, ch = VB.CHAPTERS[S.chapter];
        const rep = VB.endSol();
        const a = rep.after, b = rep.before;
        const d = (k, n) => n + ' ' + Math.round(b[k]) + ' > ' + Math.round(a[k]);
        const hadStorm = rep.lines.some(l => l.indexOf('Solar storm') === 0);
        if (hadStorm) VB.audio.bad();
        VB.ui.modal(this, {
            title: 'SOL ' + S.sol + ' REPORT', w: 700, h: 400, size: 16,
            body: rep.lines.join('\n') + '\n\n' + d('o2', 'OXYGEN') + '    ' + d('energy', 'POWER') + '\n' + d('food', 'FOOD') + '    ' + d('health', 'HEALTH') + '\nDOSE ' + b.dose.toFixed(0) + ' > ' + a.dose.toFixed(0) + ' mSv (limit 100)',
            buttons: [{ label: 'CONTINUE', cb: () => this.nextSol() }]
        });
    }

    nextSol() {
        const S = VB.S;
        if (S.over) return VB.go(this, 'Ending', { over: S.over });
        S.sol++;
        if (VB.chapterDone()) {
            if (S.chapter === 'moon') {
                this.busy = true;
                return VB.ui.dialog(this, [
                    { who: 'cmd', t: 'Moon outpost complete! We survived. Now we have learned enough to plan the next giant leap: MARS.' },
                    { who: 'orbi', t: 'First, we must choose WHERE to land. I have real maps from NASA Mars Trek. Let us pick a site!' }
                ], () => VB.go(this, 'Landing'));
            }
            return VB.go(this, 'Ending', { over: null });
        }
        S.ap = 3; S.did = {}; VB.rollAlert();
        this.scene.restart();
    }
};
