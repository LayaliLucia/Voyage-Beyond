/* Shared UI helpers: pixel text, buttons, bars, dialogue box, mini-game intro/result screens. */
VB.ui = {};

VB.ui.text = function (s, x, y, str, size, color, o) {
    o = o || {};
    const st = { fontFamily: VB.FONT, fontSize: (size || 16) + 'px', color: color || '#ffffff', align: o.align || 'left', lineSpacing: o.ls === undefined ? 4 : o.ls };
    if (o.w) st.wordWrap = { width: o.w, useAdvancedWrap: true };
    if (o.stroke) { st.stroke = o.stroke; st.strokeThickness = o.st || 4; }
    const t = s.add.text(x, y, str, st);
    t.setOrigin(o.ox === undefined ? 0 : o.ox, o.oy === undefined ? 0 : o.oy);
    if (o.d !== undefined) t.setDepth(o.d);
    return t;
};

VB.ui.box = function (g, x, y, w, h, fill, edge) {
    g.fillStyle(0x000000, 0.45).fillRect(x + 3, y + 3, w, h);
    g.fillStyle(edge === undefined ? 0x6f6bd6 : edge, 1).fillRect(x, y, w, h);
    g.fillStyle(fill === undefined ? 0x15142b : fill, 1).fillRect(x + 3, y + 3, w - 6, h - 6);
    return g;
};
VB.ui.panel = function (s, x, y, w, h, o) {
    o = o || {};
    const g = s.add.graphics(); VB.ui.box(g, x, y, w, h, o.fill, o.edge);
    if (o.d !== undefined) g.setDepth(o.d);
    return g;
};

VB.ui.button = function (s, x, y, w, h, label, cb, o) {
    o = o || {};
    const c = s.add.container(x, y), g = s.add.graphics();
    const t = VB.ui.text(s, 0, 0, label, o.size || 16, o.color || '#ffffff', { ox: 0.5, oy: 0.5, align: 'center', w: w - 10 });
    c.add([g, t]); c.setSize(w, h);
    let enabled = true, hover = false;
    const fill = o.fill || 0x3a37a8, hi = o.hi || 0x5753e0, edge = o.edge || 0x9a97ff;
    const draw = (press) => {
        g.clear();
        VB.ui.box(g, -w / 2, -h / 2 + (press ? 2 : 0), w, h, !enabled ? 0x2a2a3a : (hover ? hi : fill), !enabled ? 0x555566 : edge);
        t.y = press ? 2 : 0; t.setAlpha(enabled ? 1 : 0.5);
    };
    draw();
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => { hover = true; draw(); });
    c.on('pointerout', () => { hover = false; draw(); });
    c.on('pointerdown', () => { if (!enabled) return; VB.audio.click(); draw(true); });
    c.on('pointerup', () => { if (!enabled) return; draw(); if (cb) cb(); });
    c.setEnabled = (e) => { enabled = e; draw(); return c; };
    c.setLabel = (l) => { t.setText(l); return c; };
    c.label = t;
    if (o.d !== undefined) c.setDepth(o.d);
    return c;
};

VB.ui.bar = function (s, x, y, w, h, color) {
    const g = s.add.graphics();
    const api = {
        g, v: 1,
        set(v, col) {
            api.v = v; g.clear();
            g.fillStyle(0x000000, 0.65).fillRect(x, y, w, h);
            g.fillStyle(col || color, 1).fillRect(x + 1, y + 1, Math.max(0, (w - 2) * VB.clamp(v, 0, 1)), h - 2);
            g.fillStyle(0xffffff, 0.18).fillRect(x + 1, y + 1, Math.max(0, (w - 2) * VB.clamp(v, 0, 1)), 2);
            g.lineStyle(2, 0xffffff, 0.3).strokeRect(x, y, w, h);
        }
    };
    api.set(1); return api;
};

VB.ui.stars = function (s, x, y, n, total, scale) {
    total = total || 3; scale = scale || 4;
    const out = [];
    for (let i = 0; i < total; i++) {
        const st = s.add.image(x + (i - (total - 1) / 2) * 9 * scale * 1.3, y, i < n ? 'star_on' : 'star_off').setScale(scale);
        out.push(st);
    }
    return out;
};

VB.ui.toast = function (s, msg, color, y) {
    y = y || 330;
    const t = VB.ui.text(s, 450, y, msg, 16, color || '#ffd23f', { ox: 0.5, oy: 0.5, stroke: '#000', st: 5, d: 3000 });
    s.tweens.add({ targets: t, y: y - 30, alpha: 0, delay: 900, duration: 700, onComplete: () => t.destroy() });
};

/* Twinkling space background shared by menus and mini-games. */
VB.ui.space = function (s, dim) {
    const bg = s.add.tileSprite(450, 250, 900, 500, 'space').setScrollFactor(0);
    if (dim) bg.setTint(0x888899);
    const fn = () => { bg.tilePositionX += 0.25; };
    s.events.on('update', fn);
    s.events.once('shutdown', () => s.events.off('update', fn));
    return bg;
};

/* Dialogue box with portrait + typewriter. lines: [{who:'cmd'|'eng'|'sci'|'orbi'|null, t:'...'}] */
VB.ui.dialog = function (s, lines, done) {
    const D = 2000, objs = [];
    let i = 0, typing = null, full = '', n = 0, finished = false;
    const block = s.add.zone(450, 250, 900, 500).setInteractive().setDepth(D); objs.push(block);
    const g = s.add.graphics().setDepth(D + 1); objs.push(g);
    VB.ui.box(g, 10, 328, 880, 164, 0x0d0c22, 0x7773ff);
    const frame = s.add.graphics().setDepth(D + 1); objs.push(frame);
    VB.ui.box(frame, 20, 338, 148, 144, 0x000000, 0xffffff);
    const port = s.add.image(22, 340, 'b1').setOrigin(0).setScale(3).setDepth(D + 2); objs.push(port);
    const name = VB.ui.text(s, 186, 342, '', 18, '#fff', { d: D + 2 }); objs.push(name);
    const text = VB.ui.text(s, 186, 372, '', 19, '#ffffff', { w: 690, d: D + 2, ls: 6 }); objs.push(text);
    const hint = VB.ui.text(s, 872, 446, 'CLICK / SPACE >', 12, '#a9a7d8', { ox: 1, d: D + 2 }); objs.push(hint);
    s.tweens.add({ targets: hint, alpha: 0.2, yoyo: true, repeat: -1, duration: 500 });
    const skip = VB.ui.button(s, 840, 346, 90, 24, 'SKIP', () => finish(), { size: 12, d: D + 3, fill: 0x2a2850 }); objs.push(skip);

    function show() {
        const L = lines[i]; if (!L) { finish(); return; }
        const c = L.who && VB.CREW[L.who];
        if (c) { port.setTexture(c.base).setVisible(true); frame.setVisible(true); name.setText(c.name + '  -  ' + c.role).setColor(c.color); text.x = 186; text.setWordWrapWidth(690); }
        else { port.setVisible(false); frame.setVisible(false); name.setText('MISSION CONTROL').setColor('#a9a7d8'); text.x = 36; text.setWordWrapWidth(830); name.x = 36; }
        if (c) name.x = 186;
        full = L.t; n = 0; text.setText('');
        if (typing) typing.remove();
        typing = s.time.addEvent({ delay: 18, loop: true, callback: () => {
            if (!typing) return;
            n += 1; text.setText(full.slice(0, n));
            if (n % 3 === 0 && c) VB.audio.blip(c.pitch);
            if (n >= full.length) { typing.remove(); typing = null; }
        } });
    }
    function advance() {
        if (finished) return;
        if (typing) { typing.remove(); typing = null; text.setText(full); } else { i++; show(); }
    }
    function finish() {
        if (finished) return; finished = true;
        if (typing) typing.remove();
        if (key && s.input && s.input.keyboard) { key.off('down', advance); s.input.keyboard.removeKey(key); }
        if (s.input && s.input.keyboard) s.input.keyboard.off('keydown-ENTER', advance);
        objs.forEach(o => o.destroy && o.destroy());
        if (done) done();
    }
    block.on('pointerdown', advance);
    let key = null;
    if (s.input.keyboard) {
        key = s.input.keyboard.addKey('SPACE');
        key.on('down', advance);
        s.input.keyboard.on('keydown-ENTER', advance);
    }
    show();
    return { skip: finish };
};

/* Centered modal: title, body lines, one or two buttons. */
VB.ui.modal = function (s, o) {
    const D = 2500, objs = [];
    const dim = s.add.rectangle(450, 250, 900, 500, 0x000000, 0.7).setDepth(D).setInteractive(); objs.push(dim);
    const w = o.w || 640, h = o.h || 330, x = 450 - w / 2, y = 250 - h / 2;
    const g = s.add.graphics().setDepth(D + 1); VB.ui.box(g, x, y, w, h, 0x0f0e24, o.edge || 0x7773ff); objs.push(g);
    objs.push(VB.ui.text(s, 450, y + 22, o.title, 26, o.color || '#ffd23f', { ox: 0.5, d: D + 2 }));
    objs.push(VB.ui.text(s, x + 28, y + 66, o.body, o.size || 17, '#ffffff', { w: w - 56, d: D + 2, ls: 7 }));
    const close = () => objs.forEach(a => a.destroy && a.destroy());
    const btns = o.buttons || [{ label: 'OK' }];
    btns.forEach((b, k) => {
        const bw = 220, gap = 20, tot = btns.length * bw + (btns.length - 1) * gap;
        const bx = 450 - tot / 2 + bw / 2 + k * (bw + gap);
        objs.push(VB.ui.button(s, bx, y + h - 38, bw, 40, b.label, () => { close(); if (b.cb) b.cb(); }, { d: D + 3, fill: b.fill }));
    });
    return { close };
};

/* ---------- mini-game scaffolding ---------- */
VB.mini = {};

/* Intro card shown before every mini-game: what it is, how to play, which NASA data it uses. */
VB.mini.intro = function (s, cfg) {
    const D = 1500, objs = [];
    const dim = s.add.rectangle(450, 250, 900, 500, 0x05040f, 0.88).setDepth(D).setInteractive(); objs.push(dim);
    const g = s.add.graphics().setDepth(D + 1); VB.ui.box(g, 60, 30, 780, 440, 0x0f0e24, 0x7773ff); objs.push(g);
    objs.push(VB.ui.text(s, 450, 48, cfg.title, 30, '#ffd23f', { ox: 0.5, d: D + 2 }));
    objs.push(VB.ui.text(s, 450, 88, cfg.sub || '', 15, '#a9a7d8', { ox: 0.5, d: D + 2, w: 700, align: 'center' }));
    if (cfg.who) {
        const c = VB.CREW[cfg.who];
        const f = s.add.graphics().setDepth(D + 2); VB.ui.box(f, 84, 128, 120, 120, 0x000000, 0xffffff); objs.push(f);
        objs.push(s.add.image(88, 132, c.base).setOrigin(0).setScale(2.4).setDepth(D + 3));
        objs.push(VB.ui.text(s, 144, 258, c.short, 14, c.color, { ox: 0.5, d: D + 2 }));
    }
    objs.push(VB.ui.text(s, 228, 128, 'HOW TO PLAY', 16, '#6fe06f', { d: D + 2 }));
    objs.push(VB.ui.text(s, 228, 154, cfg.how, 16, '#ffffff', { w: 590, d: D + 2, ls: 6 }));
    // NASA data panel
    const d = s.add.graphics().setDepth(D + 2); VB.ui.box(d, 84, 300, 732, 100, 0x1c1b3d, 0x3a37a8); objs.push(d);
    objs.push(VB.ui.text(s, 98, 308, 'REAL NASA DATA: ' + cfg.data, 14, '#58c8ff', { d: D + 3, w: 700 }));
    objs.push(VB.ui.text(s, 98, 332, cfg.science, 14, '#dcdcff', { d: D + 3, w: 704, ls: 5 }));
    const start = () => { objs.forEach(a => a.destroy && a.destroy()); VB.audio.whoosh(); cfg.start(); };
    objs.push(VB.ui.button(s, 560, 435, 240, 44, 'START!', start, { d: D + 3, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8 }));
    objs.push(VB.ui.button(s, 330, 435, 200, 44, 'BACK', () => { VB.S.ap++; VB.go(s, 'Outpost'); }, { d: D + 3, fill: 0x4a2a2a, hi: 0x7a3a3a, edge: 0xff9a9a }));
};

/* Result card after every mini-game. */
VB.mini.end = function (s, cfg) {
    const D = 1800, objs = [], score = VB.clamp(cfg.score, 0, 1);
    const n = score >= 0.8 ? 3 : score >= 0.5 ? 2 : score > 0.15 ? 1 : 0;
    (n > 0 ? VB.audio.win : VB.audio.lose).call(VB.audio);
    objs.push(s.add.rectangle(450, 250, 900, 500, 0x000000, 0.78).setDepth(D).setInteractive());
    const g = s.add.graphics().setDepth(D + 1); VB.ui.box(g, 100, 40, 700, 420, 0x0f0e24, 0xffd23f); objs.push(g);
    objs.push(VB.ui.text(s, 450, 60, n >= 2 ? 'GREAT WORK!' : n === 1 ? 'NICE TRY!' : 'TRY AGAIN NEXT TIME', 30, '#ffd23f', { ox: 0.5, d: D + 2 }));
    VB.ui.stars(s, 450, 130, n, 3, 5).forEach(a => { a.setDepth(D + 2); objs.push(a); });
    objs.push(VB.ui.text(s, 450, 175, cfg.summary || '', 17, '#ffffff', { ox: 0.5, d: D + 2, w: 620, align: 'center' }));
    const reward = VB.applyResult(cfg.type, score);
    objs.push(VB.ui.text(s, 450, 225, reward, 28, '#6fe06f', { ox: 0.5, d: D + 2 }));
    const f = s.add.graphics().setDepth(D + 2); VB.ui.box(f, 130, 275, 640, 120, 0x1c1b3d, 0x3a37a8); objs.push(f);
    objs.push(VB.ui.text(s, 146, 283, cfg.factTitle || 'DID YOU KNOW?', 14, '#58c8ff', { d: D + 3 }));
    objs.push(VB.ui.text(s, 146, 304, cfg.fact || '', (cfg.fact || '').length > 170 ? 12 : 15, '#dcdcff', { d: D + 3, w: 610, ls: 4 }));
    objs.push(VB.ui.button(s, 450, 428, 300, 44, 'BACK TO OUTPOST', () => VB.go(s, 'Outpost'), { d: D + 3, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8 }));
};

/* Small HUD title + timer used inside mini-games. */
VB.mini.hud = function (s, title) {
    VB.ui.text(s, 12, 8, title, 18, '#ffd23f', { d: 100, stroke: '#000', st: 4 });
    const t = VB.ui.text(s, 888, 8, '', 20, '#ffffff', { ox: 1, d: 100, stroke: '#000', st: 4 });
    return t;
};
